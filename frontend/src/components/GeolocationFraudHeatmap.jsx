import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function GeolocationFraudHeatmap({ token }) {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('fraud_count');

  useEffect(() => {
    fetchHeatmapData();
    const interval = setInterval(fetchHeatmapData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch(`${API_BASE}/investigation/geolocation-heatmap`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      const data = await response.json();
      setHeatmapData(data.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical': return '#ff4444';
      case 'High': return '#ff9800';
      case 'Medium': return '#ffc107';
      case 'Low': return '#4caf50';
      default: return '#999';
    }
  };

  const getSortedLocations = () => {
    if (!heatmapData?.locations) return [];
    const sorted = [...heatmapData.locations];
    if (sortBy === 'fraud_count') {
      return sorted.sort((a, b) => b.fraud_count - a.fraud_count);
    } else if (sortBy === 'fraud_rate') {
      return sorted.sort((a, b) => b.fraud_rate_percent - a.fraud_rate_percent);
    } else if (sortBy === 'transaction_count') {
      return sorted.sort((a, b) => b.transaction_count - a.transaction_count);
    }
    return sorted;
  };

  const sortedLocations = getSortedLocations();
  const chartData = sortedLocations.map(loc => ({
    location: loc.location,
    'Fraud Count': loc.fraud_count,
    'Legitimate': loc.transaction_count - loc.fraud_count,
    'Fraud Rate %': parseFloat((loc.fraud_rate_percent).toFixed(2))
  }));

  if (loading) return <div className="loading">Loading geolocation data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!heatmapData) return <div className="loading">No data available</div>;

  const totalFraudAmount = sortedLocations.reduce((sum, loc) => sum + loc.fraud_amount, 0);
  const averageFraudScore = sortedLocations.length > 0
    ? (sortedLocations.reduce((sum, loc) => sum + loc.average_fraud_score, 0) / sortedLocations.length).toFixed(3)
    : 0;

  return (
    <div className="geolocation-container">
      <div className="geo-header">
        <h2>🌍 Geolocation Fraud Heatmap</h2>
        <div className="geo-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="fraud_count">Fraud Count (High to Low)</option>
            <option value="fraud_rate">Fraud Rate % (High to Low)</option>
            <option value="transaction_count">Transaction Volume</option>
          </select>
        </div>
      </div>

      <div className="geo-summary">
        <div className="summary-card">
          <div className="summary-label">Unique Locations</div>
          <div className="summary-value" style={{ color: '#2196F3' }}>
            {heatmapData.total_unique_locations}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Fraud Amount</div>
          <div className="summary-value" style={{ color: '#f44336' }}>
            ${totalFraudAmount.toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Average Fraud Score</div>
          <div className="summary-value" style={{ color: '#ff9800' }}>
            {averageFraudScore}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Fraud Distribution by Location</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="location"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar dataKey="Fraud Count" fill="#ff4444" />
            <Bar dataKey="Legitimate" fill="#4caf50" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="locations-table">
        <h3>Location Risk Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th>Transactions</th>
              <th>Fraud Count</th>
              <th>Fraud Rate</th>
              <th>Avg Score</th>
              <th>Fraud Amount</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {sortedLocations.map((loc) => (
              <tr key={loc.location} className="table-row">
                <td className="location-name">{loc.location}</td>
                <td>{loc.transaction_count}</td>
                <td className="fraud-count">{loc.fraud_count}</td>
                <td className="fraud-rate">{loc.fraud_rate_percent}%</td>
                <td className="score">{loc.average_fraud_score.toFixed(3)}</td>
                <td className="amount">${loc.fraud_amount.toFixed(2)}</td>
                <td>
                  <span
                    className="risk-badge"
                    style={{
                      backgroundColor: getRiskColor(loc.risk_level),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {loc.risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .geolocation-container {
          padding: 20px;
          background: #fafafa;
          border-radius: 8px;
        }

        .geo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .geo-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .geo-controls label {
          font-weight: bold;
        }

        .geo-controls select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
        }

        .geo-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .summary-label {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .chart-container h3 {
          margin-top: 0;
        }

        .locations-table {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

        .table-row:hover {
          background-color: #f9f9f9;
        }

        .location-name {
          font-weight: bold;
          color: #2196F3;
        }

        .fraud-count {
          color: #f44336;
          font-weight: bold;
        }

        .fraud-rate {
          color: #ff9800;
          font-weight: bold;
        }

        .score {
          font-family: monospace;
          color: #666;
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
