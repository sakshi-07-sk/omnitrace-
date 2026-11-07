import React, { useState, useEffect } from 'react';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function LiveTransactionMonitoring({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLiveTransactions();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLiveTransactions, refreshInterval);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchLiveTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE}/investigation/live-transactions?limit=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.data.transactions || []);
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
      default: return '#4caf50';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical': return 'rgba(255, 68, 68, 0.1)';
      case 'High': return 'rgba(255, 152, 0, 0.1)';
      case 'Medium': return 'rgba(255, 193, 7, 0.1)';
      default: return 'rgba(76, 175, 80, 0.1)';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  return (
    <div className="live-monitoring-container">
      <div className="monitoring-header">
        <h2>📊 Live Transaction Monitoring</h2>
        <div className="monitoring-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
          <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))}>
            <option value={3000}>Every 3s</option>
            <option value={5000}>Every 5s</option>
            <option value={10000}>Every 10s</option>
            <option value={30000}>Every 30s</option>
          </select>
          <button onClick={fetchLiveTransactions} className="refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      {loading && <div className="loading">Loading transactions...</div>}
      {error && <div className="error">Error: {error}</div>}

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="no-data">No transactions found</div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Location</th>
                <th>Type</th>
                <th>Fraud Score</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.transaction_id} style={{ backgroundColor: getRiskBgColor(tx.risk_level) }}>
                  <td>{formatTime(tx.timestamp)}</td>
                  <td className="tx-id">{tx.transaction_id.substring(0, 12)}...</td>
                  <td>{tx.user_id}</td>
                  <td>{tx.merchant}</td>
                  <td className="amount">${tx.amount.toFixed(2)}</td>
                  <td>{tx.location}</td>
                  <td>{tx.transaction_type}</td>
                  <td className="score">{(tx.fraud_score * 100).toFixed(0)}%</td>
                  <td>
                    <span
                      className="risk-badge"
                      style={{
                        backgroundColor: getRiskColor(tx.risk_level),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}
                    >
                      {tx.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .live-monitoring-container {
          padding: 20px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 8px;
          color: white;
        }

        .monitoring-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .monitoring-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .monitoring-controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .monitoring-controls select {
          padding: 8px;
          border-radius: 4px;
          border: none;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
        }

        .monitoring-controls select option {
          background-color: #333;
          color: white;
        }

        .refresh-btn {
          padding: 8px 16px;
          background-color: #4caf50;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        }

        .refresh-btn:hover {
          background-color: #45a049;
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .transactions-table th {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .transactions-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .transactions-table tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .tx-id {
          font-family: monospace;
          font-size: 0.9rem;
        }

        .amount {
          font-weight: bold;
          color: #4caf50;
        }

        .score {
          font-weight: bold;
          font-family: monospace;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.6);
        }

        .loading, .error {
          padding: 20px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .loading {
          background-color: rgba(33, 150, 243, 0.1);
          color: #42a5f5;
        }

        .error {
          background-color: rgba(244, 67, 54, 0.1);
          color: #ef5350;
        }
      `}</style>
    </div>
  );
}
