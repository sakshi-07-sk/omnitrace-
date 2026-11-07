# OmniTrace — Real-Time Financial Fraud Detection & Cognitive Risk Intelligence

OmniTrace is an explainable AI and neural fraud risk intelligence platform built for financial institutions, UPI networks, and digital payment gateways. It provides real-time fraud scoring (<50ms latency), mathematical Shapley value feature attributions, Graph Neural Network (GNN) circular ring detection, adaptive 20-minute transaction holds with biometric/OTP verification, and 12-hour fund escrow monitoring.

---

## 🌟 Key Features

* **Multi-Model Neural Fraud Engine**: Ensemble inference aggregating predictions from Deep Neural Networks (DNN), Long Short-Term Memory (LSTM), Reconstruction Autoencoders, Graph Neural Networks (GNN), and Transformer sequential attention.
* **Adaptive Transaction Verification & Hold System**: High-risk transactions ($\ge 0.70$) are placed on a smart 20-minute quarantine hold. Customers verify their identity via Face ID or OTP, dynamically recalculating the risk score (Verified $\rightarrow$ 35% Approved, Unverified $\rightarrow$ 99% Blocked).
* **12-Hour Fund Escrow & Hop Monitor**: Tracks receiver outbound transactions for up to 12 hours after a scam report, enabling trace-and-revert capabilities before funds are laundered.
* **Explainable AI (XAI)**: Feature-level attribution waterfall charts powered by Shapley values (SHAP) ensuring regulatory auditability.
* **Role-Based Dashboards**:
  * **Bank Admin (CRO)**: Fraud thresholds, global KPIs, held transaction tables, and user access management.
  * **Fraud Investigator**: Alert queue, held queue countdowns, verification panel drawer, heatmaps, and trend analytics.
  * **System Admin**: Telemetry health, container statuses, and authentication failure consoles.

---

## 🏗️ Architecture

```
OmniTrace/
├── backend/
│   ├── api/             # FastAPI REST endpoints (auth, transactions, models, investigation)
│   ├── models/          # Neural models (DNN, LSTM, Autoencoder, GNN, Shapley Explainer)
│   ├── services/        # Business logic (scoring, hold auto-expiry, escrow monitoring, stats)
│   └── utils/           # Database helpers (SQLite WAL), synthetic data generator
├── frontend/
│   ├── src/             # React (Vite) frontend application with Chart.js & Tailwind/CSS
│   └── public/          # Static assets
├── tests/               # Backend unit test suite
├── requirements.txt     # Python backend dependencies
└── firebase.json        # Cloud deployment configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python**: 3.10 or 3.11
* **Node.js**: v18+ and `npm`

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be available at `http://localhost:8000`. API docs can be accessed at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 🔑 Demo Credentials

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Bank Admin** | `admin` (or `admin@omnitrace.com`) | `admin123` |
| **Investigator** | `investigator` (or `investigator@omnitrace.com`) | `inv123` |
| **System Admin** | `sysadmin` (or `sysadmin@omnitrace.com`) | `sys123` |

---

## 🧪 Testing

Run the automated test suite:
```bash
python -m unittest tests/test_api.py
```

---

## 📄 License
This project is licensed under the MIT License.
