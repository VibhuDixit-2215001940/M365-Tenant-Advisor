import React from 'react';
import { TrendingDown, ShieldAlert, BadgeDollarSign, ArrowUpRight } from 'lucide-react';

export default function CostLeakage({ tenant }) {
  const { items } = tenant.costLeakage;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const totalWaste = items.reduce((sum, item) => sum + item.monthlyCost, 0);

  return (
    <div className="fade-in-up">
      {/* Page Header */}
      <div className="dashboard-hero" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>Cost Leakage Analysis</h1>
        <p className="dashboard-subtitle">Audit disabled employees, dormant accounts, and inactive mailboxes holding active monthly subscriptions.</p>
      </div>

      {/* Summary Banner */}
      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--accent-red)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Revenue Leaked</span>
          <div style={{
            fontSize: '3rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--accent-red)',
            margin: '4px 0'
          }}>
            {formatCurrency(totalWaste)}
            <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Identified direct subscription wastes that can be revoked immediately.</p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--accent-teal)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Retrievable Budget</span>
          <div style={{
            fontSize: '3rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--accent-teal)',
            margin: '4px 0'
          }}>
            {formatCurrency(totalWaste * 12)}
            <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/yr</span>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Potential savings based on current tenant subscription rates.</p>
        </div>
      </div>

      {/* Cost Leakages Details Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BadgeDollarSign size={22} color="var(--accent-red)" />
            Identified Leakages & Idle Subscriptions
          </h3>
          <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
            {items.length} Waste Vectors
          </span>
        </div>

        <div className="lux-table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="lux-table">
            <thead>
              <tr>
                <th>Leakage Category</th>
                <th>Affected Accounts</th>
                <th>Assigned Subscription SKU</th>
                <th>Monthly Leakage</th>
                <th>Annual Cost</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="dot" style={{ 
                        backgroundColor: item.category.includes('Inactive') ? 'var(--accent-orange)' : 
                                         item.category.includes('Unassigned') ? 'var(--accent-blue)' : 
                                         item.category.includes('Disabled') ? 'var(--accent-red)' : 
                                         'var(--accent-purple)'
                      }} />
                      {item.category}
                    </div>
                  </td>
                  <td>{item.count} users</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.sku}</td>
                  <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{formatCurrency(item.monthlyCost)}</td>
                  <td>{formatCurrency(item.monthlyCost * 12)}</td>
                  <td>
                    <span className="badge badge-low" style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {item.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory Note */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '32px', padding: '24px', background: 'rgba(255, 159, 10, 0.03)', border: '1px solid rgba(255, 159, 10, 0.15)', borderRadius: '16px' }}>
        <ShieldAlert size={24} color="var(--accent-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '4px' }}>Tenant Advisory Note</h4>
          <p style={{ fontSize: '0.85rem' }}>
            Microsoft allows subscription reductions during annual renewals or mid-term upgrades. Unassigned licenses should be canceled immediately at your upcoming renewal anniversary. For disabled or inactive accounts, licenses can be unassigned immediately to return seats back to the tenant pool, preventing extra purchases.
          </p>
        </div>
      </div>

    </div>
  );
}
