import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = (window.location.hostname.includes('firebase')) ? 'http://localhost:8000/api' : '/api';

export default function FraudTrendReports({ token }) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchTrends();
  }, [days]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/investigation/fraud-trends?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch trends');
      const data = await response.json();
      setTrends(data.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading trend data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!trends) return <div className="loading">No data available</div>;

  const dailyData = trends.daily_trends || [];
  const categoryData = trends.category_analysis || [];
  const transactionTypeData = trends.transaction_type_analysis || [];

  // Calculate statistics
  const totalFraudCases = dailyData.reduce((sum, d) => sum + d.fraud_count, 0);
  const totalTransactions = dailyData.reduce((sum, d) => sum + d.total_transactions, 0);
  const overallFraudRate = totalTransactions > 0 ? (totalFraudCases / totalTransactions * 100).toFixed(2) : 0;
  const totalFraudAmount = dailyData.reduce((sum, d) => sum + d.fraud_amount, 0);
  const avgDailyFraud = dailyData.length > 0 ? (totalFraudCases / dailyData.length).toFixed(2) : 0;

  const topRiskCategory = categoryData.length > 0 ? categoryData[0] : null;
  const topRiskType = transactionTypeData.length > 0 ? transactionTypeData[0] : null;

  return (
    <div className="fraud-trends-container">
      <div className="trends-header">
        <h2>📈 Fraud Trend Reports</h2>
        <div className="period-selector">
          <label>Period:</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last Year</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Fraud Cases</div>
            <div className="stat-value" style={{ color: '#f44336' }}>{totalFraudCases}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">Overall Fraud Rate</div>
            <div className="stat-value" style={{ color: '#ff9800' }}>{overallFraudRate}%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Fraud Amount</div>
            <div className="stat-value" style={{ color: '#e91e63' }}>${totalFraudAmount.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <div className="stat-label">Avg Daily Fraud</div>
            <div className="stat-value" style={{ color: '#3f51b5' }}>{avgDailyFraud}</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container full-width">
          <h3>Daily Fraud Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis yAxisId="left" label={{ value: 'Fraud Count', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Fraud Rate %', angle: 90, position: 'insideRight' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fraud_count"
                stroke="#f44336"
                name="Fraud Count"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="fraud_rate_percent"
                stroke="#ff9800"
                name="Fraud Rate %"
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Top Risk Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'Fraud Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="fraud_count" fill="#ff6b6b" name="Fraud Count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Transaction Type Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="transaction_type"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
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
              <Bar dataKey="total_transactions" fill="#4caf50" name="Total Transactions" />
              <Bar dataKey="fraud_count" fill="#f44336" name="Fraud Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="insights-grid">
        {topRiskCategory && (
          <div className="insight-card risk-category">
            <h4>🎯 Highest Risk Category</h4>
            <div className="insight-content">
              <div className="category-name">{topRiskCategory.category}</div>
              <div className="insight-stat">
                Fraud Count: <strong style={{ color: '#f44336' }}>{topRiskCategory.fraud_count}</strong>
              </div>
              <div className="insight-stat">
                Fraud Rate: <strong style={{ color: '#ff9800' }}>{topRiskCategory.fraud_rate_percent}%</strong>
              </div>
              <div className="insight-stat">
                Total Amount: <strong style={{ color: '#e91e63' }}>${topRiskCategory.total_amount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}

        {topRiskType && (
          <div className="insight-card transaction-type">
            <h4>🔄 Riskiest Transaction Type</h4>
            <div className="insight-content">
              <div className="type-name">{topRiskType.transaction_type}</div>
              <div className="insight-stat">
                Fraud Count: <strong style={{ color: '#f44336' }}>{topRiskType.fraud_count}</strong>
              </div>
              <div className="insight-stat">
                Fraud Rate: <strong style={{ color: '#ff9800' }}>{topRiskType.fraud_rate_percent}%</strong>
              </div>
              <div className="insight-stat">
                Total Amount: <strong style={{ color: '#e91e63' }}>${topRiskType.total_amount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fraud-trends-container {
          padding: 20px;
          background: #fafafa;
          border-radius: 8px;
        }

        .trends-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .period-selector {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .period-selector label {
          font-weight: bold;
        }

        .period-selector select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 12px;
        }

        .stat-icon {
          font-size: 1.8rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .charts-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-container.full-width {
          grid-column: 1 / -1;
        }

        .chart-container h3 {
          margin-top: 0;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .insight-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
        }

        .insight-card.risk-category {
          border-left-color: #f44336;
        }

        .insight-card.transaction-type {
          border-left-color: #2196F3;
        }

        .insight-card h4 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .insight-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-name,
        .type-name {
          font-weight: bold;
          font-size: 1.1rem;
          color: #333;
        }

        .insight-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
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
