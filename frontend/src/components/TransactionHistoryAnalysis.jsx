import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function TransactionHistoryAnalysis({ token }) {
  const [userId, setUserId] = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchClicked, setSearchClicked] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearchClicked(true);

    try {
      const response = await fetch(
        `${API_BASE}/investigation/transaction-history/${userId}?limit=100`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!response.ok) {
        if (response.status === 404) throw new Error('User not found');
        throw new Error('Failed to fetch transaction history');
      }
      const data = await response.json();
      setHistory(data.data);
    } catch (err) {
      setError(err.message);
      setHistory(null);
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

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Prepare chart data from transactions
  const chartData = history?.recent_transactions.slice(0, 20).reverse().map((tx, idx) => ({
    index: idx,
    amount: tx.amount,
    fraud_score: tx.fraud_score * 100
  })) || [];

  return (
    <div className="transaction-history-container">
      <h2>📋 Transaction History Analysis</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter User ID (e.g., ACC001)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="user-input"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="error">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="loading">⏳ Loading transaction history...</div>
      )}

      {searchClicked && !loading && !history && !error && (
        <div className="no-results">Enter a User ID and click Search to view transaction history</div>
      )}

      {history && (
        <div className="history-content">
          <div className="user-info-section">
            <h3>👤 User Information</h3>
            <div className="user-info-grid">
              <div className="info-card">
                <div className="info-label">User ID</div>
                <div className="info-value">{history.user_id}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Name</div>
                <div className="info-value">{history.user_info?.name}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Home Location</div>
                <div className="info-value">{history.user_info?.home_location}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Avg Transaction</div>
                <div className="info-value">${history.user_info?.average_transaction_amount?.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <h3>📊 User Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value" style={{ color: '#2196F3' }}>
                  {history.statistics?.total_transactions}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Fraud Cases</div>
                <div className="stat-value" style={{ color: '#f44336' }}>
                  {history.statistics?.fraud_count}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Fraud Rate</div>
                <div className="stat-value" style={{ color: '#ff9800' }}>
                  {history.statistics?.fraud_rate_percent}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Fraud Score</div>
                <div className="stat-value" style={{ color: '#9c27b0' }}>
                  {(history.statistics?.average_fraud_score * 100).toFixed(0)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Amount</div>
                <div className="stat-value" style={{ color: '#4caf50' }}>
                  ${history.statistics?.total_amount?.toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Fraud Amount</div>
                <div className="stat-value" style={{ color: '#e91e63' }}>
                  ${history.statistics?.fraud_amount?.toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Unique Locations</div>
                <div className="stat-value" style={{ color: '#00bcd4' }}>
                  {history.statistics?.unique_locations}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Unique Devices</div>
                <div className="stat-value" style={{ color: '#ff6f00' }}>
                  {history.statistics?.unique_devices}
                </div>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="chart-section">
              <h3>📈 Recent Transaction Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="index" stroke="rgba(255, 255, 255, 0.4)" label={{ value: 'Transaction #', position: 'insideBottomRight', offset: -5, fill: 'rgba(255, 255, 255, 0.6)' }} tick={{ fill: 'rgba(255, 255, 255, 0.6)' }} />
                  <YAxis yAxisId="left" stroke="rgba(255, 255, 255, 0.4)" label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.6)' }} tick={{ fill: 'rgba(255, 255, 255, 0.6)' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255, 255, 255, 0.4)" label={{ value: 'Fraud Score %', angle: 90, position: 'insideRight', fill: 'rgba(255, 255, 255, 0.6)' }} tick={{ fill: 'rgba(255, 255, 255, 0.6)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Bar yAxisId="left" dataKey="amount" fill="#34d399" name="Amount" />
                  <Bar yAxisId="right" dataKey="fraud_score" fill="#f87171" name="Fraud Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="transactions-section">
            <h3>💳 Recent Transactions</h3>
            {history.recent_transactions?.length === 0 ? (
              <div className="no-transactions">No transactions found for this user</div>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Merchant</th>
                    <th>Amount</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Fraud Score</th>
                    <th>Risk Level</th>
                    <th>Status</th>
                    <th>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {history.recent_transactions?.map((tx, idx) => (
                    <tr key={idx} style={{ backgroundColor: tx.label === 'Fraudulent' ? 'rgba(244, 67, 54, 0.15)' : 'transparent' }}>
                      <td>{new Date(tx.timestamp * 1000).toLocaleTimeString()}</td>
                      <td>{tx.merchant}</td>
                      <td className="amount">${tx.amount.toFixed(2)}</td>
                      <td>{tx.location}</td>
                      <td>{tx.transaction_type}</td>
                      <td className="score">{(tx.fraud_score * 100).toFixed(0)}%</td>
                      <td>
                        <span className="risk-badge" style={{
                          backgroundColor: getRiskColor(tx.risk_level),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {tx.risk_level}
                        </span>
                      </td>
                      <td>{tx.status}</td>
                      <td>
                        <span style={{
                          color: tx.label === 'Fraudulent' ? '#f44336' : '#4caf50',
                          fontWeight: 'bold'
                        }}>
                          {tx.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <style>{`
        .transaction-history-container {
          padding: 20px;
          background: rgba(13, 18, 36, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #f3f4f6;
        }

        .search-form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .user-input {
          flex: 1;
          max-width: 400px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .user-input:focus {
          border-color: var(--color-primary, #2196F3);
        }

        .search-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--color-primary, #2196F3), var(--color-purple, #8b5cf6));
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .search-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.35);
        }

        .search-btn:disabled {
          background: #475569;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .error, .loading, .no-results {
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }

        .error {
          background-color: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .loading {
          background-color: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }

        .no-results {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #9ca3af;
          text-align: center;
        }

        .history-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .user-info-section,
        .stats-section,
        .chart-section,
        .transactions-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
        }

        .user-info-section h3,
        .stats-section h3,
        .chart-section h3,
        .transactions-section h3 {
          margin-top: 0;
          color: #f3f4f6;
        }

        .user-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 4px;
          border-left: 3px solid var(--color-primary, #2196F3);
        }

        .info-label {
          color: #9ca3af;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .info-value {
          font-weight: bold;
          color: #f3f4f6;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 4px;
          text-align: center;
          border-top: 3px solid rgba(255, 255, 255, 0.1);
        }

        .stat-label {
          color: #9ca3af;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: bold;
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .transactions-table th {
          background-color: rgba(255, 255, 255, 0.04);
          color: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .transactions-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.9rem;
          color: #e5e7eb;
        }

        .transactions-table tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.04) !important;
        }

        .amount {
          color: #34d399;
          font-weight: bold;
        }

        .score {
          font-family: monospace;
          font-weight: bold;
        }

        .no-transactions {
          text-align: center;
          padding: 30px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
