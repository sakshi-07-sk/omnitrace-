import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function FraudInvestigationDashboard({ token }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardMetrics();
    const interval = setInterval(fetchDashboardMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/investigation/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!metrics) return <div className="loading">No data available</div>;

  const riskColors = { 'Critical': '#ff4444', 'High': '#ff9800', 'Medium': '#ffc107', 'Low': '#4caf50' };
  const riskDistributionData = Object.entries(metrics.risk_distribution).map(([level, count]) => ({
    name: level,
    value: count,
    fill: riskColors[level] || '#666'
  }));

  const metricCards = [
    { label: 'Total Transactions', value: metrics.total_transactions, color: '#2196F3' },
    { label: 'Fraud Cases', value: metrics.fraud_count, color: '#f44336' },
    { label: 'Fraud Rate', value: `${metrics.fraud_rate_percent}%`, color: '#ff9800' },
    { label: 'Pending Investigations', value: metrics.pending_investigations, color: '#9c27b0' },
    { label: 'High-Risk Pending', value: metrics.high_risk_pending, color: '#e91e63' },
    { label: 'Avg Fraud Score', value: metrics.average_fraud_score, color: '#3f51b5' }
  ];

  return (
    <div className="dashboard-container">
      <h2>🔍 Fraud Investigation Dashboard</h2>
      
      <div className="metrics-grid">
        {metricCards.map((card, idx) => (
          <div key={idx} className="metric-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div className="metric-label">{card.label}</div>
            <div className="metric-value" style={{ color: card.color }}>
              {typeof card.value === 'number' && card.value.toLocaleString()}
              {typeof card.value === 'string' && card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskDistributionData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Alert Summary</h3>
          <div className="summary-stats">
            <div className="stat-row">
              <span>Total Fraud Amount:</span>
              <strong>${metrics.total_fraud_amount.toFixed(2)}</strong>
            </div>
            <div className="stat-row">
              <span>Investigation Queue:</span>
              <strong style={{ color: '#9c27b0' }}>{metrics.pending_investigations}</strong>
            </div>
            <div className="stat-row">
              <span>Critical Alerts:</span>
              <strong style={{ color: '#f44336' }}>{metrics.risk_distribution.Critical || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
