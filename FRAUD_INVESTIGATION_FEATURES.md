# Fraud Detection Investigator - New Features

## 📋 Overview

This document outlines all the new fraud detection and investigation features added to the OmniTrace platform. These features provide comprehensive tools for fraud analysts and investigators to monitor, analyze, and investigate fraudulent transactions in real-time.

---

## 🎯 Features Added

### 1. **Fraud Investigation Dashboard** 
**File**: `FraudInvestigationDashboard.jsx`  
**Endpoint**: `GET /api/investigation/dashboard`

#### Features:
- Real-time fraud metrics and KPIs
- Total transactions count
- Fraud cases and fraud rate percentage
- Pending investigations count
- High-risk pending transactions
- Average fraud score
- Total fraud amount by risk level
- Risk distribution (Critical, High, Medium, Low)
- Auto-refreshing every 30 seconds

#### Key Metrics Displayed:
- Fraud Detection Rate
- Investigation Queue Size
- Risk Level Distribution (Pie Chart)
- Fraud Amount Tracking

---

### 2. **Live Transaction Monitoring**
**File**: `LiveTransactionMonitoring.jsx`  
**Endpoint**: `GET /api/investigation/live-transactions`

#### Features:
- Real-time streaming of recent transactions
- Configurable refresh intervals (3s, 5s, 10s, 30s)
- Auto-refresh toggle
- Transaction details: ID, User, Merchant, Amount, Location, Fraud Score, Type
- Risk level color-coded display
- Manual refresh button
- Paginated display (up to 30 transactions)

#### Use Cases:
- Monitor suspicious activity in real-time
- Quick risk assessment of new transactions
- Anomaly detection observation

---

### 3. **Fraud Alert Queue**
**File**: `FraudAlertQueue.jsx`  
**Endpoint**: `GET /api/investigation/alert-queue`

#### Features:
- Pending fraud alerts sorted by fraud score (highest risk first)
- Priority levels: Critical, High, Medium, Low
- Alert statistics:
  - Total pending alerts
  - Critical count
  - High-priority count
- Expandable alert items showing full transaction details
- Escalation status indicator
- Time ago display (relative to current time)
- Color-coded priority badges

#### Alert Details Include:
- Transaction ID and User ID
- Merchant and Amount
- Location and Device ID
- Transaction Type
- Full timestamp
- Escalation status

---

### 4. **Geolocation Fraud Heatmap**
**File**: `GeolocationFraudHeatmap.jsx`  
**Endpoint**: `GET /api/investigation/geolocation-heatmap`

#### Features:
- Geographic distribution of fraudulent transactions
- Heatmap sorting options:
  - By Fraud Count
  - By Fraud Rate %
  - By Transaction Volume
- Bar chart visualization of fraud distribution
- Risk analysis by location
- Summary statistics:
  - Unique locations tracked
  - Total fraud amount
  - Average fraud score across locations

#### Location Statistics Include:
- Transaction count
- Fraud count and fraud rate
- Average fraud score
- Fraud amount (USD)
- Risk level classification

#### Use Cases:
- Identify geographic hotspots for fraud
- Regional risk assessment
- Pattern analysis by location

---

### 5. **Risk Score Analytics**
**File**: `RiskScoreAnalytics.jsx`  
**Endpoint**: `GET /api/investigation/risk-analytics`

#### Features:
- Comprehensive risk score analysis
- Score distribution visualization (Bar Chart)
- Model performance comparison (Radar Chart):
  - DNN Score
  - LSTM Score
  - Autoencoder Score
  - GNN Score
  - Transformer Score
- Risk level breakdown:
  - Critical
  - High
  - Medium
  - Low

#### Analytics Provided:
- Score distribution across all transactions
- Average score by risk level
- Transaction count per risk level
- Total fraud amount by risk level
- Model-specific performance metrics

#### Model Scores Include:
- Raw score values
- Percentage representation
- Status indicators (Active/Stable)

---

### 6. **Fraud Trend Reports**
**File**: `FraudTrendReports.jsx`  
**Endpoint**: `GET /api/investigation/fraud-trends`

#### Features:
- Historical fraud analysis with customizable time periods:
  - Last 7 days
  - Last 14 days
  - Last 30 days
  - Last 90 days
  - Last year
- Daily trend visualization
- Weekly aggregated trends
- Category-based fraud analysis
- Transaction type analysis

#### Visualizations:
- Line chart for daily fraud trends
- Bar charts for top categories and transaction types
- Trend statistics showing:
  - Total fraud cases
  - Overall fraud rate
  - Total fraud amount
  - Average daily fraud

#### Analysis Includes:
- Highest risk merchant categories
- Riskiest transaction types
- Fraud amount by category
- Category fraud rates

---

### 7. **Transaction History Analysis**
**File**: `TransactionHistoryAnalysis.jsx`  
**Endpoint**: `GET /api/investigation/transaction-history/{user_id}`

#### Features:
- User-specific transaction analysis
- Search by User ID
- Comprehensive user statistics:
  - User information (name, location, average transaction)
  - Total transactions
  - Fraud count and rate
  - Average fraud score
  - Total amount and fraud amount
  - Unique locations and devices
- Recent transaction trends (Bar Chart)
- Detailed transaction history table

#### User Statistics Include:
- User name and home location
- Average transaction amount
- Fraud rate percentage
- Total transaction volume
- Device and location diversity

#### Transaction Details:
- Time, Merchant, Amount
- Location and Transaction Type
- Fraud score and Risk level
- Transaction status and Label (Legitimate/Fraudulent)

---

### 8. **Explainable AI Reports (SHAP Analysis)**
**File**: `ExplainableAIReports.jsx`  
**Endpoint**: `GET /api/investigation/explainable-report/{transaction_id}`

#### Features:
- Deep explainability for individual transactions
- Transaction summary with key details
- Risk assessment and scoring
- Model scores breakdown (all 5 neural models)
- Identified risk factors with severity levels
- SHAP explanations listing
- Detailed transaction information

#### Risk Assessment Shows:
- Fraud score percentage
- Risk level classification
- Transaction status
- Fraudulent/Legitimate label

#### Model Scores Include:
- Individual model scores
- Percentage representation
- Status indicators (Active/Moderate/Low)
- Visual ranking

#### Risk Factors Identified:
- Velocity Anomalies
- Location Anomalies
- Device Anomalies
- Other fraud indicators
- Severity levels (High/Medium/Low)

#### SHAP Explanations:
- Numbered list of contributing factors
- Model interpretation of decision points
- Feature contribution analysis

---

## 📊 Backend API Endpoints

All endpoints require `Authorization: Bearer {token}` header and role-based access control (Investigator or Admin).

| Endpoint | Method | Description | Query Params |
|----------|--------|-------------|--------------|
| `/api/investigation/dashboard` | GET | Fraud metrics dashboard | None |
| `/api/investigation/live-transactions` | GET | Recent transactions | `limit` (1-100, default 20) |
| `/api/investigation/alert-queue` | GET | Pending fraud alerts | `limit` (1-500, default 50) |
| `/api/investigation/geolocation-heatmap` | GET | Location-based fraud data | None |
| `/api/investigation/risk-analytics` | GET | Risk score analysis | None |
| `/api/investigation/fraud-trends` | GET | Fraud trends over time | `days` (1-365, default 30) |
| `/api/investigation/transaction-history/{user_id}` | GET | User transaction history | `limit` (1-500, default 100) |
| `/api/investigation/explainable-report/{transaction_id}` | GET | SHAP explainability report | None |

---

## 🏗️ Backend Architecture

### Service Layer: `fraud_investigation_service.py`

The `FraudInvestigationService` class provides all business logic for investigation features:

```python
class FraudInvestigationService:
    def get_dashboard_metrics() → Dict
    def get_live_transactions(limit) → Dict
    def get_fraud_alert_queue(limit) → Dict
    def get_geolocation_heatmap() → Dict
    def get_risk_score_analytics() → Dict
    def get_fraud_trend_report(days) → Dict
    def get_transaction_history_analysis(user_id, limit) → Dict
    def get_explainable_report(transaction_id) → Dict
```

### API Layer: `investigation.py`

FastAPI router with 8 endpoints, all with:
- Role-based access control (Investigator/Admin only)
- Query parameter validation
- Error handling and HTTP status codes
- Comprehensive docstrings

---

## 🔐 Security & Access Control

- All investigation endpoints require authentication (JWT token)
- Role-based access: Investigator and Admin roles only
- Sensitive data (transaction IDs, user information) logged to audit trail
- SQL injection protection via parameterized queries
- Rate limiting recommended for production

---

## 📈 Data Sources

All features pull data from the existing SQLite database:

**Tables Used:**
- `transactions` - Main transaction data with fraud scores
- `bank_users` - User information
- `merchants` - Merchant details
- `analyst_feedback` - Investigation notes and resolution actions
- `audit_logs` - Compliance and audit trail

---

## 🎨 Frontend Components

All components are React functional components with:
- Hooks for state management (useState, useEffect)
- Recharts for visualizations
- Responsive design (mobile-friendly grids)
- Consistent color scheme for risk levels
- Auto-refresh capabilities
- Error handling and loading states

### Color Scheme:
- **Critical Risk**: `#ff4444` (Red)
- **High Risk**: `#ff9800` (Orange)
- **Medium Risk**: `#ffc107` (Yellow)
- **Low Risk**: `#4caf50` (Green)

---

## 🚀 Integration Steps

1. **Backend Setup:**
   - New service file created: `backend/services/fraud_investigation_service.py`
   - New API router: `backend/api/investigation.py`
   - Updated main app to include investigation router

2. **Frontend Setup:**
   - 8 new React components in `frontend/src/components/`
   - Import components into your main App.jsx
   - Add navigation tabs for each feature

3. **Database:**
   - Existing SQLite schema supports all features
   - No migrations needed

---

## 📝 Usage Examples

### Dashboard Access:
```javascript
import FraudInvestigationDashboard from './components/FraudInvestigationDashboard';

<FraudInvestigationDashboard token={token} />
```

### Live Monitoring:
```javascript
import LiveTransactionMonitoring from './components/LiveTransactionMonitoring';

<LiveTransactionMonitoring token={token} />
```

### Alert Queue:
```javascript
import FraudAlertQueue from './components/FraudAlertQueue';

<FraudAlertQueue token={token} />
```

### Geolocation Heatmap:
```javascript
import GeolocationFraudHeatmap from './components/GeolocationFraudHeatmap';

<GeolocationFraudHeatmap token={token} />
```

### Risk Analytics:
```javascript
import RiskScoreAnalytics from './components/RiskScoreAnalytics';

<RiskScoreAnalytics token={token} />
```

### Fraud Trends:
```javascript
import FraudTrendReports from './components/FraudTrendReports';

<FraudTrendReports token={token} />
```

### Transaction History:
```javascript
import TransactionHistoryAnalysis from './components/TransactionHistoryAnalysis';

<TransactionHistoryAnalysis token={token} />
```

### Explainable Reports:
```javascript
import ExplainableAIReports from './components/ExplainableAIReports';

<ExplainableAIReports token={token} />
```

---

## 📊 Data Flow

```
User Request
    ↓
Frontend Component
    ↓
API Endpoint (/api/investigation/*)
    ↓
FraudInvestigationService Method
    ↓
SQLite Database Query
    ↓
Data Processing & Aggregation
    ↓
JSON Response
    ↓
Frontend Display
```

---

## 🔄 Real-Time Features

- **Dashboard**: Auto-refreshes every 30 seconds
- **Live Monitoring**: Configurable refresh (3s-30s), default 5s
- **Alert Queue**: Auto-refreshes every 10 seconds
- **All Others**: Manual refresh or user-configured intervals

---

## 🎯 Investigation Workflow

1. **Monitor** - Use Live Transaction Monitoring for real-time activity
2. **Alert** - Check Fraud Alert Queue for pending cases
3. **Analyze** - Use Dashboard for overview metrics
4. **Investigate** - Select transaction and view Explainable Report
5. **Trends** - Review historical patterns with Trend Reports
6. **Profile** - Analyze user history with Transaction History Analysis
7. **Geo-check** - Verify location patterns with Heatmap
8. **Score** - Review risk distribution with Risk Analytics

---

## 📚 Database Schema Utilized

The features use existing tables without requiring schema changes:
- Transactions table with fraud scores from all 5 models
- User profiles with location data
- Merchant information
- Historical transaction data for trend analysis

---

## 🔧 Performance Considerations

- Dashboard queries are optimized with GROUP BY aggregations
- Heatmap uses efficient location-based grouping
- Trend reports use date-based indexing
- Alert queue sorts by fraud_score for performance
- All queries use SQLite Row Factory for efficient data access

---

## 📝 Notes for Investigators

- **Critical Alerts** require immediate action
- **Fraud Scores** above 0.8 are typically auto-declined
- **Risk Factors** help understand why a transaction was flagged
- **SHAP Explanations** provide model interpretability
- **Geolocation** patterns help identify organized fraud rings
- **Trend Analysis** reveals emerging fraud patterns

---

## 🛠️ Maintenance & Monitoring

- Monitor alert queue size - high volumes may indicate new fraud patterns
- Review trend reports weekly for emerging fraud types
- Check model scores for consistency
- Validate SHAP explanations match manual investigation findings

---

## 📄 License

Part of OmniTrace Fraud Detection & Intelligence Platform
