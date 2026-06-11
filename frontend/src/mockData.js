export const mockTenants = {
  "contoso": {
    id: "contoso",
    displayName: "Contoso Corp",
    domain: "contoso.onmicrosoft.com",
    onboardedAt: "2026-01-15T08:30:00Z",
    lastScanAt: "2026-06-11T09:15:00Z",
    healthScore: 68,
    metrics: {
      users: 550,
      devices: 420,
      licensesTotal: 550,
      licensesAssigned: 478,
      potentialSavingsMonthly: 8014,
      potentialSavingsAnnual: 96168,
    },
    licensing: {
      currentLicenses: [
        { skuId: "M365_E5", name: "Microsoft 365 E5", price: 57.00, total: 350, assigned: 310 },
        { skuId: "O365_E3", name: "Office 365 E3", price: 23.00, total: 150, assigned: 120 },
        { skuId: "M365_BUS_PREM", name: "Microsoft 365 Business Premium", price: 22.00, total: 50, assigned: 48 }
      ],
      recommendations: [
        {
          id: "REC-LIC-001",
          type: "downgrade",
          title: "Downgrade underutilized E5 licenses",
          description: "80 users have Microsoft 365 E5 assigned but are only utilizing Exchange, Teams, and basic OneDrive. They do not utilize advanced security, compliance, or analytical features included in E5.",
          currentSku: "Microsoft 365 E5",
          targetSku: "Microsoft 365 Business Premium",
          affectedUsers: 80,
          currentCost: 4560,
          targetCost: 1760,
          monthlySavings: 2800,
          difficulty: "Low"
        },
        {
          id: "REC-LIC-002",
          type: "unassigned",
          title: "Reclaim unassigned subscriptions",
          description: "There are 40 unassigned Microsoft 365 E5 licenses, 30 unassigned Office 365 E3 licenses, and 2 unassigned Business Premium licenses. Reduce subscription count at next renewal.",
          currentSku: "Multiple SKUs",
          targetSku: "None",
          affectedUsers: 72,
          currentCost: 3014,
          targetCost: 0,
          monthlySavings: 3014,
          difficulty: "Low"
        },
        {
          id: "REC-LIC-003",
          type: "disabled_users",
          title: "Remove licenses from disabled accounts",
          description: "10 disabled employee accounts still have active Microsoft 365 E5 licenses assigned. Revoke licenses to stop billing.",
          currentSku: "Microsoft 365 E5",
          targetSku: "None",
          affectedUsers: 10,
          currentCost: 570,
          targetCost: 0,
          monthlySavings: 570,
          difficulty: "Low"
        },
        {
          id: "REC-LIC-004",
          type: "shared_mailbox",
          title: "Remove licenses from shared mailboxes",
          description: "5 shared mailboxes under 50GB are currently assigned Microsoft 365 E5 licenses. Shared mailboxes do not require licenses unless they exceed 50GB or need archiving.",
          currentSku: "Microsoft 365 E5",
          targetSku: "None",
          affectedUsers: 5,
          currentCost: 285,
          targetCost: 0,
          monthlySavings: 285,
          difficulty: "Low"
        }
      ]
    },
    security: {
      score: 58,
      findings: [
        {
          id: "SEC-001",
          severity: "Critical",
          category: "Identity & Access",
          title: "MFA not enabled for Global Administrators",
          description: "14 administrative accounts with Global Admin roles do not have Multi-Factor Authentication enabled or enforced via Conditional Access policies.",
          remediation: "Configure Conditional Access policy 'Require MFA for Administrators' and target all administrative directory roles.",
          impact: "Extremely high risk of credential stuffing and administrative takeover.",
          status: "Open"
        },
        {
          id: "SEC-002",
          severity: "High",
          category: "Authentication",
          title: "Legacy authentication protocols active",
          description: "IMAP, POP3, and SMTP legacy authentication protocols are enabled and actively accepting connection attempts from external networks.",
          remediation: "Enable Entra security defaults or deploy a Conditional Access policy blocking legacy authentication clients.",
          impact: "Legacy auth bypasses MFA requirements, exposing the tenant to password spray attacks.",
          status: "Open"
        },
        {
          id: "SEC-003",
          severity: "Medium",
          category: "External Access",
          title: "Unrestricted guest user access permitted",
          description: "External guest accounts have read access to directory details, including user profiles, groups, and applications.",
          remediation: "Update External Collaboration Settings in Entra ID to restrict guest user permissions to their own resources only.",
          impact: "Malicious guests can scrape tenant directory lists and map administrative targets.",
          status: "Open"
        },
        {
          id: "SEC-004",
          severity: "High",
          category: "Data Security",
          title: "Consent to high-risk OAuth apps allowed",
          description: "Standard users can consent to third-party applications requesting high-impact permission scopes (e.g., Read.All, Mail.Read) without admin approval.",
          remediation: "Configure the admin consent workflow, restricting user consent to verified publishers and requiring admin approval for all other apps.",
          impact: "High risk of OAuth consent phishing attacks granting persistent mailbox access to external threat actors.",
          status: "Open"
        },
        {
          id: "SEC-005",
          severity: "Low",
          category: "Audit Logs",
          title: "Audit log retention limited to default",
          description: "Unified Audit Logs are set to the default retention period (180 days for E5, 90 days for E3). Logs are not being forwarded to a security workspace.",
          remediation: "Configure diagnostic settings to stream audit logs to an Azure Log Analytics workspace or external SIEM.",
          impact: "Loss of forensics capability for security incidents occurring outside the retention window.",
          status: "Open"
        }
      ]
    },
    costLeakage: {
      items: [
        { category: "Inactive Users (90d+)", count: 25, sku: "Microsoft 365 E5", monthlyCost: 1425, action: "Reclaim & Delete" },
        { category: "Unassigned Licenses", count: 72, sku: "E5 (40) + E3 (30) + BP (2)", monthlyCost: 3014, action: "Reduce SKU Quantity" },
        { category: "Disabled Accounts", count: 10, sku: "Microsoft 365 E5", monthlyCost: 570, action: "Unassign Licenses" },
        { category: "Shared Mailboxes (<50GB)", count: 5, sku: "Microsoft 365 E5", monthlyCost: 285, action: "Convert & Unassign" },
        { category: "Underutilized downgrades", count: 80, sku: "E5 → Business Premium", monthlyCost: 2800, action: "Downgrade SKU" }
      ]
    },
    aiSummary: {
      overallHealth: "Contoso Corp's Microsoft 365 environment is currently operating with substantial cost inefficiency and significant security gaps. We identified $8,014/month in potential savings (representing 41.5% of total licensing expenditures) alongside 5 critical security vulnerabilities that require immediate attention.",
      costAnalysis: "The primary driver of licensing waste is overallocation of premium Microsoft 365 E5 licenses. Specifically, 80 active users are assigned E5 licenses without utilizing E5-level security or compliance tools; downgrading these to Business Premium yields $2,800/month. Additionally, 72 completely unassigned subscriptions ($3,014/month) and 10 disabled accounts with active assignments ($570/month) represent direct overhead leaks.",
      securityAnalysis: "From a security posture perspective, the absence of enforced Multi-Factor Authentication (MFA) for 14 administrative accounts exposes Contoso to severe compromise risks. Furthermore, active legacy authentication protocols (IMAP/POP3) circumvent standard controls and must be blocked using Conditional Access. Addressing these security concerns immediately is critical.",
      recommendations: [
        "1. Immediately deploy a Conditional Access policy requiring MFA for all administrative roles.",
        "2. Downgrade the 80 underutilizing E5 users to Microsoft 365 Business Premium at the next billing cycle.",
        "3. Cancel the 72 unassigned subscriptions to prevent recurring monthly billing.",
        "4. Automate the license removal workflow for offboarded (disabled) users.",
        "5. Block legacy authentication protocols tenant-wide."
      ]
    }
  },
  "acme": {
    id: "acme",
    displayName: "Acme Corporation",
    domain: "acme.org",
    onboardedAt: "2026-03-10T11:00:00Z",
    lastScanAt: "2026-06-11T09:28:00Z",
    healthScore: 88,
    metrics: {
      users: 180,
      devices: 150,
      licensesTotal: 190,
      licensesAssigned: 178,
      potentialSavingsMonthly: 1420,
      potentialSavingsAnnual: 17040,
    },
    licensing: {
      currentLicenses: [
        { skuId: "M365_BUS_PREM", name: "Microsoft 365 Business Premium", price: 22.00, total: 170, assigned: 160 },
        { skuId: "M365_E3", name: "Microsoft 365 E3", price: 36.00, total: 20, assigned: 18 }
      ],
      recommendations: [
        {
          id: "REC-LIC-101",
          type: "unassigned",
          title: "Reclaim unassigned subscriptions",
          description: "10 unassigned Microsoft 365 Business Premium licenses are active. Reduce count to avoid waste.",
          currentSku: "Business Premium",
          targetSku: "None",
          affectedUsers: 10,
          currentCost: 220,
          targetCost: 0,
          monthlySavings: 220,
          difficulty: "Low"
        },
        {
          id: "REC-LIC-102",
          type: "downgrade",
          title: "Downgrade underutilized E3 licenses",
          description: "12 users with Microsoft 365 E3 can be downgraded to Business Premium since they are standard users and do not require E3 specific limits.",
          currentSku: "Microsoft 365 E3",
          targetSku: "Microsoft 365 Business Premium",
          affectedUsers: 12,
          currentCost: 432,
          targetCost: 264,
          monthlySavings: 168,
          difficulty: "Medium"
        },
        {
          id: "REC-LIC-103",
          type: "inactive_users",
          title: "Revoke licenses for inactive users",
          description: "11 accounts have not accessed M365 services in over 120 days. De-provision licenses.",
          currentSku: "Business Premium (10) + E3 (1)",
          targetSku: "None",
          affectedUsers: 11,
          currentCost: 256,
          targetCost: 0,
          monthlySavings: 256,
          difficulty: "Low"
        }
      ]
    },
    security: {
      score: 84,
      findings: [
        {
          id: "SEC-101",
          severity: "High",
          category: "Identity & Access",
          title: "MFA not enforced for guest users",
          description: "External guest accounts can log in to SharePoint and Teams without multi-factor verification.",
          remediation: "Create a Conditional Access policy enforcing MFA for all external guests.",
          impact: "Guest user compromise could lead to data exfiltration from collaboration channels.",
          status: "Open"
        },
        {
          id: "SEC-102",
          severity: "Medium",
          category: "Devices",
          title: "Non-compliant device access enabled",
          description: "Devices not enrolled or flagged non-compliant in Intune are still allowed to access corporate email.",
          remediation: "Create Conditional Access policy restricting exchange access to compliant devices.",
          impact: "Unmanaged devices can sync corporate data, causing data leakages.",
          status: "Open"
        }
      ]
    },
    costLeakage: {
      items: [
        { category: "Inactive Users (90d+)", count: 11, sku: "Business Premium (10) + E3 (1)", monthlyCost: 256, action: "Reclaim & Suspend" },
        { category: "Unassigned Licenses", count: 12, sku: "Business Premium (10) + E3 (2)", monthlyCost: 292, action: "Reduce SKU Quantity" },
        { category: "Disabled Accounts", count: 4, sku: "Business Premium", monthlyCost: 88, action: "Unassign Licenses" },
        { category: "Underutilized downgrades", count: 12, sku: "E3 → Business Premium", monthlyCost: 168, action: "Downgrade SKU" }
      ]
    },
    aiSummary: {
      overallHealth: "Acme Corporation has configured a highly resilient M365 environment with a solid security posture (84/100). However, minor operational efficiencies can unlock $1,420/month in licensing cost reductions.",
      costAnalysis: "The primary optimization recommendation is the downgrade of 12 underutilized E3 licenses to Business Premium, saving $168/month, and the cancelation of 12 unassigned subscriptions ($292/month). Unlinking licenses from disabled employees or long-term inactive accounts ($344/month) completes the immediate saving steps.",
      securityAnalysis: "Security risks are low overall, but a gap exists regarding guest user access. Guest users currently access Teams without MFA. Applying Conditional Access rules to require MFA for guests is highly recommended.",
      recommendations: [
        "1. Enable MFA enforcement for all external Guest accounts via Conditional Access.",
        "2. Downgrade the 12 underutilizing E3 users to Business Premium.",
        "3. Terminate unused Business Premium and E3 licenses.",
        "4. Enforce compliant device policies for corporate email access."
      ]
    }
  }
};
