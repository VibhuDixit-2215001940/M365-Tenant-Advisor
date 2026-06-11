// ============================================================
//  graphClient.js — Microsoft Graph API Integration
//  OAuth 2.0 Client Credentials flow + Graph API data fetchers
//  Transforms raw Graph responses into our tenant data schema.
// ============================================================

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const GRAPH_BETA = "https://graph.microsoft.com/beta";

// ── Token Cache ──────────────────────────────────────────────
const tokenCache = {}; // { tenantId: { token, expiresAt } }

/**
 * Acquire an access token using OAuth 2.0 Client Credentials grant.
 */
export async function getAccessToken(tenantId, clientId, clientSecret) {
  // Return cached token if still valid
  const cached = tokenCache[tenantId];
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.token;
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Auth failed: ${err.error_description || err.error || res.statusText}`
    );
  }

  const data = await res.json();
  tokenCache[tenantId] = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Validate credentials by attempting token acquisition.
 * Returns { valid: true, displayName, domain } or { valid: false, error }.
 */
export async function validateCredentials(tenantId, clientId, clientSecret) {
  try {
    const token = await getAccessToken(tenantId, clientId, clientSecret);

    // Try to read org info to get display name
    const orgRes = await graphGet(token, "/organization");
    const org = orgRes.value?.[0] || {};

    return {
      valid: true,
      displayName: org.displayName || `Tenant ${tenantId.substring(0, 8)}`,
      domain: org.verifiedDomains?.find((d) => d.isDefault)?.name || tenantId,
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// ── Graph API Helpers ────────────────────────────────────────

async function graphGet(token, path, base = GRAPH_BASE) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Graph ${path} failed (${res.status}): ${errBody.substring(0, 200)}`);
  }
  return res.json();
}

// ── Data Fetchers ────────────────────────────────────────────

/**
 * Fetch user directory data.
 * Returns { totalUsers, disabledUsers, guestUsers, inactiveUsers, deviceCount }
 */
export async function fetchUsers(token, onLog) {
  onLog("Fetching user directory — enumerating all accounts...");

  // Get all users with select fields
  let users = [];
  let nextLink = "/users?$select=id,displayName,userPrincipalName,accountEnabled,userType,signInActivity,assignedLicenses&$top=999";

  while (nextLink) {
    const data = await graphGet(token, nextLink);
    users = users.concat(data.value || []);
    nextLink = data["@odata.nextLink"]
      ? data["@odata.nextLink"].replace(GRAPH_BASE, "")
      : null;
    // Safety cap for very large tenants
    if (users.length > 10000) break;
  }

  onLog(`Found ${users.length} user accounts in directory.`);

  const totalUsers = users.filter((u) => u.userType !== "Guest").length;
  const guestUsers = users.filter((u) => u.userType === "Guest").length;
  const disabledUsers = users.filter((u) => !u.accountEnabled && u.userType !== "Guest").length;

  // Inactive: last sign-in > 90 days ago
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const inactiveUsers = users.filter((u) => {
    if (!u.accountEnabled) return false;
    const lastSignIn = u.signInActivity?.lastSignInDateTime;
    if (!lastSignIn) return true; // never signed in
    return new Date(lastSignIn) < ninetyDaysAgo;
  }).length;

  onLog(`Identified ${disabledUsers} disabled accounts, ${inactiveUsers} inactive (90d+), ${guestUsers} guests.`);

  // Devices count
  let deviceCount = 0;
  try {
    const devData = await graphGet(token, "/devices?$count=true&$top=1", GRAPH_BASE);
    deviceCount = devData["@odata.count"] || devData.value?.length || 0;
  } catch (_) {
    // Permission may not be granted
    onLog("Note: Device count unavailable (Directory.Read.All permission may be needed).");
  }

  return { totalUsers, disabledUsers, guestUsers, inactiveUsers, deviceCount, rawUsers: users };
}

/**
 * Fetch license/subscription data.
 * Returns { licenses, unassigned, totalLicenses, assignedLicenses, recommendations }
 */
export async function fetchLicenses(token, onLog, userData) {
  onLog("Auditing Microsoft 365 SKU subscriptions...");

  const skuData = await graphGet(token, "/subscribedSkus");
  const skus = skuData.value || [];

  // Known SKU → price mapping (approximate list prices USD)
  const SKU_PRICES = {
    "ENTERPRISEPREMIUM": { name: "Microsoft 365 E5", price: 57.0 },
    "SPE_E5": { name: "Microsoft 365 E5", price: 57.0 },
    "ENTERPRISEPACK": { name: "Office 365 E3", price: 23.0 },
    "SPE_E3": { name: "Microsoft 365 E3", price: 36.0 },
    "O365_BUSINESS_PREMIUM": { name: "Microsoft 365 Business Premium", price: 22.0 },
    "SPB": { name: "Microsoft 365 Business Premium", price: 22.0 },
    "O365_BUSINESS_ESSENTIALS": { name: "Microsoft 365 Business Basic", price: 6.0 },
    "SMB_BUSINESS": { name: "Microsoft 365 Apps for business", price: 12.5 },
    "EXCHANGESTANDARD": { name: "Exchange Online Plan 1", price: 4.0 },
    "EXCHANGEENTERPRISE": { name: "Exchange Online Plan 2", price: 8.0 },
    "POWER_BI_PRO": { name: "Power BI Pro", price: 10.0 },
    "PROJECTPREMIUM": { name: "Project Plan 5", price: 55.0 },
    "VISIOCLIENT": { name: "Visio Plan 2", price: 15.0 },
    "EMS_E5": { name: "Enterprise Mobility + Security E5", price: 16.40 },
    "EMSPREMIUM": { name: "Enterprise Mobility + Security E5", price: 16.40 },
    "EMS": { name: "Enterprise Mobility + Security E3", price: 10.60 },
  };

  const licenses = skus
    .filter((s) => s.capabilityStatus === "Enabled" && s.prepaidUnits?.enabled > 0)
    .map((s) => {
      const known = SKU_PRICES[s.skuPartNumber] || null;
      const total = s.prepaidUnits?.enabled || 0;
      const assigned = s.consumedUnits || 0;
      return {
        skuId: s.skuPartNumber,
        name: known?.name || s.skuPartNumber.replace(/_/g, " "),
        price: known?.price || 0,
        total,
        assigned,
        unassigned: total - assigned,
      };
    });

  const totalLicenses = licenses.reduce((sum, l) => sum + l.total, 0);
  const assignedLicenses = licenses.reduce((sum, l) => sum + l.assigned, 0);
  const totalUnassigned = licenses.reduce((sum, l) => sum + l.unassigned, 0);
  const unassignedCost = licenses.reduce((sum, l) => sum + l.unassigned * l.price, 0);

  onLog(`Found ${licenses.length} active SKUs — ${totalLicenses} total licenses, ${assignedLicenses} assigned, ${totalUnassigned} unassigned.`);

  // Generate recommendations
  const recommendations = [];

  // Rec: Reclaim unassigned
  if (totalUnassigned > 0) {
    const skuBreakdown = licenses
      .filter((l) => l.unassigned > 0)
      .map((l) => `${l.name} (${l.unassigned})`)
      .join(", ");
    recommendations.push({
      id: "REC-LIC-UNASSIGNED",
      type: "unassigned",
      title: "Reclaim unassigned subscriptions",
      description: `${totalUnassigned} unassigned licenses detected: ${skuBreakdown}. Reduce subscription counts at next renewal.`,
      currentSku: "Multiple SKUs",
      targetSku: "None",
      affectedUsers: totalUnassigned,
      currentCost: Math.round(unassignedCost),
      targetCost: 0,
      monthlySavings: Math.round(unassignedCost),
      difficulty: "Low",
    });
  }

  // Rec: Remove licenses from disabled accounts
  const disabledWithLicenses = (userData?.rawUsers || []).filter(
    (u) => !u.accountEnabled && u.assignedLicenses?.length > 0
  ).length;

  if (disabledWithLicenses > 0) {
    // Estimate E5 cost as worst case
    const estimatedCost = disabledWithLicenses * 57;
    recommendations.push({
      id: "REC-LIC-DISABLED",
      type: "disabled_users",
      title: "Remove licenses from disabled accounts",
      description: `${disabledWithLicenses} disabled accounts still have active license assignments. Revoke to stop billing.`,
      currentSku: "Various",
      targetSku: "None",
      affectedUsers: disabledWithLicenses,
      currentCost: estimatedCost,
      targetCost: 0,
      monthlySavings: estimatedCost,
      difficulty: "Low",
    });
  }

  // Rec: Inactive users
  if (userData?.inactiveUsers > 0) {
    const estimatedCost = userData.inactiveUsers * 30; // average
    recommendations.push({
      id: "REC-LIC-INACTIVE",
      type: "inactive_users",
      title: "Revoke licenses for inactive users",
      description: `${userData.inactiveUsers} accounts have not signed in for over 90 days. Consider de-provisioning licenses.`,
      currentSku: "Various",
      targetSku: "None",
      affectedUsers: userData.inactiveUsers,
      currentCost: estimatedCost,
      targetCost: 0,
      monthlySavings: estimatedCost,
      difficulty: "Low",
    });
  }

  onLog(`Generated ${recommendations.length} license optimization recommendations.`);

  return {
    currentLicenses: licenses,
    totalLicenses,
    assignedLicenses,
    recommendations,
    potentialSavingsMonthly: recommendations.reduce((s, r) => s + r.monthlySavings, 0),
  };
}

/**
 * Fetch security posture data.
 * Returns { score, findings }
 */
export async function fetchSecurity(token, onLog) {
  onLog("Running security posture audit...");

  let score = 50; // default if Secure Score unavailable
  const findings = [];

  // 1. Try Secure Score
  try {
    const ssData = await graphGet(token, "/security/secureScores?$top=1");
    if (ssData.value?.length > 0) {
      const ss = ssData.value[0];
      score = Math.round((ss.currentScore / ss.maxScore) * 100);
      onLog(`Microsoft Secure Score: ${ss.currentScore}/${ss.maxScore} (${score}%)`);
    }
  } catch (_) {
    onLog("Note: Secure Score unavailable (SecurityEvents.Read.All permission may be needed). Using estimated score.");
  }

  // 2. Check Conditional Access Policies
  try {
    onLog("Auditing Conditional Access policies...");
    const caData = await graphGet(token, "/identity/conditionalAccess/policies");
    const policies = caData.value || [];
    const enabledPolicies = policies.filter((p) => p.state === "enabled");

    onLog(`Found ${policies.length} CA policies (${enabledPolicies.length} enabled).`);

    // Check for MFA policy
    const hasMfaPolicy = enabledPolicies.some(
      (p) => p.grantControls?.builtInControls?.includes("mfa")
    );

    if (!hasMfaPolicy) {
      findings.push({
        id: "SEC-MFA-MISSING",
        severity: "Critical",
        category: "Identity & Access",
        title: "No Conditional Access policy enforcing MFA detected",
        description: "No enabled Conditional Access policy was found that requires Multi-Factor Authentication. This leaves all accounts vulnerable to credential-based attacks.",
        remediation: "Create a Conditional Access policy requiring MFA for all users, or at minimum for all administrative roles.",
        impact: "Extremely high risk of account compromise and administrative takeover.",
        status: "Open",
      });
    }

    // Check for legacy auth blocking
    const blocksLegacy = enabledPolicies.some(
      (p) => p.conditions?.clientAppTypes?.includes("exchangeActiveSync") ||
             p.conditions?.clientAppTypes?.includes("other")
    );

    if (!blocksLegacy) {
      findings.push({
        id: "SEC-LEGACY-AUTH",
        severity: "High",
        category: "Authentication",
        title: "Legacy authentication protocols not blocked",
        description: "No Conditional Access policy was found blocking legacy authentication protocols (IMAP, POP3, SMTP, ActiveSync).",
        remediation: "Deploy a Conditional Access policy blocking legacy authentication clients for all users.",
        impact: "Legacy auth bypasses MFA requirements, exposing the tenant to password spray attacks.",
        status: "Open",
      });
    }

    if (enabledPolicies.length === 0) {
      findings.push({
        id: "SEC-NO-CA",
        severity: "Critical",
        category: "Identity & Access",
        title: "No Conditional Access policies enabled",
        description: "The tenant has zero enabled Conditional Access policies. This means no automated access controls are protecting user sign-ins.",
        remediation: "Deploy baseline Conditional Access policies: require MFA for admins, block legacy auth, require compliant devices.",
        impact: "Complete absence of automated identity protection.",
        status: "Open",
      });
    }
  } catch (_) {
    onLog("Note: Conditional Access audit unavailable (Policy.Read.All permission may be needed).");
    findings.push({
      id: "SEC-CA-UNREADABLE",
      severity: "Medium",
      category: "Identity & Access",
      title: "Unable to audit Conditional Access policies",
      description: "The application does not have sufficient permissions to read Conditional Access policies. Grant Policy.Read.All permission.",
      remediation: "Add Policy.Read.All API permission to the App Registration and grant admin consent.",
      impact: "Cannot assess identity protection posture.",
      status: "Open",
    });
  }

  // 3. Check default settings / Security defaults
  try {
    onLog("Checking authentication methods and security defaults...");
    const authPolicies = await graphGet(
      token,
      "/policies/identitySecurityDefaultsEnforcingPolicy"
    );
    if (authPolicies.isEnabled) {
      onLog("Security Defaults are enabled (good baseline).");
    } else {
      onLog("Security Defaults are disabled.");
      // Only flag if no CA policies exist
      if (findings.some((f) => f.id === "SEC-NO-CA")) {
        findings.push({
          id: "SEC-DEFAULTS-OFF",
          severity: "High",
          category: "Authentication",
          title: "Security Defaults disabled with no CA replacement",
          description: "Azure Security Defaults are disabled and no Conditional Access policies are enabled, leaving the tenant without baseline MFA or legacy auth protection.",
          remediation: "Either enable Security Defaults or deploy equivalent Conditional Access policies.",
          impact: "No MFA enforcement for any users including administrators.",
          status: "Open",
        });
      }
    }
  } catch (_) {
    onLog("Note: Security defaults status unavailable.");
  }

  // Adjust score based on findings
  const severityPenalty = { Critical: 12, High: 8, Medium: 4, Low: 2 };
  const totalPenalty = findings.reduce(
    (sum, f) => sum + (severityPenalty[f.severity] || 0), 0
  );
  score = Math.max(10, Math.min(100, score - totalPenalty));

  onLog(`Security audit complete. Posture score: ${score}/100 with ${findings.length} findings.`);

  return { score, findings };
}

/**
 * Build cost leakage breakdown from user + license data.
 */
export function buildCostLeakage(userData, licenseData) {
  const items = [];

  if (userData.inactiveUsers > 0) {
    items.push({
      category: "Inactive Users (90d+)",
      count: userData.inactiveUsers,
      sku: "Various",
      monthlyCost: userData.inactiveUsers * 30,
      action: "Reclaim & Suspend",
    });
  }

  const totalUnassigned = licenseData.currentLicenses.reduce((s, l) => s + l.unassigned, 0);
  if (totalUnassigned > 0) {
    const unassignedCost = licenseData.currentLicenses.reduce(
      (s, l) => s + l.unassigned * l.price, 0
    );
    items.push({
      category: "Unassigned Licenses",
      count: totalUnassigned,
      sku: licenseData.currentLicenses
        .filter((l) => l.unassigned > 0)
        .map((l) => `${l.name.split(" ").pop()} (${l.unassigned})`)
        .join(" + "),
      monthlyCost: Math.round(unassignedCost),
      action: "Reduce SKU Quantity",
    });
  }

  if (userData.disabledUsers > 0) {
    items.push({
      category: "Disabled Accounts",
      count: userData.disabledUsers,
      sku: "Various",
      monthlyCost: userData.disabledUsers * 57,
      action: "Unassign Licenses",
    });
  }

  return { items };
}

/**
 * Build AI summary from collected data.
 */
export function buildAISummary(tenantName, userData, licenseData, securityData, costData) {
  const totalMonthlySavings = licenseData.potentialSavingsMonthly;
  const totalCostLeakage = costData.items.reduce((s, i) => s + i.monthlyCost, 0);

  const overallHealth = `${tenantName}'s Microsoft 365 environment has been analyzed. ` +
    `The tenant has ${userData.totalUsers} users across ${licenseData.currentLicenses.length} active SKU subscriptions. ` +
    `We identified approximately $${totalMonthlySavings.toLocaleString()}/month in potential licensing savings ` +
    `and ${securityData.findings.length} security findings requiring attention.`;

  const costAnalysis = `License cost analysis reveals ${licenseData.currentLicenses.reduce((s, l) => s + l.unassigned, 0)} unassigned subscriptions ` +
    `and ${userData.inactiveUsers} inactive users (90+ days). ` +
    `Total estimated monthly cost leakage: $${totalCostLeakage.toLocaleString()}/month ($${(totalCostLeakage * 12).toLocaleString()}/year).`;

  const securityAnalysis = `Security posture score: ${securityData.score}/100. ` +
    `${securityData.findings.filter((f) => f.severity === "Critical").length} critical and ` +
    `${securityData.findings.filter((f) => f.severity === "High").length} high severity findings detected. ` +
    (securityData.findings.length > 0
      ? `Primary concern: ${securityData.findings[0].title}.`
      : "No critical security issues detected.");

  const recommendations = [];
  if (securityData.findings.some((f) => f.id.includes("MFA"))) {
    recommendations.push("1. Deploy a Conditional Access policy requiring MFA for all administrative roles immediately.");
  }
  if (licenseData.recommendations.length > 0) {
    recommendations.push(`2. ${licenseData.recommendations[0].title} to save $${licenseData.recommendations[0].monthlySavings}/month.`);
  }
  if (securityData.findings.some((f) => f.id.includes("LEGACY"))) {
    recommendations.push("3. Block legacy authentication protocols tenant-wide via Conditional Access.");
  }
  if (userData.inactiveUsers > 0) {
    recommendations.push(`4. Review and de-provision licenses for ${userData.inactiveUsers} inactive accounts.`);
  }
  if (recommendations.length === 0) {
    recommendations.push("1. Continue monitoring tenant health through regular scans.");
  }

  return { overallHealth, costAnalysis, securityAnalysis, recommendations };
}
