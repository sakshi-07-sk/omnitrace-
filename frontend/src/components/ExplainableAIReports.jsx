import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function ExplainableAIReports({ token }) {
  const [transactionId, setTransactionId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchClicked, setSearchClicked] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Please enter a Transaction ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearchClicked(true);

    try {
      const response = await fetch(
        `${API_BASE}/investigation/explainable-report/${transactionId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!response.ok) {
        if (response.status === 404) throw new Error('Transaction not found');
        throw new Error('Failed to fetch explainable report');
      }
      const data = await response.json();
      setReport(data.data);
    } catch (err) {
      setError(err.message);
      setReport(null);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#666';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Prepare model scores chart data
  const modelScoresData = report && report.model_scores
    ? Object.entries(report.model_scores).map(([name, value]) => ({
      name: name.toUpperCase(),
      score: (value * 100).toFixed(2),
      value: value
    }))
    : [];

  return (
    <div className="explainable-reports-container">
      <h2>🔍 Explainable AI Reports (SHAP Analysis)</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="tx-input"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? 'Loading...' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="error">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="loading">⏳ Generating explainable AI report...</div>
      )}

      {searchClicked && !loading && !report && !error && (
        <div className="no-results">Enter a Transaction ID and click Analyze to view detailed explainability report</div>
      )}

      {report && (
        <div className="report-content">
          <div className="transaction-summary">
            <h3>💳 Transaction Summary</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="label">Transaction ID</div>
                <div className="value" style={{ fontFamily: 'monospace' }}>{report.transaction_id.substring(0, 16)}...</div>
              </div>
              <div className="summary-card">
                <div className="label">User</div>
                <div className="value">{report.user_id}</div>
              </div>
              <div className="summary-card">
                <div className="label">Merchant</div>
                <div className="value">{report.merchant}</div>
              </div>
              <div className="summary-card">
                <div className="label">Amount</div>
                <div className="value" style={{ color: '#4caf50' }}>${report.amount.toFixed(2)}</div>
              </div>
              <div className="summary-card">
                <div className="label">Location</div>
                <div className="value">{report.location}</div>
              </div>
              <div className="summary-card">
                <div className="label">Time</div>
                <div className="value">{formatTime(report.timestamp)}</div>
              </div>
            </div>
          </div>

          <div className="risk-assessment">
            <h3>⚠️ Risk Assessment</h3>
            <div className="risk-grid">
              <div className="risk-card">
                <div className="risk-label">Fraud Score</div>
                <div className="risk-value" style={{
                  color: getRiskColor(report.risk_level),
                  fontSize: '2rem'
                }}>
                  {(report.fraud_score * 100).toFixed(2)}%
                </div>
              </div>
              <div className="risk-card">
                <div className="risk-label">Risk Level</div>
                <div className="risk-badge" style={{ backgroundColor: getRiskColor(report.risk_level) }}>
                  {report.risk_level}
                </div>
              </div>
              <div className="risk-card">
                <div className="risk-label">Status</div>
                <div className="risk-value">{report.status}</div>
              </div>
              <div className="risk-card">
                <div className="risk-label">Label</div>
                <div className="risk-value" style={{
                  color: report.label === 'Fraudulent' ? '#f44336' : '#4caf50',
                  fontWeight: 'bold'
                }}>
                  {report.label}
                </div>
              </div>
            </div>
          </div>

          {modelScoresData.length > 0 && (
            <div className="model-scores-section">
              <h3>🤖 Model Scores Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelScoresData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="#ff9800" name="Score %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <table className="model-scores-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Raw Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {modelScoresData.map((model) => (
                    <tr key={model.name}>
                      <td className="model-name">{model.name}</td>
                      <td className="raw-score">{model.value.toFixed(4)}</td>
                      <td className="percentage">{model.score}%</td>
                      <td>
                        <span className="status" style={{
                          backgroundColor: model.value >= 0.6 ? '#f44336' : model.value >= 0.4 ? '#ff9800' : '#4caf50',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {model.value >= 0.6 ? '🔴 Active' : model.value >= 0.4 ? '🟡 Moderate' : '🟢 Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.risk_factors && report.risk_factors.length > 0 && (
            <div className="risk-factors-section">
              <h3>🎯 Identified Risk Factors</h3>
              <div className="risk-factors-list">
                {report.risk_factors.map((factor, idx) => (
                  <div key={idx} className="risk-factor-item" style={{
                    borderLeftColor: getSeverityColor(factor.severity)
                  }}>
                    <div className="factor-header">
                      <div className="factor-name">{factor.factor}</div>
                      <div className="factor-severity" style={{
                        backgroundColor: getSeverityColor(factor.severity),
                        color: 'white'
                      }}>
                        {factor.severity}
                      </div>
                    </div>
                    <div className="factor-description">{factor.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.explanations && report.explanations.length > 0 && (
            <div className="explanations-section">
              <h3>💡 SHAP Explanations</h3>
              <div className="explanations-list">
                {report.explanations.map((exp, idx) => (
                  <div key={idx} className="explanation-item">
                    <div className="explanation-number">{idx + 1}</div>
                    <div className="explanation-text">{exp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="transactions-details">
            <h3>📋 Transaction Details</h3>
            <table className="details-table">
              <tbody>
                <tr>
                  <td className="detail-label">Transaction ID:</td>
                  <td className="detail-value" style={{ fontFamily: 'monospace' }}>{report.transaction_id}</td>
                </tr>
                <tr>
                  <td className="detail-label">User ID:</td>
                  <td className="detail-value">{report.user_id}</td>
                </tr>
                <tr>
                  <td className="detail-label">Merchant:</td>
                  <td className="detail-value">{report.merchant}</td>
                </tr>
                <tr>
                  <td className="detail-label">Amount:</td>
                  <td className="detail-value">${report.amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="detail-label">Location:</td>
                  <td className="detail-value">{report.location}</td>
                </tr>
                <tr>
                  <td className="detail-label">Timestamp:</td>
                  <td className="detail-value">{formatTime(report.timestamp)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .explainable-reports-container {
          padding: 20px;
          background: #fafafa;
          border-radius: 8px;
        }

        .search-form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tx-input {
          flex: 1;
          max-width: 400px;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: monospace;
        }

        .search-btn {
          padding: 10px 20px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .search-btn:hover:not(:disabled) {
          background-color: #1976d2;
        }

        .search-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error, .loading, .no-results {
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }

        .error {
          background-color: #ffebee;
          color: #c62828;
        }

        .loading {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .no-results {
          background-color: #f5f5f5;
          color: #666;
          text-align: center;
        }

        .report-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .transaction-summary,
        .risk-assessment,
        .model-scores-section,
        .risk-factors-section,
        .explanations-section,
        .transactions-details {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h3 {
          margin-top: 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .summary-card {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
          border-top: 3px solid #2196F3;
        }

        .label {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .value {
          font-weight: bold;
          color: #333;
          font-size: 0.95rem;
        }

        .risk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .risk-card {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
          border-left: 4px solid #f44336;
          text-align: center;
        }

        .risk-label {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }

        .risk-value {
          font-weight: bold;
        }

        .risk-badge {
          display: inline-block;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: bold;
        }

        .model-scores-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .model-scores-table th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #ddd;
        }

        .model-scores-table td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .model-name {
          font-weight: bold;
          font-family: monospace;
          color: #2196F3;
        }

        .raw-score {
          font-family: monospace;
          color: #666;
        }

        .percentage {
          font-weight: bold;
          color: #ff9800;
        }

        .risk-factors-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .risk-factor-item {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .factor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .factor-name {
          font-weight: bold;
          color: #333;
        }

        .factor-severity {
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .factor-description {
          color: #666;
          font-size: 0.9rem;
        }

        .explanations-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .explanation-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .explanation-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background-color: #2196F3;
          color: white;
          border-radius: 50%;
          font-weight: bold;
          flex-shrink: 0;
        }

        .explanation-text {
          flex: 1;
          color: #333;
          line-height: 1.5;
        }

        .details-table {
          width: 100%;
          border-collapse: collapse;
        }

        .details-table tr {
          border-bottom: 1px solid #eee;
        }

        .details-table tr:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: bold;
          color: #666;
          padding: 10px;
          width: 150px;
        }

        .detail-value {
          padding: 10px;
          color: #333;
        }
      `}</style>
    </div>
  );
}
