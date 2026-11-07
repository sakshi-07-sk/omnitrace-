# Quick Integration Guide - Fraud Detection Investigator

## 📦 What Was Added

### Backend Components (Python/FastAPI)
1. **New Service**: `backend/services/fraud_investigation_service.py`
   - 8 investigation methods
   - Database queries for fraud analysis
   - Data aggregation and processing

2. **New API Router**: `backend/api/investigation.py`
   - 8 new endpoints
   - Role-based access control
   - Input validation and error handling

3. **Updated Main App**: `backend/app.py`
   - Imported new investigation router
   - Registered all 8 endpoints with `/api/investigation` prefix

### Frontend Components (React)
1. `frontend/src/components/FraudInvestigationDashboard.jsx`
2. `frontend/src/components/LiveTransactionMonitoring.jsx`
3. `frontend/src/components/FraudAlertQueue.jsx`
4. `frontend/src/components/GeolocationFraudHeatmap.jsx`
5. `frontend/src/components/RiskScoreAnalytics.jsx`
6. `frontend/src/components/FraudTrendReports.jsx`
7. `frontend/src/components/TransactionHistoryAnalysis.jsx`
8. `frontend/src/components/ExplainableAIReports.jsx`

---

## 🚀 Integration Checklist

### Backend Integration ✅
- [x] Service file created with all methods
- [x] API router created with all endpoints
- [x] Router imported in main app.py
- [x] Router registered in FastAPI app
- [x] All endpoints have role-based access control
- [x] Error handling implemented

### Frontend Integration (TODO)
- [ ] Import all components in App.jsx
- [ ] Add tab navigation for each feature
- [ ] Connect tabs to component rendering
- [ ] Test each component with API endpoints
- [ ] Verify styling and responsiveness

---

## 📋 Integration Steps

### Step 1: Add Tab Navigation in App.jsx

Add these tab options to your navigation menu:

```javascript
const investigationTabs = [
  { id: 'fraud-dashboard', label: '🔍 Dashboard', icon: '📊' },
  { id: 'live-monitoring', label: '📡 Live Monitor', icon: '📡' },
  { id: 'alert-queue', label: '🚨 Alert Queue', icon: '🚨' },
  { id: 'geolocation', label: '🌍 Geolocation', icon: '🌍' },
  { id: 'risk-analytics', label: '📈 Risk Analysis', icon: '📈' },
  { id: 'fraud-trends', label: '📉 Trends', icon: '📉' },
  { id: 'tx-history', label: '📋 User History', icon: '📋' },
  { id: 'explainable', label: '🔍 AI Report', icon: '🔍' }
];
```

### Step 2: Import Components in App.jsx

```javascript
import FraudInvestigationDashboard from './components/FraudInvestigationDashboard';
import LiveTransactionMonitoring from './components/LiveTransactionMonitoring';
import FraudAlertQueue from './components/FraudAlertQueue';
import GeolocationFraudHeatmap from './components/GeolocationFraudHeatmap';
import RiskScoreAnalytics from './components/RiskScoreAnalytics';
import FraudTrendReports from './components/FraudTrendReports';
import TransactionHistoryAnalysis from './components/TransactionHistoryAnalysis';
import ExplainableAIReports from './components/ExplainableAIReports';
```

### Step 3: Add State Variables in App.jsx

```javascript
// Add to your state initialization
const [activeTab, setActiveTab] = useState('fraud-dashboard');
```

### Step 4: Add Rendering Logic in App.jsx

```javascript
// In your main render function
{activeTab === 'fraud-dashboard' && <FraudInvestigationDashboard token={token} />}
{activeTab === 'live-monitoring' && <LiveTransactionMonitoring token={token} />}
{activeTab === 'alert-queue' && <FraudAlertQueue token={token} />}
{activeTab === 'geolocation' && <GeolocationFraudHeatmap token={token} />}
{activeTab === 'risk-analytics' && <RiskScoreAnalytics token={token} />}
{activeTab === 'fraud-trends' && <FraudTrendReports token={token} />}
{activeTab === 'tx-history' && <TransactionHistoryAnalysis token={token} />}
{activeTab === 'explainable' && <ExplainableAIReports token={token} />}
```

### Step 5: Add Navigation Buttons

```javascript
<div className="investigation-nav">
  {investigationTabs.map(tab => (
    <button
      key={tab.id}
      className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
      onClick={() => setActiveTab(tab.id)}
      title={tab.label}
    >
      {tab.icon} {tab.label}
    </button>
  ))}
</div>
```

### Step 6: Add CSS Styling

```css
.investigation-nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.nav-btn {
  padding: 10px 15px;
  border: none;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.nav-btn:hover {
  background: #e3f2fd;
}

.nav-btn.active {
  background: #2196F3;
  color: white;
  border-color: #1976d2;
}
```

---

## 📡 API Endpoints Reference

All endpoints require: `Authorization: Bearer {token}`

### Dashboard Metrics
```
GET /api/investigation/dashboard
Response: KPIs, fraud stats, risk distribution
```

### Live Transactions
```
GET /api/investigation/live-transactions?limit=30
Response: Recent transactions with fraud scores
```

### Alert Queue
```
GET /api/investigation/alert-queue?limit=50
Response: Pending fraud alerts sorted by risk
```

### Geolocation Heatmap
```
GET /api/investigation/geolocation-heatmap
Response: Location-based fraud statistics
```

### Risk Analytics
```
GET /api/investigation/risk-analytics
Response: Risk distribution and model comparison
```

### Fraud Trends
```
GET /api/investigation/fraud-trends?days=30
Response: Daily, weekly, and category trends
```

### Transaction History
```
GET /api/investigation/transaction-history/{user_id}?limit=100
Response: User statistics and transaction history
```

### Explainable Report
```
GET /api/investigation/explainable-report/{transaction_id}
Response: SHAP analysis and risk factors
```

---

## 🔒 Role-Based Access

All endpoints are restricted to:
- **Investigator** role ✅
- **Admin** role ✅

Users with other roles will receive 403 Forbidden errors.

---

## ⚠️ Error Handling

All components include built-in error handling:
- Loading states
- Error messages
- Retry mechanisms
- Graceful fallbacks

### Common Errors:
- 401 Unauthorized - Token expired or invalid
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource (user/transaction) not found
- 500 Internal Server Error - Server-side exception

---

## 🎨 Styling Notes

All components use:
- Inline CSS in `<style>` tags for scoping
- Responsive grid layouts
- Material Design color scheme
- Accessibility-friendly font sizes
- Mobile-responsive design

### Color Palette:
```
Critical: #ff4444
High: #ff9800
Medium: #ffc107
Low: #4caf50
Neutral: #2196F3, #9c27b0, #e91e63
```

---

## 📱 Responsive Design

All components are optimized for:
- Desktop (1920px+)
- Tablet (768px-1024px)
- Mobile (below 768px)

Tables and charts automatically adjust to screen size.

---

## 🔄 Data Refresh Strategies

| Component | Default Refresh | Manual Refresh |
|-----------|-----------------|----------------|
| Dashboard | 30 seconds | Yes |
| Live Monitor | 5 seconds | Yes |
| Alert Queue | 10 seconds | Auto |
| Heatmap | Manual | Yes |
| Risk Analytics | 60 seconds | Yes |
| Trends | Manual | Yes |
| History | On Search | Yes |
| AI Report | On Search | Yes |

---

## 🧪 Testing Checklist

Before deploying:

- [ ] All API endpoints return correct data
- [ ] Components render without errors
- [ ] Authentication/token handling works
- [ ] Role-based access control functions
- [ ] Charts and tables display properly
- [ ] Search functionality works
- [ ] Auto-refresh mechanisms function
- [ ] Error messages appear correctly
- [ ] Responsive design verified on mobile
- [ ] Data updates reflect real-time changes

---

## 🚨 Known Limitations

1. **Chart Rendering**: Requires React, Chart.js, and Recharts libraries
2. **Auto-refresh**: Consumes API requests continuously
3. **Large Datasets**: May need pagination for datasets > 10k records
4. **Real-time Updates**: Manual refresh or websocket recommended for true real-time

---

## 💡 Performance Tips

1. Implement component lazy loading for faster page load
2. Add memoization for expensive computations
3. Cache API responses client-side when appropriate
4. Implement pagination for large tables
5. Use debouncing for search inputs
6. Monitor API request rates

---

## 📞 Support & Troubleshooting

### Issue: Components not rendering
- Check that token is passed correctly
- Verify API endpoints are accessible
- Check browser console for errors

### Issue: API 403 Forbidden
- Verify user role (Investigator or Admin)
- Check token expiration
- Re-authenticate if needed

### Issue: No data displayed
- Check database has transaction records
- Verify API endpoint responses
- Check browser network tab

### Issue: Charts not displaying
- Ensure Recharts library is installed
- Check console for rendering errors
- Verify data format matches chart requirements

---

## 📚 Additional Resources

- Full feature documentation: `FRAUD_INVESTIGATION_FEATURES.md`
- Backend service code: `backend/services/fraud_investigation_service.py`
- API implementation: `backend/api/investigation.py`
- Component files: `frontend/src/components/`

---

## 🎯 Next Steps

1. Complete the integration checklist
2. Test each component individually
3. Deploy to staging environment
4. Run end-to-end testing
5. Deploy to production
6. Monitor API performance
7. Gather user feedback
8. Iterate based on feedback

---

## 📝 Notes

- All features are backward compatible with existing OmniTrace system
- No database migrations needed
- Existing user authentication system is used
- All new code follows existing project conventions
