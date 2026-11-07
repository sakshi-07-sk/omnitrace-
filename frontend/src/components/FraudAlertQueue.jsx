import React, { useState, useEffect } from 'react';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function FraudAlertQueue({ token }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAlertQueue();
    const interval = setInterval(fetchAlertQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlertQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/investigation/alert-queue?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.data.alerts || []);
      setStats({
        total: data.data.total_pending,
        critical: data.data.critical_count,
        high: data.data.high_count
      });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return { bg: '#ff4444', text: 'white', border: '#cc0000' };
      case 'High': return { bg: '#ff9800', text: 'white', border: '#e65100' };
      case 'Medium': return { bg: '#ffc107', text: '#333', border: '#f57f17' };
      default: return { bg: '#4caf50', text: 'white', border: '#2e7d32' };
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const timeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="alert-queue-container">
      <div className="queue-header">
        <h2>🚨 Fraud Alert Queue</h2>
        {stats && (
          <div className="queue-stats">
            <div className="stat-badge critical">
              Critical: <strong>{stats.critical}</strong>
            </div>
            <div className="stat-badge high">
              High: <strong>{stats.high}</strong>
            </div>
            <div className="stat-badge total">
              Total Pending: <strong>{stats.total}</strong>
            </div>
          </div>
        )}
      </div>

      {loading && <div className="loading">Loading alert queue...</div>}
      {error && <div className="error">Error: {error}</div>}

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">✅ No pending alerts</div>
        ) : (
          alerts.map((alert) => {
            const priorityStyle = getPriorityColor(alert.priority);
            const isExpanded = expandedAlert === alert.transaction_id;

            return (
              <div
                key={alert.transaction_id}
                className="alert-item"
                style={{
                  borderLeft: `5px solid ${priorityStyle.bg}`,
                  backgroundColor: alert.priority === 'Critical' ? 'rgba(255, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.01)'
                }}
              >
                <div className="alert-summary" onClick={() => setExpandedAlert(isExpanded ? null : alert.transaction_id)}>
                  <div className="alert-left">
                    <div
                      className="priority-badge"
                      style={{
                        backgroundColor: priorityStyle.bg,
                        color: 'white',
                        borderColor: priorityStyle.border
                      }}
                    >
                      {alert.priority}
                    </div>
                    <div className="alert-info">
                      <div className="alert-id">Transaction: {alert.transaction_id}</div>
                      <div className="alert-details">
                        {alert.merchant} • ${alert.amount.toFixed(2)} • {alert.location}
                      </div>
                      <div className="alert-user">User: {alert.user_id}</div>
                    </div>
                  </div>

                  <div className="alert-right">
                    <div className="fraud-score" style={{ color: priorityStyle.bg }}>
                      {(alert.fraud_score * 100).toFixed(0)}%
                    </div>
                    <div className="time-ago">{timeAgo(alert.timestamp)}</div>
                    <div className="escalated-badge" style={{ opacity: alert.escalated ? 1 : 0.3 }}>
                      {alert.escalated ? '⬆️ Escalated' : 'Not Escalated'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="alert-details-expanded">
                    <div className="detail-row">
                      <span className="detail-label">Transaction ID:</span>
                      <code>{alert.transaction_id}</code>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">User ID:</span>
                      <span>{alert.user_id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Amount:</span>
                      <span>${alert.amount.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Merchant:</span>
                      <span>{alert.merchant}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span>{alert.location}</span>
                      <span>{alert.location}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span>{alert.transaction_type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Fraud Score:</span>
                      <span style={{ fontWeight: 'bold', color: priorityStyle.bg }}>
                        {(alert.fraud_score * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Risk Level:</span>
                      <span>{alert.risk_level}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span>{alert.status}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Time:</span>
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .alert-queue-container {
          padding: 20px;
          background: rgba(13, 18, 36, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #f3f4f6;
        }

        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .queue-header h2 {
          color: #f3f4f6;
          margin: 0;
        }

        .queue-stats {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .stat-badge {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
        }

        .stat-badge.critical {
          background-color: #ff4444;
          box-shadow: 0 0 10px rgba(255, 68, 68, 0.3);
        }

        .stat-badge.high {
          background-color: #ff9800;
          box-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
        }

        .stat-badge.total {
          background-color: #2196F3;
          box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
          transition: all 0.2s ease;
        }

        .alert-item:hover {
          border-color: rgba(139, 92, 246, 0.25);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);
        }

        .alert-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
        }

        .alert-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .priority-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.85rem;
          border: 2px solid;
          min-width: 90px;
          text-align: center;
        }

        .alert-info {
          flex: 1;
        }

        .alert-id {
          font-weight: bold;
          color: #f3f4f6;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .alert-details {
          color: #9ca3af;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .alert-user {
          color: #6b7280;
          font-size: 0.85rem;
          margin-top: 4px;
        }

        .alert-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          margin-left: 20px;
        }

        .fraud-score {
          font-size: 1.3rem;
          font-weight: bold;
          font-family: monospace;
        }

        .time-ago {
          color: #6b7280;
          font-size: 0.85rem;
        }

        .escalated-badge {
          font-size: 0.85rem;
          color: #f44336;
          font-weight: bold;
        }

        .alert-details-expanded {
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background-color: rgba(0, 0, 0, 0.2);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          color: #d1d5db;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .detail-label {
          font-weight: bold;
          color: #9ca3af;
          margin-right: 12px;
        }

        code {
          font-family: monospace;
          background-color: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 3px;
          color: #38bdf8;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .no-alerts {
          text-align: center;
          padding: 40px;
          color: #10B981;
          font-size: 1.1rem;
          font-weight: bold;
        }

        .loading, .error {
          padding: 15px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .loading {
          background-color: rgba(59, 130, 246, 0.1);
          color: #38bdf8;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .error {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
