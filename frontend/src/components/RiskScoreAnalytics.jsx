import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function RiskScoreAnalytics({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/investigation/risk-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!analytics) return <div className="loading">No data available</div>;

  // Prepare chart data
  const scoreDistribution = analytics.score_distribution || [];
  const riskBreakdown = analytics.risk_breakdown || [];
  const modelComparison = analytics.model_comparison || {};

  // Model comparison data for radar chart
  const radarData = Object.entries(modelComparison).map(([name, value]) => ({
    name: name.toUpperCase(),
    value: (value * 100).toFixed(2),
    fullValue: value
  }));

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return '#ff4444';
      case 'High': return '#ff9800';
      case 'Medium': return '#ffc107';
      case 'Low': return '#4caf50';
      default: return '#999';
    }
  };

  return (
    <div className="risk-analytics-container">
      <h2>📊 Risk Score Analytics</h2>

      <div className="analytics-summary">
        {riskBreakdown.map((breakdown) => (
          <div key={breakdown.risk_level} className="summary-card">
            <div className="card-header" style={{ borderLeftColor: getRiskColor(breakdown.risk_level) }}>
              <div className="risk-level">{breakdown.risk_level}</div>
              <div className="badge" style={{ backgroundColor: getRiskColor(breakdown.risk_level), color: 'white' }}>
                {breakdown.count}
              </div>
            </div>
            <div className="card-body">
              <div className="stat-row">
                <span>Avg Score:</span>
                <strong>{(breakdown.average_score * 100).toFixed(0)}%</strong>
              </div>
              <div className="stat-row">
                <span>Total Amount:</span>
                <strong>${breakdown.total_amount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="score_bucket"
                label={{ value: 'Score Range', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis label={{ value: 'Transaction Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" fill="#2196F3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Model Scores Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ddd" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Radar
                name="Average Score (%)"
                dataKey="value"
                stroke="#ff9800"
                fill="#ff9800"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
                formatter={(value) => `${value}%`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="model-comparison-table">
        <h3>Model Performance Metrics</h3>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Average Score</th>
              <th>Score %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {radarData.map((model) => (
              <tr key={model.name}>
                <td className="model-name">{model.name}</td>
                <td className="score-value">{model.fullValue.toFixed(4)}</td>
                <td className="score-percent">{model.value}%</td>
                <td>
                  <span className="status-badge" style={{
                    backgroundColor: model.fullValue >= 0.6 ? '#f44336' : model.fullValue >= 0.4 ? '#ff9800' : '#4caf50',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {model.fullValue >= 0.6 ? 'Active' : 'Stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="risk-breakdown-table">
        <h3>Risk Level Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Risk Level</th>
              <th>Count</th>
              <th>Percentage</th>
              <th>Avg Score</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {riskBreakdown.map((breakdown) => {
              const totalCount = riskBreakdown.reduce((sum, r) => sum + r.count, 0);
              const percentage = ((breakdown.count / totalCount) * 100).toFixed(2);
              return (
                <tr key={breakdown.risk_level} style={{
                  borderLeftColor: getRiskColor(breakdown.risk_level),
                  borderLeft: '4px solid',
                  backgroundColor: breakdown.risk_level === 'Critical' ? 'rgba(255, 68, 68, 0.05)' : 'white'
                }}>
                  <td>
                    <span className="risk-badge" style={{
                      backgroundColor: getRiskColor(breakdown.risk_level),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {breakdown.risk_level}
                    </span>
                  </td>
                  <td className="count">{breakdown.count}</td>
                  <td className="percentage">{percentage}%</td>
                  <td className="score">{(breakdown.average_score * 100).toFixed(1)}%</td>
                  <td className="amount">${breakdown.total_amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .risk-analytics-container {
          padding: 20px;
          background: #fafafa;
          border-radius: 8px;
        }

        .analytics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-left: 4px solid;
          background-color: #f9f9f9;
        }

        .risk-level {
          font-weight: bold;
          font-size: 1rem;
        }

        .badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .card-body {
          padding: 12px 16px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #eee;
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-row span {
          color: #666;
          font-size: 0.9rem;
        }

        .stat-row strong {
          color: #333;
          font-size: 0.95rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-container h3 {
          margin-top: 0;
        }

        .model-comparison-table,
        .risk-breakdown-table {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        table th {
          background-color: #f0f0f0;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #ddd;
        }

        table td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
        }

        table tbody tr:hover {
          background-color: #f9f9f9;
        }

        .model-name {
          font-weight: bold;
          color: #2196F3;
          font-family: monospace;
        }

        .score-value {
          font-family: monospace;
          color: #666;
        }

        .score-percent {
          font-weight: bold;
          color: #ff9800;
        }

        .count {
          font-weight: bold;
          color: #333;
        }

        .percentage {
          color: #666;
        }

        .score {
          font-weight: bold;
          font-family: monospace;
        }

        .amount {
          color: #4caf50;
          font-weight: bold;
        }

        .loading, .error {
          padding: 20px;
          border-radius: 4px;
          text-align: center;
        }

        .loading {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .error {
          background-color: #ffebee;
          color: #c62828;
        }
      `}</style>
    </div>
  );
}
