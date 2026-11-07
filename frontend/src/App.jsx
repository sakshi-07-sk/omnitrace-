import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import confetti from 'canvas-confetti';
import './landing.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

let API_BASE = localStorage.getItem('omnitrace_api_base') || (
  (window.location.hostname.endsWith('web.app') || window.location.hostname.endsWith('firebaseapp.com') || window.location.hostname.includes('firebase'))
    ? 'http://localhost:8000/api'
    : '/api'
);

export default function App() {
  // Authentication & Session States
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Registration States
  const [isSignup, setIsSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupRole, setSignupRole] = useState('Investigator');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  
  // Dashboard & State Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [stats, setStats] = useState(null);
  const [sysHealth, setSysHealth] = useState(null);
  const [thresholds, setThresholds] = useState({ fraud_threshold: 0.70, auto_decline_threshold: 0.90 });
  const [tradeoff, setTradeoff] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [escrowsLoading, setEscrowsLoading] = useState(false);
  
  // Adaptive Hold System States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedHeldTx, setSelectedHeldTx] = useState(null);
  const [nowTime, setNowTime] = useState(Date.now() / 1000);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [otpLog, setOtpLog] = useState([]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNowTime(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);
  
  // Investigation feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState('');
  const [feedbackComments, setFeedbackComments] = useState('');
  
  // Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const terminalEndRef = useRef(null);

  // User Management state
  const [usersList, setUsersList] = useState([]);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserPassword, setAddUserPassword] = useState('');
  const [addUserFullName, setAddUserFullName] = useState('');
  const [addUserRole, setAddUserRole] = useState('Investigator');
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');

  // System Admin Dashboard States
  const [rebootingContainer, setRebootingContainer] = useState(null);
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [logsFilterLevel, setLogsFilterLevel] = useState('ALL');
  const [logsAutoScroll, setLogsAutoScroll] = useState(true);
  const [optimizingDatabase, setOptimizingDatabase] = useState(false);

  // Explainability Reports state
  const [explainSearchId, setExplainSearchId] = useState('');
  const [explainTx, setExplainTx] = useState(null);
  const [explainTxHistory, setExplainTxHistory] = useState([]);
  const [explainTxHistoryLoading, setExplainTxHistoryLoading] = useState(false);
  const [explainError, setExplainError] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);

  // Landing Page Interactive States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [simScenario, setSimScenario] = useState('legit');
  const [demoSearchId, setDemoSearchId] = useState('');
  const [demoSearchRes, setDemoSearchRes] = useState(null);
  const [demoSearching, setDemoSearching] = useState(false);

  // AI Engines Hub States
  const [aiModules, setAiModules] = useState([
    { id: 1, name: 'Real-Time Risk Scoring', category: 'Scoring', model: 'DNN, XGBoost, Transformers', status: 'ACTIVE', accuracy: 98.4, desc: 'Generates real-time fraud probability scores (0-100) with ultra-low latency (<50ms).' },
    { id: 2, name: 'Behavioral Pattern Analysis', category: 'Behavior', model: 'LSTM Networks', status: 'ACTIVE', accuracy: 96.8, desc: 'Learns individual customer transaction histories to identify out-of-pattern spending spikes.' },
    { id: 3, name: 'Geolocation Anomaly Detection', category: 'Context', model: 'Distance-based Isolation Forests', status: 'ACTIVE', accuracy: 97.2, desc: 'Detects impossible travel speeds and suspicious cross-border geolocation hops.' },
    { id: 4, name: 'Device Fingerprint Intelligence', category: 'Device', model: 'DBSCAN Clustering & Graph Nodes', status: 'ACTIVE', accuracy: 95.5, desc: 'Analyzes hardware characteristics, identifiers, and browser agents to identify emulator spoofing.' },
    { id: 5, name: 'Explainable AI (XAI)', category: 'Interpretability', model: 'SHAP (Additive Explanations)', status: 'ACTIVE', accuracy: 100.0, desc: 'Explains every mathematical risk score using feature attribution waterfall charts.' },
    { id: 6, name: 'Fraud Ring GNN Analysis', category: 'Network', model: 'Graph Neural Networks (GraphSAGE)', status: 'ACTIVE', accuracy: 94.2, desc: 'Maps relationships between accounts, identifying circular loops and mule account structures.' },
    { id: 7, name: 'Transaction Sequence Intelligence', category: 'Sequence', model: 'LSTM & Multi-Head Attention', status: 'ACTIVE', accuracy: 97.5, desc: 'Evaluates transaction chains over time to detect fast automated cash-outs.' },
    { id: 8, name: 'Smart Alert Prioritization', category: 'Operations', model: 'Ranking Algorithms', status: 'ACTIVE', accuracy: 93.8, desc: 'Triage-ranks security alerts automatically based on risk level and potential loss.' },
    { id: 9, name: 'Adaptive Learning Engine', category: 'Self-Improvement', model: 'Reinforcement Learning from Feedback', status: 'ACTIVE', accuracy: 95.0, desc: 'Retrains weights dynamically based on analyst action feedback (Confirm/Dismiss).' },
    { id: 10, name: 'AI-Based Threshold Optimization', category: 'Optimization', model: 'Bayesian Optimization', status: 'ACTIVE', accuracy: 92.4, desc: 'Automatically adjusts decision boundaries to optimize precision/recall trade-offs.' },
    { id: 11, name: 'Fraud Heatmap Analytics', category: 'Context', model: 'Spatial Density Clustering', status: 'ACTIVE', accuracy: 94.7, desc: 'Identifies geographical hot spots with elevated fraud rates in real-time.' },
    { id: 12, name: 'Insider Threat Detection', category: 'Internal', model: 'Behavioral Outlier Detection', status: 'ACTIVE', accuracy: 96.1, desc: 'Monitors internal bank administrator database accesses for anomalous patterns.' },
    { id: 13, name: 'Synthetic Identity Classifier', category: 'Identity', model: 'KYC Graph Matching', status: 'ACTIVE', accuracy: 97.9, desc: 'Flags synthetic bank identities generated from combinations of fake/stolen credentials.' },
    { id: 14, name: 'AI Investigator Assistant (NLP)', category: 'Operations', model: 'Transformer LLM Summarizer', status: 'ACTIVE', accuracy: 98.2, desc: 'Summarizes flagged transaction risks into natural language recommendations.' },
    { id: 15, name: 'Fraud Attack Simulation Engine', category: 'Simulation', model: 'Generative Adversarial Networks (GAN)', status: 'STANDBY', accuracy: 91.0, desc: 'Generates fake adversarial transaction profiles to stress-test existing classifiers.' },
    { id: 16, name: 'Drift Detection Intelligence', category: 'Interpretability', model: 'Kolmogorov-Smirnov Drift Test', status: 'ACTIVE', accuracy: 99.1, desc: 'Monitors input distributions for feature drift and model performance decay.' },
    { id: 17, name: 'AI Risk Categorization Classifier', category: 'Interpretability', model: 'Multi-Class Logistic Classifier', status: 'ACTIVE', accuracy: 95.8, desc: 'Categorizes flagged alerts into Account Takeover, Payment Fraud, or Insider Fraud.' },
    { id: 18, name: 'Predictive Fraud Timeline', category: 'Time-Series', model: 'Prophet Time-Series Forecasting', status: 'ACTIVE', accuracy: 91.8, desc: 'Predicts fraud volume and attack patterns for the next 7 days.' },
    { id: 19, name: 'Federated Learning Gateway', category: 'Security', model: 'Privacy-Preserving Local Training', status: 'STANDBY', accuracy: 89.5, desc: 'Allows collaborative training across bank branches without sharing customer PII.' },
    { id: 20, name: 'Biometric Integrity Verification', category: 'Security', model: 'Touch/Face Biometric Matcher', status: 'ACTIVE', accuracy: 99.4, desc: 'Analyzes user behavioral biometrics, fingerprint touch dynamics, and facial scans.' }
  ]);
  const [assistantSearchId, setAssistantSearchId] = useState('');
  const [assistantSummary, setAssistantSummary] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // Sound synthesizer for real-time alerts
  const playAlertSound = (type = 'warning') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'danger') {
        // High pitched sirens
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'success') {
        // Cyber success chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Warning chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(440.00, ctx.currentTime + 0.15); // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("AudioContext failed to play sound.", e);
    }
  };

  // Append logs in the System Admin console
  const addTerminalLog = (message) => {
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev.slice(-200), `[${timeStr}] ${message}`]);
  };

  const handleRestartContainer = (cName) => {
    if (rebootingContainer) return;
    playAlertSound('success');
    setRebootingContainer(cName);
    addTerminalLog(`[SYSTEM] System Admin issued reboot command for container [${cName}]`);
    setTimeout(() => {
      setRebootingContainer(null);
      addTerminalLog(`[SYSTEM] Container [${cName}] successfully restarted. All services online and healthy.`);
    }, 2500);
  };

  const handleOptimizeDatabase = () => {
    if (optimizingDatabase) return;
    playAlertSound('success');
    setOptimizingDatabase(true);
    addTerminalLog(`[DATABASE] System Admin triggered SQLite query index optimization...`);
    setTimeout(() => {
      setOptimizingDatabase(false);
      addTerminalLog(`[DATABASE] Database optimization complete. Re-indexed 3 tables, defragmented pages, vacuumed storage.`);
    }, 2000);
  };

  const getPulsingRiskTag = (score) => {
    let color = 'var(--color-safe)';
    let glow = 'var(--color-safe-glow)';
    let text = 'Low';
    if (score >= 0.85) {
      color = 'var(--color-danger)';
      glow = 'var(--color-danger-glow)';
      text = 'High';
    } else if (score >= 0.40) {
      color = 'var(--color-warning)';
      glow = 'var(--color-warning-glow)';
      text = 'Medium';
    }
    
    return (
      <span style={{
        color: color,
        background: glow,
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: '700',
        fontSize: '0.75rem',
        border: `1px solid ${color}44`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: `0 0 8px ${glow}`,
        animation: score >= 0.40 ? 'pulse-risk 1.5s infinite alternate' : 'none'
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
          boxShadow: `0 0 6px ${color}`
        }}></span>
        {text} ({(score * 100).toFixed(0)}%)
      </span>
    );
  };

  // Helper headers for API
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const simScenarios = {
    legit: {
      id: 'TX_SIM_8041',
      amount: 1450,
      location: 'Bangalore, IN',
      device: 'Chrome v120 / macOS 14.1',
      score: 8,
      status: 'Approved',
      explanations: [
        'Transaction amount matches user baseline (+1.2%)',
        'Device fingerprint verified from session logs (-3.5%)',
        'IP geolocation matches default residential network (-4.1%)'
      ],
      shapley: {
        amount: 8,
        location: 5,
        device: 3,
        velocity: 12
      }
    },
    velocity: {
      id: 'TX_SIM_2943',
      amount: 45000,
      location: 'Mumbai, IN',
      device: 'Unknown Android v11 / Mobile App',
      score: 74,
      status: 'MFA Pending',
      explanations: [
        'Sudden burst of 4 rapid payments within 2 minutes (+32.4%)',
        'Merchant category matches high-risk electronics retailer (+18.2%)',
        'Device signature not registered on account (+14.5%)'
      ],
      shapley: {
        amount: 45,
        location: 20,
        device: 65,
        velocity: 82
      }
    },
    gophish: {
      id: 'TX_SIM_9182',
      amount: 150000,
      location: 'London, UK (Hop from Bangalore)',
      device: 'Tor Exit Node / Linux Firefox',
      score: 96,
      status: 'Blocked',
      explanations: [
        'Impossible travel velocity: Bangalore to London in 14 minutes (+55.2%)',
        'Source IP identified as public Tor exit anonymity network (+25.8%)',
        'High value transfer request exceeding average profile limit (+18.4%)'
      ],
      shapley: {
        amount: 60,
        location: 92,
        device: 85,
        velocity: 30
      }
    }
  };

  const handleDemoSearch = (e) => {
    e.preventDefault();
    if (!demoSearchId.trim()) return;
    setDemoSearching(true);
    setDemoSearchRes(null);
    setTimeout(() => {
      const q = demoSearchId.trim().toUpperCase();
      if (q === 'TX100001') {
        setDemoSearchRes({
          id: 'TX100001',
          user: 'ACC001',
          score: 83,
          verdict: 'DECLINED (High Risk Anomaly)',
          summary: 'High transaction amount (₹83,000) combined with unusual payment device fingerprint. GNN cycles flagged potential structured cash-out ring activity.',
          shapValues: {
            'Amount': 42,
            'Device Signature': 26,
            'Geo Location': 12,
            'GNN Network Flow': 3
          }
        });
      } else if (q === 'TX100002') {
        setDemoSearchRes({
          id: 'TX100002',
          user: 'ACC002',
          score: 12,
          verdict: 'APPROVED (Safe Profile)',
          summary: 'Standard local grocery transaction of ₹450 from a highly trusted home device. No anomalous neural patterns detected.',
          shapValues: {
            'Amount': 2,
            'Device Signature': 4,
            'Geo Location': 3,
            'User Profile Baseline': 3
          }
        });
      } else {
        setDemoSearchRes({
          id: q,
          user: 'ACC' + Math.floor(100 + Math.random()*900),
          score: 64,
          verdict: 'MFA_CHALLENGED (Suspicious IP Location)',
          summary: `Mock lookup: Transaction ${q} scored 64% due to unexpected routing IP block. No confirmed fraud history, challenging via secondary verification.`,
          shapValues: {
            'IP Routing Block': 38,
            'Amount': 14,
            'Device Signature': 8,
            'User Profile Baseline': 4
          }
        });
      }
      setDemoSearching(false);
    }, 800);
  };

  // Handle Logins
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginEmail);
      formData.append('password', loginPassword);
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Invalid username or password");
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify({
        username: data.username,
        role: data.role,
        fullName: data.full_name
      }));
      
      setToken(data.access_token);
      setUser({
        username: data.username,
        role: data.role,
        fullName: data.full_name
      });
      
      // Auto-set tab based on role
      if (data.role === 'SysAdmin') {
        setActiveTab('infrastructure_dashboard');
      } else if (data.role === 'Investigator') {
        setActiveTab('fraud_investigation_dashboard');
      } else {
        setActiveTab('dashboard');
      }
      
      addTerminalLog(`User ${data.username} successfully authenticated as ${data.role}`);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Handle Signup & Auto-Login
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
          full_name: signupFullName
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }
      
      setSignupSuccess("Registration successful! Authenticating...");
      
      // Auto-login after registration
      const formData = new URLSearchParams();
      formData.append('username', signupEmail);
      formData.append('password', signupPassword);
      
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      
      if (!loginRes.ok) {
        throw new Error("Registration succeeded but auto-login failed. Please log in manually.");
      }
      
      const loginData = await loginRes.json();
      localStorage.setItem('token', loginData.access_token);
      localStorage.setItem('user', JSON.stringify({
        username: loginData.username,
        role: loginData.role,
        fullName: loginData.full_name
      }));
      
      setToken(loginData.access_token);
      setUser({
        username: loginData.username,
        role: loginData.role,
        fullName: loginData.full_name
      });
      
      // Auto-set tab based on role
      if (loginData.role === 'SysAdmin') {
        setActiveTab('infrastructure_dashboard');
      } else if (loginData.role === 'Investigator') {
        setActiveTab('fraud_investigation_dashboard');
      } else {
        setActiveTab('dashboard');
      }
      
      // Clear fields
      setSignupEmail('');
      setSignupPassword('');
      setSignupFullName('');
      setSignupRole('Investigator');
      setIsSignup(false);
      setSignupSuccess('');
      
      playAlertSound('success');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      
      addTerminalLog(`New user ${loginData.username} registered and logged in as ${loginData.role}`);
    } catch (err) {
      setSignupError(err.message);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setIsSimulating(false);
  };

  // Fetch initial data
  const fetchData = async () => {
    if (!token) return;
    try {
      // 1. Fetch statistics & KPIs
      const statsRes = await fetch(`${API_BASE}/models/stats`, { headers: getHeaders() });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // 2. Fetch active transactions
      const txsRes = await fetch(`${API_BASE}/transactions/history?limit=30`, { headers: getHeaders() });
      if (txsRes.ok) {
        const txsData = await txsRes.json();
        setTransactions(txsData.transactions);
      }
      
      // 3. Fetch alert queue
      const queueRes = await fetch(`${API_BASE}/transactions/queue`, { headers: getHeaders() });
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setQueue(queueData);
      }
      
      // 4. Fetch Active Thresholds
      const threshRes = await fetch(`${API_BASE}/models/thresholds`, { headers: getHeaders() });
      if (threshRes.ok) {
        const threshData = await threshRes.json();
        setThresholds(threshData);
      }

      // 5. Fetch tradeoff curve data
      const curveRes = await fetch(`${API_BASE}/models/tradeoff`, { headers: getHeaders() });
      if (curveRes.ok) {
        const curveData = await curveRes.json();
        setTradeoff(curveData);
      }

      // 6. Fetch logs and health
      if (user?.role === 'Admin') {
        const auditRes = await fetch(`${API_BASE}/models/audit`, { headers: getHeaders() });
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData);
        }
        fetchUsers();
      }

      const healthRes = await fetch(`${API_BASE}/models/health`, { headers: getHeaders() });
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSysHealth(healthData);
      }

      // 7. Fetch monitored escrows
      const escrowsRes = await fetch(`${API_BASE}/transactions/escrows`, { headers: getHeaders() });
      if (escrowsRes.ok) {
        const escrowsData = await escrowsRes.json();
        setEscrows(escrowsData);
      }
    } catch (e) {
      console.error("Error fetching system statistics", e);
    }
  };

  const handleRevertEscrow = async (txId) => {
    try {
      const res = await fetch(`${API_BASE}/transactions/revert/${txId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        playAlertSound('success');
        addTerminalLog(`[ESCROW] Successfully reverted funds for transaction ${txId}`);
        fetchData();
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.6 }
        });
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to revert transaction.");
      }
    } catch (e) {
      console.error("Reversion failed", e);
    }
  };

  const handleReportScam = async (txId) => {
    if (!window.confirm(`Are you sure you want to report transaction ${txId} as a scam? This will instantly flag it and start the 12-hour fund monitor.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/transactions/report-scam/${txId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        playAlertSound('warning');
        addTerminalLog(`[ESCROW] Transaction ${txId} reported as scam. Initiated 12h monitor.`);
        fetchData();
        setActiveTab('escrow_monitor');
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to report transaction as scam.");
      }
    } catch (e) {
      console.error("Scam report failed", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling update every 10s
    return () => clearInterval(interval);
  }, [token]);

  // Handle selected transaction detail fetch
  const handleSelectTx = async (txId) => {
    try {
      const response = await fetch(`${API_BASE}/explain/${txId}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSelectedTx(data);
      }
    } catch (e) {
      console.error("Failed to load explanations", e);
    }
  };

  // Save Threshold Adjustments
  const handleUpdateThresholds = async (fraud, decline) => {
    try {
      const res = await fetch(`${API_BASE}/models/thresholds`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fraud_threshold: fraud, auto_decline_threshold: decline })
      });
      if (res.ok) {
        setThresholds({ fraud_threshold: fraud, auto_decline_threshold: decline });
        addTerminalLog(`Bank Admin updated thresholds: Alert=${fraud}, Decline=${decline}`);
        fetchData();
      }
    } catch (e) {
      console.error("Failed to update thresholds", e);
    }
  };

  // Fetch users for User Management (Admin only)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error("Failed to fetch users list", e);
    }
  };

  // Delete user account (Admin only)
  const handleDeleteUser = async (email) => {
    if (email.trim().toLowerCase() === user.username.trim().toLowerCase()) {
      alert("Self-deletion is not permitted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to revoke access and delete user ${email}?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        playAlertSound('success');
        addTerminalLog(`Bank Admin deleted user account: ${email}`);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete user");
      }
    } catch (e) {
      console.error("Failed to delete user", e);
    }
  };

  // Add/Register user (Admin only)
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserSuccess('');
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addUserEmail,
          password: addUserPassword,
          role: addUserRole,
          full_name: addUserFullName
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }
      
      setAddUserSuccess(`User ${addUserEmail} added successfully!`);
      setAddUserEmail('');
      setAddUserPassword('');
      setAddUserFullName('');
      setAddUserRole('Investigator');
      playAlertSound('success');
      fetchUsers();
    } catch (err) {
      setAddUserError(err.message);
    }
  };

  // Query and explain any transaction (Admin only)
  const handleExplainSearch = async (e) => {
    e.preventDefault();
    if (!explainSearchId.trim()) return;
    setExplainError('');
    setExplainLoading(true);
    setExplainTx(null);
    setExplainTxHistory([]);
    try {
      const response = await fetch(`${API_BASE}/explain/${explainSearchId.trim().toUpperCase()}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setExplainTx(data);
        
        // Fetch user transaction history
        if (data.user_id) {
          setExplainTxHistoryLoading(true);
          try {
            const histRes = await fetch(`${API_BASE}/transactions/history?limit=-1&user_id=${data.user_id}`, { headers: getHeaders() });
            if (histRes.ok) {
              const histData = await histRes.json();
              setExplainTxHistory(histData.transactions || []);
            } else {
              setExplainTxHistory([]);
            }
          } catch (err) {
            console.error("Failed to fetch user transaction history", err);
            setExplainTxHistory([]);
          } finally {
            setExplainTxHistoryLoading(false);
          }
        }
      } else {
        const data = await response.json();
        setExplainError(data.detail || "Transaction ID not found. Verify the ID and try again.");
      }
    } catch (e) {
      console.error("Failed to query transaction explanation", e);
      setExplainError("Failed to fetch explainability report from backend.");
    } finally {
      setExplainLoading(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleToggleModule = (id) => {
    let updatedName = '';
    let updatedStatus = '';
    setAiModules(prev => prev.map(m => {
      if (m.id === id) {
        updatedName = m.name;
        updatedStatus = m.status === 'ACTIVE' ? 'STANDBY' : 'ACTIVE';
        return { ...m, status: updatedStatus };
      }
      return m;
    }));
    
    if (updatedStatus === 'ACTIVE') {
      playAlertSound('success');
      triggerToast(`AI Module [${updatedName}] is now ONLINE (ACTIVE)`);
    } else {
      playAlertSound('warning');
      triggerToast(`AI Module [${updatedName}] placed in STANDBY mode`);
    }
  };

  const handleAssistantQuery = async (e) => {
    e.preventDefault();
    if (!assistantSearchId.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/explain/${assistantSearchId.trim().toUpperCase()}`, { headers: getHeaders() });
      if (!response.ok) {
        throw new Error("Transaction not found. Please try a valid ID like TX100423.");
      }
      const data = await response.json();
      
      const scores = data.model_scores;
      const isHighRisk = data.fraud_score >= 0.70;
      
      const shapHighImpact = Object.entries(data.shapley.shap_values)
        .filter(([k, v]) => v > 0.05)
        .map(([k, v]) => k.replace('_', ' ').toUpperCase());
        
      const explanationText = `Based on our deep cognitive network analysis, transaction ${data.transaction_id} (User ${data.user_id}) has been evaluated with a Consolidated Neural Risk Score of ${(data.fraud_score * 100).toFixed(1)}%.
      
🤖 Attributions & Sub-Models:
• Deep Tabular Neural Net (DNN): ${(scores.dnn * 100).toFixed(1)}% weight attribution.
• Temporal Pattern Matcher (LSTM): ${(scores.lstm * 100).toFixed(1)}% anomaly probability.
• Autoencoder Reconstruction Error: ${(scores.autoencoder * 100).toFixed(1)}% pattern deviation.
• Graph Neural Network (GNN): ${(scores.gnn * 100).toFixed(1)}% network proximity risk.
• Transformer Context Attention: ${(scores.transformer * 100).toFixed(1)}% sequential attention weight.

⚠️ High-Impact Risk Factors:
${shapHighImpact.length > 0 
  ? shapHighImpact.map(factor => `• ${factor}: Substantial deviation from baseline behavioral clusters.`).join('\n')
  : `• No individual feature exceeds the outlier threshold.`}

🚨 Investigator Recommendation:
${isHighRisk 
  ? `🚨 IMMEDIATE ACTION RECOMMENDED: This transaction exhibits high-risk signatures consistent with ${data.cycles_detected && data.cycles_detected.length > 0 ? "a circular money laundering ring" : "an account takeover attempt"}. Recommend blocking the user account and initiating user biometric verification.`
  : `✓ MONITOR ONLY: Risk score is below the investigation threshold. Transaction conforms to normal spending profiles.`}
`;

      setAssistantSummary({
        txId: data.transaction_id,
        user: data.user_id,
        amount: data.amount,
        merchant: data.merchant_name,
        score: data.fraud_score,
        explanation: explanationText
      });
      playAlertSound('success');
      triggerToast(`AI Assistant generated report for ${data.transaction_id}`);
    } catch (err) {
      playAlertSound('warning');
      triggerToast(err.message);
      setAssistantSummary({
        error: true,
        message: err.message
      });
    }
  };

  // Calculate category risk distribution
  const buildCategoryRiskData = (txs) => {
    if (!txs || txs.length === 0) return { labels: [], datasets: [] };
    const categoryStats = {};
    txs.forEach(t => {
      const cat = t.merchant_category || "Other";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, count: 0 };
      }
      categoryStats[cat].total += t.fraud_score || 0;
      categoryStats[cat].count += 1;
    });

    const labels = Object.keys(categoryStats);
    const avgScores = labels.map(l => (categoryStats[l].total / categoryStats[l].count) * 100);

    return {
      labels: labels.map(l => l.toUpperCase()),
      datasets: [
        {
          label: 'Average Category Risk Score (%)',
          data: avgScores,
          backgroundColor: 'rgba(255, 51, 102, 0.4)',
          borderColor: 'rgba(255, 51, 102, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Handle Verification Review Simulations
  useEffect(() => {
    if (selectedHeldTx && selectedHeldTx.verification_method === 'Face ID') {
      setFaceConfidence(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 8;
        if (progress >= 94) {
          progress = 94.2;
          clearInterval(interval);
        }
        setFaceConfidence(progress);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [selectedHeldTx]);

  useEffect(() => {
    if (selectedHeldTx && selectedHeldTx.verification_method === 'OTP') {
      const logs = [
        `[${new Date().toLocaleTimeString()}] OTP Request Initiated`,
        `[${new Date().toLocaleTimeString()}] SMS Gateway Handshake Successful`,
        `[${new Date().toLocaleTimeString()}] SMS Delivered to Customer (+91 *******231)`,
        `[${new Date().toLocaleTimeString()}] Awaiting User Input (OTP Sent)`
      ];
      setOtpLog(logs);
    }
  }, [selectedHeldTx]);

  const handleVerifyTransaction = async (txId, status, method, score) => {
    try {
      const response = await fetch(`${API_BASE}/transactions/verify/${txId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status, method, score })
      });
      if (response.ok) {
        setSelectedHeldTx(null);
        playAlertSound(status === 'Verified' ? 'success' : 'danger');
        triggerToast(`Transaction ${txId} successfully ${status === 'Verified' ? 'released' : 'blocked'}.`);
        confetti({ particleCount: 60, spread: 40, origin: { y: 0.8 } });
        fetchData();
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to verify transaction");
      }
    } catch (e) {
      console.error("Verification failed", e);
    }
  };

  // Submit Feedback Resolution
  const handleResolveAlert = async (e) => {
    e.preventDefault();
    if (!selectedTx) return;
    try {
      const res = await fetch(`${API_BASE}/transactions/resolve/${selectedTx.transaction_id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: feedbackAction, comments: feedbackComments })
      });
      
      if (res.ok) {
        setShowFeedbackModal(false);
        setFeedbackComments('');
        playAlertSound('success');
        
        // visual confirmation burst
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
        
        addTerminalLog(`Investigator resolved alert ${selectedTx.transaction_id} as: ${feedbackAction}`);
        
        // Clear selected and reload
        setSelectedTx(null);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to submit resolution");
      }
    } catch (e) {
      console.error("Resolution submit failure", e);
    }
  };

  // Simulator pump to trigger API transactions
  useEffect(() => {
    let simInterval = null;
    if (isSimulating) {
      addTerminalLog("Transaction simulator activated. Emitting safe and risk profiles...");
      
      const locations = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "London", "New York"];
      const merchantCategories = ["Groceries", "Dining", "Utilities", "Electronics", "Transfer", "Travel"];
      
      simInterval = setInterval(async () => {
        // Synthesize transaction parameters
        const isAnomalous = Math.random() < 0.25; // 25% anomalies
        const userNum = Math.floor(Math.random() * 30) + 1;
        const uid = `ACC${userNum.toString().padStart(3, '0')}`;
        
        let amount = Math.floor(Math.random() * 3000) + 150;
        let location = "Bangalore";
        let device_id = `DEV_${1000 + userNum}`;
        let category = "Groceries";
        let tx_type = "UPI";
        
        if (isAnomalous) {
          const anomalyType = Math.random();
          if (anomalyType < 0.3) {
            // Geolocation Hop / Unusual Category
            amount = Math.floor(Math.random() * 60000) + 20000;
            location = Math.random() < 0.5 ? "London" : "New York";
            device_id = `DEV_ANOMALY_IP`;
            category = "Travel";
            tx_type = "Credit Card";
          } else if (anomalyType < 0.6) {
            // Velocity Attack
            amount = Math.floor(Math.random() * 40000) + 10000;
            category = "Electronics";
            tx_type = "UPI";
          } else {
            // Circular transfers
            amount = 50000;
            category = "Transfer";
            tx_type = "UPI";
          }
        }
        
        const txInput = {
          user_id: uid,
          merchant_id: category === "Transfer" 
            ? `ACC${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}` 
            : `MERCH_${String(Math.floor(Math.random() * 40) + 1).padStart(3, '0')}`,
          amount: amount,
          transaction_type: tx_type,
          location: location,
          device_id: device_id
        };
        
        try {
          const response = await fetch(`${API_BASE}/transactions/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txInput)
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Append log output
            if (data.status === 'Declined') {
              playAlertSound('danger');
              addTerminalLog(`[ALERT] High risk transaction blocked automatically. ID: ${data.transaction_id}, User: ${data.user_id}, Score: ${data.fraud_score.toFixed(2)}`);
            } else if (data.status === 'Pending') {
              playAlertSound('warning');
              addTerminalLog(`[WARNING] Suspicious transaction flagged for analyst review. ID: ${data.transaction_id}, Score: ${data.fraud_score.toFixed(2)}`);
            } else if (data.status === 'Hold') {
              playAlertSound('warning');
              addTerminalLog(`[HOLD] Suspicious transaction placed on 20-minute hold. ID: ${data.transaction_id}, Score: ${data.fraud_score.toFixed(2)}, Method: ${data.verification_method}`);
            } else {
              addTerminalLog(`[INFO] Legitimate transaction approved. ID: ${data.transaction_id}, Amount: INR ${data.amount}`);
            }
            
            // Trigger fetch data
            fetchData();
          }
        } catch (e) {
          console.error("Simulation ingestion failed", e);
        }
      }, 5000); // Process a transaction every 5 seconds
    } else {
      if (token) addTerminalLog("Transaction simulator paused.");
    }
    
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [isSimulating, token]);

  // Terminal scroll helper
  useEffect(() => {
    if (logsAutoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, logsAutoScroll]);
  if (!user) {
    const scenario = simScenarios[simScenario] || simScenarios.legit;

    return (
      <div className="landing-page">
        <div className="glow-blob blob-blue"></div>
        <div className="glow-blob blob-purple"></div>
        <div className="glow-blob blob-green"></div>
        
        {/* Navigation Header */}
        <header className="landing-nav">
          <div className="brand-section">
            <div className="brand-logo">Ω</div>
            <div className="brand-name">OmniTrace</div>
          </div>
          <nav className="nav-links">
            <a href="#features" className="nav-link">Capabilities</a>
          </nav>
          <button 
            type="button" 
            className="btn-primary nav-access-btn" 
            onClick={() => setShowLoginModal(true)}
          >
            Access Console
          </button>
        </header>

        {/* Hero Section */}
        <section className="hero-container">
          <div className="hero-content">
            <span className="hero-tag">Explainable Risk Intelligence</span>
            <h1 className="hero-title">
              Securing Every Transaction with Advanced Risk Intelligence
            </h1>
            <p className="hero-subtitle">
              OmniTrace is an advanced risk intelligence portal built to protect financial networks in real time. Designed for commercial banks, UPI operators, and digital payment gateways, it delivers absolute transparency and transaction-level explainability for regulatory compliance and audit readiness.
            </p>
            <div className="hero-actions">
              <button 
                type="button" 
                className="btn-primary btn-pulse hero-btn" 
                onClick={() => setShowLoginModal(true)}
              >
                Launch Console
              </button>
            </div>
            
            {/* Hero Stats */}
            <div className="hero-stats">
              <div className="glass-panel stat-card">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Ingestion Accuracy</div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-value">&lt; 30ms</div>
                <div className="stat-label">Scoring Latency</div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-value">₹250 Cr+</div>
                <div className="stat-label">Volume Protected</div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Purposes & Target Audience Section */}
        <section className="features-section" id="features">
          <div className="section-header">
            <span className="section-subtitle">Key Purposes & Target Audience</span>
            <h2 className="section-title">Safeguarding the Digital Payment Ecosystem</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon">🏦</div>
              <h3 className="feature-title">Commercial Banking</h3>
              <p className="feature-desc">Shielding retail and corporate accounts from account takeover (ATO), unauthorized sweeps, and high-velocity cash-outs.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">UPI & P2P Operators</h3>
              <p className="feature-desc">Mitigating real-time transfer fraud and identifying digital money-mule accounts across distributed payment networks.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">💳</div>
              <h3 className="feature-title">Payment Gateways</h3>
              <p className="feature-desc">Protecting card-not-present (CNP) channels, digital wallets, and terminal routes from complex transactional threats.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">⚖️</div>
              <h3 className="feature-title">Compliance & Auditing</h3>
              <p className="feature-desc">Delivering transaction-level risk intelligence and forensic logs to support regulatory reporting and audit readiness.</p>
            </div>
          </div>
        </section>

        {/* Key Features Slide Section */}
        {(() => {
          const landingSlides = [
            {
              title: "Adaptive Hold & Verification",
              icon: "⏱️",
              features: [
                { name: "20-Minute Smart Transaction Hold", desc: "Suspicious transactions are held for 20 minutes instead of being immediately approved or blocked, protecting victim funds from rapid draining." },
                { name: "Face Recognition & OTP Verification", desc: "A verification layer is initiated where customers complete verification using high-accuracy Face Recognition or OTP verification." },
                { name: "Verified / Unverified Transaction Validation", desc: "Based on the validation results, risk scores are recalculated, allowing investigators and admins to take appropriate actions." }
              ]
            },
            {
              title: "Real-Time AI Ingestion & Scoring",
              icon: "⚡",
              features: [
                { name: "Real-Time Fraud Detection", desc: "Detects transaction-level fraud signatures instantly under 50ms using low-latency multi-model execution." },
                { name: "AI-Based Risk Scoring", desc: "Aggregates predictions from DNN, LSTM, Autoencoder, and Graph Neural Network (GNN) classifiers into a single risk score." },
                { name: "Real-Time Fraud Dashboard", desc: "Visualizes alert queues, metrics, container statuses, and transaction flows in real time for security controllers." }
              ]
            },
            {
              title: "Context & Behavioral Intelligence",
              icon: "🧠",
              features: [
                { name: "Behavioral Pattern Analysis", desc: "Uses recurrent sequence networks to model individual spending history and flag out-of-pattern spikes." },
                { name: "Geolocation Anomaly Detection", desc: "Triangulates transaction locations and flags physical impossibility hops (e.g. India to UK in 10 minutes)." },
                { name: "Device Fingerprint Intelligence", desc: "Checks hardware properties, browser signatures, and network proxy headers to detect device spoofing." }
              ]
            },
            {
              title: "Forensic Explainability & Operations",
              icon: "🔍",
              features: [
                { name: "Explainable AI (XAI)", desc: "Explains every mathematical risk score using feature attribution waterfall charts built on Shapley values." },
                { name: "Smart Alert Prioritization", desc: "Prioritizes queue items based on threat levels, transaction values, and model confidence scores to maximize SLA efficiency." },
                { name: "Fraud Heatmaps", desc: "Aggregates fraud instances in spatial density charts, isolating high-intensity geographic regions with high fraud rates." }
              ]
            },
            {
              title: "Self-Learning & Advanced Network Models",
              icon: "🛡️",
              features: [
                { name: "Fraud Ring Detection", desc: "Uses Graph Neural Networks (GNNs) to construct account relationships and uncover circular transfer chains." },
                { name: "Transaction Sequence Intelligence", desc: "Analyzes velocity chains to detect automated script cascades and money-mule distribution patterns." },
                { name: "Adaptive Learning Engine", desc: "Retrains tabular weights dynamically using reinforcement from analyst feedback (Confirm Fraud/Dismiss Alert)." }
              ]
            }
          ];

          return (
            <section className="features-section" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--panel-border)', borderBottom: '1px solid var(--panel-border)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                <span className="section-subtitle">Core Platform Capabilities</span>
                <h2 className="section-title">Key Features Showcase</h2>
              </div>
              
              <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '32px', position: 'relative', overflow: 'hidden', border: '1px solid var(--panel-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{landingSlides[currentSlide].icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{landingSlides[currentSlide].title}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Slide {currentSlide + 1} of {landingSlides.length}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '260px' }}>
                  {landingSlides[currentSlide].features.map((feature, idx) => (
                    <div key={idx} style={{ paddingLeft: '16px', borderLeft: '3px solid var(--color-primary)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{feature.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{feature.desc}</p>
                    </div>
                  ))}
                </div>
                
                {/* Slide Navigation controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid var(--panel-border)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {landingSlides.map((_, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          border: 'none',
                          background: idx === currentSlide ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'background 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev === 0 ? landingSlides.length - 1 : prev - 1))}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--panel-border)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      ◀ Prev
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev === landingSlides.length - 1 ? 0 : prev + 1))}
                      style={{
                        background: 'var(--color-primary)',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Footer */}
        <footer className="landing-footer">
          © {new Date().getFullYear()} OmniTrace Risk Analytics Platform. Protected by Advanced Cryptographic Ledger and Explainable Intelligence.
        </footer>

        {/* Auth Modal Overlay */}
        <div className={`auth-modal-overlay ${showLoginModal ? 'active' : ''}`} onClick={(e) => { if (e.target.className.includes('auth-modal-overlay')) setShowLoginModal(false); }}>
          <div className="auth-modal-content">
            <button 
              type="button" 
              className="modal-close-btn"
              onClick={() => setShowLoginModal(false)}
            >
              ×
            </button>
            
            <div className="glass-panel login-card auth-glow" style={{ marginTop: 0, width: '100%' }}>
              <div className="login-header">
                <div className="brand-logo">Ω</div>
                <h1 className="login-title">OmniTrace</h1>
                <p className="login-subtitle">Transaction Integrity & Risk Intelligence Portal</p>
              </div>

              <div className="auth-tabs">
                <button 
                  type="button" 
                  className={`auth-tab ${!isSignup ? 'active' : ''}`}
                  onClick={() => { setIsSignup(false); setLoginError(''); setSignupError(''); }}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className={`auth-tab ${isSignup ? 'active' : ''}`}
                  onClick={() => { setIsSignup(true); setLoginError(''); setSignupError(''); }}
                >
                  Register
                </button>
              </div>
              
              {!isSignup ? (
                <form onSubmit={handleLogin}>
                  {loginError && (
                    <div className="auth-error-msg">
                      ⚠️ {loginError}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="Enter system email"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary">
                    Authenticate & Decrypt
                  </button>
                  
                  <div className="login-demo-helper">
                    <h4>Demo Role Credentials (Click to Autofill)</h4>
                    <ul>
                      <li onClick={() => { setLoginEmail('admin@omnitrace.com'); setLoginPassword('admin123'); }} style={{ cursor: 'pointer' }} className="demo-fill-item">
                        <span>Bank Admin:</span>
                        <code>admin@omnitrace.com / admin123</code>
                      </li>
                      <li onClick={() => { setLoginEmail('investigator@omnitrace.com'); setLoginPassword('inv123'); }} style={{ cursor: 'pointer' }} className="demo-fill-item">
                        <span>Investigator:</span>
                        <code>investigator@omnitrace.com / inv123</code>
                      </li>
                      <li onClick={() => { setLoginEmail('sysadmin@omnitrace.com'); setLoginPassword('sys123'); }} style={{ cursor: 'pointer' }} className="demo-fill-item">
                        <span>System Admin:</span>
                        <code>sysadmin@omnitrace.com / sys123</code>
                      </li>
                    </ul>
                  </div>
                  
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--panel-border)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>🔗 API Gateway Server:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontSize: '0.75rem', wordBreak: 'break-all' }}>{API_BASE}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newUrl = prompt("Enter your backend API Gateway URL (e.g. http://192.168.1.10:8000/api):", API_BASE);
                        if (newUrl !== null && newUrl.trim() !== '') {
                          localStorage.setItem('omnitrace_api_base', newUrl.trim());
                          window.location.reload();
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--panel-border)',
                        color: 'var(--text-primary)',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'background 0.2s',
                        textAlign: 'center'
                      }}
                      onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      Configure API Gateway Address
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup}>
                  {signupError && (
                    <div className="auth-error-msg">
                      ⚠️ {signupError}
                    </div>
                  )}
                  {signupSuccess && (
                    <div className="auth-success-msg">
                      ✓ {signupSuccess}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={signupFullName}
                      onChange={e => setSignupFullName(e.target.value)}
                      placeholder="e.g. Chief Risk Officer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="Enter a valid email address"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Role Access</label>
                    <select
                      className="form-input form-select"
                      value={signupRole}
                      onChange={e => setSignupRole(e.target.value)}
                      required
                    >
                      <option value="Investigator">Fraud Investigator</option>
                      <option value="Admin">Bank Admin</option>
                      <option value="SysAdmin">System Administrator</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="btn-primary">
                    Register & Initialize
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard trend chart configuration
  const trendChartData = {
    labels: stats?.trends?.labels || [],
    datasets: [
      {
        label: 'Transaction Amount (INR)',
        data: stats?.trends?.amounts || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Fraud Score',
        data: stats?.trends?.scores || [],
        borderColor: '#FF3366',
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#F3F4F6', font: { family: 'Inter' } } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
      y: { position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
      y1: { position: 'right', min: 0, max: 1, grid: { drawOnChartArea: false }, ticks: { color: '#9CA3AF' } }
    }
  };

  // Score distribution chart configuration
  const distributionChartData = {
    labels: stats?.drift?.curve_labels || [],
    datasets: [
      {
        label: 'Legitimate',
        data: stats?.drift?.legitimate_distribution || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Fraudulent',
        data: stats?.drift?.fraudulent_distribution || [],
        borderColor: '#FF3366',
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // SHAP waterfall bar chart data builder
  const buildShapChartData = (shapley) => {
    if (!shapley) return { labels: [], datasets: [] };
    
    // Sort features by impact value
    const sorted = Object.entries(shapley.shap_values)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      
    const labels = sorted.map(e => e[0].replace('_', ' ').toUpperCase());
    const values = sorted.map(e => e[1]);
    
    return {
      labels: labels,
      datasets: [
        {
          label: 'Shapley Valuation Contribution',
          data: values,
          backgroundColor: values.map(v => v >= 0 ? 'rgba(255, 51, 102, 0.65)' : 'rgba(16, 185, 129, 0.65)'),
          borderColor: values.map(v => v >= 0 ? '#FF3366' : '#10B981'),
          borderWidth: 1
        }
      ]
    };
  };

  // Tradeoff curve graph configuration
  const tradeoffChartData = {
    labels: tradeoff?.thresholds || [],
    datasets: [
      {
        label: 'False Positive Rate (FPR %)',
        data: tradeoff?.fpr || [],
        borderColor: '#3B82F6',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0.2
      },
      {
        label: 'False Negative Rate (FNR %)',
        data: tradeoff?.fnr || [],
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.2
      }
    ]
  };

  // API latency chart configuration
  const apiLatencyChartData = {
    labels: ['17:30', '17:35', '17:40', '17:45', '17:50', '17:55', '18:00'],
    datasets: [
      {
        label: 'p99 Latency (ms)',
        data: [98, 112, 85, 120, 95, 104, 90],
        borderColor: '#FF3366',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'p95 Latency (ms)',
        data: [32, 45, 38, 41, 35, 42, 36],
        borderColor: '#8B5CF6',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'p50 Latency (ms)',
        data: [12, 15, 13, 16, 14, 15, 14],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.3,
        borderWidth: 2,
        fill: true
      }
    ]
  };

  // API HTTP status code distribution
  const apiStatusCodesChartData = {
    labels: ['2xx OK', '3xx Redirect', '4xx Client Error', '5xx Server Error'],
    datasets: [
      {
        label: 'Requests Count',
        data: [18450, 240, 78, 3],
        backgroundColor: [
          'rgba(16, 185, 129, 0.65)',
          'rgba(59, 130, 246, 0.65)',
          'rgba(245, 158, 11, 0.65)',
          'rgba(255, 51, 102, 0.65)'
        ],
        borderColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#FF3366'
        ],
        borderWidth: 1
      }
    ]
  };

  // API charts general options
  const apiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#F3F4F6', font: { family: 'Inter', size: 10 } } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF', font: { size: 10 } } }
    }
  };

  // Cloud management network traffic
  const cloudTrafficChartData = {
    labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    datasets: [
      {
        label: 'Network Egress (MB)',
        data: [120, 240, 180, 310, 420, 380, 290, 340],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        tension: 0.3,
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Network Ingress (MB)',
        data: [45, 80, 62, 110, 140, 130, 95, 105],
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="app-container">
      <style>{`
        @keyframes pulse-risk {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.03); opacity: 1; }
        }
        @keyframes container-reboot-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .container-rebooting {
          animation: container-reboot-pulse 1s infinite alternate;
        }
      `}</style>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">Ω</div>
          <span className="brand-name">OmniTrace</span>
        </div>
        
        <nav className="sidebar-nav">
          {user.role === 'Admin' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Fraud Dashboard
              </div>
              <div 
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 User Management
              </div>
              <div 
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                📈 Fraud Analytics
              </div>
              <div 
                className={`nav-item ${activeTab === 'thresholds' ? 'active' : ''}`}
                onClick={() => setActiveTab('thresholds')}
              >
                ⚙️ Threshold Config
              </div>
              <div 
                className={`nav-item ${activeTab === 'explainability' ? 'active' : ''}`}
                onClick={() => setActiveTab('explainability')}
              >
                🔍 Explainability Reports
              </div>
              <div 
                className={`nav-item ${activeTab === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveTab('risk')}
              >
                🛡️ Risk Analytics
              </div>
              <div 
                className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('queue')}
              >
                🚨 Alert Queue
                {queue.length > 0 && (
                  <span style={{ 
                    background: 'var(--color-danger)', 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px',
                    marginLeft: 'auto',
                    fontWeight: '700'
                  }}>{queue.length}</span>
                )}
              </div>
              <div 
                className={`nav-item ${activeTab === 'ai_engines_hub' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai_engines_hub')}
              >
                🧠 AI Cognitive Hub
              </div>
            </>
          )}

          {user.role === 'Investigator' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'fraud_investigation_dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('fraud_investigation_dashboard')}
              >
                🕵️ Fraud Investigation Dashboard
              </div>
              <div 
                className={`nav-item ${activeTab === 'live_transaction_monitoring' ? 'active' : ''}`}
                onClick={() => setActiveTab('live_transaction_monitoring')}
              >
                📊 Live Transaction Monitoring
              </div>
              <div 
                className={`nav-item ${activeTab === 'fraud_alert_queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('fraud_alert_queue')}
              >
                🚨 Fraud Alert Queue
                {queue.length > 0 && (
                  <span style={{ 
                    background: 'var(--color-danger)', 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px',
                    marginLeft: 'auto',
                    fontWeight: '700'
                  }}>{queue.length}</span>
                )}
              </div>
              <div 
                className={`nav-item ${activeTab === 'explainable_ai_reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('explainable_ai_reports')}
              >
                🔍 Explainable AI Reports
              </div>
              <div 
                className={`nav-item ${activeTab === 'transaction_history_analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('transaction_history_analysis')}
              >
                📅 Transaction History Analysis
              </div>
              <div 
                className={`nav-item ${activeTab === 'geolocation_fraud_heatmaps' ? 'active' : ''}`}
                onClick={() => setActiveTab('geolocation_fraud_heatmaps')}
              >
                🗺️ Geolocation Fraud Heatmaps
              </div>
              <div 
                className={`nav-item ${activeTab === 'risk_score_analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('risk_score_analytics')}
              >
                🛡️ Risk Score Analytics
              </div>
              <div 
                className={`nav-item ${activeTab === 'fraud_trend_reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('fraud_trend_reports')}
              >
                📈 Fraud Trend Reports
              </div>
              <div 
                className={`nav-item ${activeTab === 'ai_engines_hub' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai_engines_hub')}
              >
                🧠 AI Cognitive Hub
              </div>
              <div 
                className={`nav-item ${activeTab === 'escrow_monitor' ? 'active' : ''}`}
                onClick={() => setActiveTab('escrow_monitor')}
              >
                ⏱️ Escrow Monitor
              </div>
              <div 
                className="nav-item nav-item-signout"
                onClick={handleLogout}
                style={{
                  marginTop: '16px',
                  color: 'var(--color-danger)',
                  background: 'rgba(255, 51, 102, 0.08)',
                  border: '1px solid rgba(255, 51, 102, 0.25)',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255, 51, 102, 0.18)';
                  e.currentTarget.style.borderColor = 'var(--color-danger)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255, 51, 102, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 51, 102, 0.25)';
                }}
              >
                🚪 Sign Out
              </div>
            </>
          )}

          {user.role === 'SysAdmin' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'infrastructure_dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('infrastructure_dashboard')}
              >
                🖥️ Infrastructure Dashboard
              </div>
              <div 
                className={`nav-item ${activeTab === 'deployment_monitoring' ? 'active' : ''}`}
                onClick={() => setActiveTab('deployment_monitoring')}
              >
                🚀 Deployment Monitoring
              </div>
              <div 
                className={`nav-item ${activeTab === 'api_monitoring' ? 'active' : ''}`}
                onClick={() => setActiveTab('api_monitoring')}
              >
                📈 API Monitoring
              </div>
              <div 
                className={`nav-item ${activeTab === 'cloud_management' ? 'active' : ''}`}
                onClick={() => setActiveTab('cloud_management')}
              >
                ☁️ Cloud Management
              </div>
              <div 
                className={`nav-item ${activeTab === 'database_management' ? 'active' : ''}`}
                onClick={() => setActiveTab('database_management')}
              >
                💾 Database Management
              </div>
              <div 
                className={`nav-item ${activeTab === 'security_monitoring' ? 'active' : ''}`}
                onClick={() => setActiveTab('security_monitoring')}
              >
                🛡️ Security Monitoring
              </div>
              <div 
                className={`nav-item ${activeTab === 'container_management' ? 'active' : ''}`}
                onClick={() => setActiveTab('container_management')}
              >
                📦 Container Management
              </div>
              <div 
                className={`nav-item ${activeTab === 'performance_logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('performance_logs')}
              >
                📋 Performance Logs
              </div>
            </>
          )}
        </nav>
        
        {/* Simulator controls inside sidebar */}
        <div style={{ margin: '24px 0', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            📡 Ingestion Simulator
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: isSimulating ? 'var(--color-safe)' : 'var(--text-muted)' }}>
              {isSimulating ? '● Streaming (5s)' : '○ Suspended'}
            </span>
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                background: isSimulating ? 'var(--color-danger)' : 'var(--color-primary)',
                border: 'none',
                color: 'white',
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {isSimulating ? 'Pause' : 'Activate'}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div className="user-avatar" style={{ background: user.role === 'Investigator' ? 'var(--color-purple)' : user.role === 'Admin' ? 'var(--color-primary)' : '#10B981' }}>
              {user.username.slice(0,2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.fullName}</span>
              <span className="user-role" style={{ color: user.role === 'Investigator' ? 'var(--color-purple)' : 'var(--text-secondary)', fontWeight: '600' }}>{user.role}</span>
            </div>
          </div>
          <button 
            type="button"
            className="btn-signout-sidebar"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              borderRadius: '6px',
              color: 'var(--color-danger)',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--color-danger)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)';
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
          >
            <span>🚪</span>
            <span>Sign Out ({user.role})</span>
          </button>
        </div>
      </aside>

      {/* Main Content viewport */}
      <main className="main-content">
        <header className="top-bar">
          <h2 className="page-title">
            {activeTab === 'dashboard' && (user.role === 'Admin' ? 'Fraud Dashboard' : 'Analytics Board')}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'analytics' && 'Fraud Analytics'}
            {activeTab === 'thresholds' && 'Threshold Configuration'}
            {activeTab === 'explainability' && 'Explainability Reports'}
            {activeTab === 'risk' && 'Risk Analytics'}
            {activeTab === 'queue' && 'Investigation Queue'}
            {activeTab === 'models' && 'Model Governance & Settings'}
            {activeTab === 'system' && 'Infrastructure & Containers'}
            {activeTab === 'live_stream' && 'Live Transaction Stream'}
            {activeTab === 'fraud_investigation_dashboard' && 'Fraud Investigation Dashboard'}
            {activeTab === 'live_transaction_monitoring' && 'Live Transaction Monitoring Stream'}
            {activeTab === 'fraud_alert_queue' && 'Fraud Alert Investigation Queue'}
            {activeTab === 'explainable_ai_reports' && 'Explainable AI Feature Reports'}
            {activeTab === 'transaction_history_analysis' && 'Historical Transaction Audit Logs'}
            {activeTab === 'geolocation_fraud_heatmaps' && 'Global Geolocation Fraud Heatmaps'}
            {activeTab === 'risk_score_analytics' && 'Risk Score Distribution Analytics'}
            {activeTab === 'fraud_trend_reports' && 'Fraud Trend Analysis Reports'}
            {activeTab === 'ai_engines_hub' && 'Cognitive AI Engines & Governance Hub'}
            {activeTab === 'infrastructure_dashboard' && 'Global Node & Infrastructure Dashboard'}
            {activeTab === 'deployment_monitoring' && 'CI/CD Pipeline & Deployment Monitoring'}
            {activeTab === 'api_monitoring' && 'API Request & Response Monitoring'}
            {activeTab === 'cloud_management' && 'GCP & Firebase Cloud Management'}
            {activeTab === 'database_management' && 'FastAPI & SQLite Database Management'}
            {activeTab === 'security_monitoring' && 'Firewall & Cloud Security Monitoring'}
            {activeTab === 'container_management' && 'Docker Container Cluster Management'}
            {activeTab === 'performance_logs' && 'Real-Time System Performance Logs'}
          </h2>
          
          <div className="system-status" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className={`status-dot ${isSimulating ? '' : 'danger'}`}></div>
              <span className="status-text">{isSimulating ? 'Live Scoring Online' : 'Engine Idle'}</span>
            </div>

            {/* Prominent User Badge & Sign Out Button in Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--panel-border)', paddingLeft: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: user.role === 'Admin' ? 'var(--color-primary)' : user.role === 'Investigator' ? 'var(--color-purple)' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  color: '#fff'
                }}>
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{user.fullName || user.username}</span>
                  <span style={{ fontSize: '0.7rem', color: user.role === 'Investigator' ? 'var(--color-purple)' : 'var(--text-muted)' }}>{user.role}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-signout-header"
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 51, 102, 0.12)',
                  border: '1px solid rgba(255, 51, 102, 0.35)',
                  color: 'var(--color-danger)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'var(--color-danger)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255, 51, 102, 0.12)';
                  e.currentTarget.style.color = 'var(--color-danger)';
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>
        
        <div className="dashboard-viewport">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPIs */}
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>TOTAL AUDITED</span>
                    <span className="kpi-icon">📋</span>
                  </div>
                  <div className="kpi-value">{stats?.kpis?.total_transactions || 0}</div>
                  <div className="kpi-footer">Transactions evaluated in database</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>FRAUD BLOCKED</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-danger)' }}>🛡️</span>
                  </div>
                  <div className="kpi-value">₹{(stats?.kpis?.fraud_prevented_inr || 0).toLocaleString()}</div>
                  <div className="kpi-footer">Total financial losses prevented</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>ALERT QUEUE</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-warning)' }}>🚨</span>
                  </div>
                  <div className="kpi-value">{stats?.kpis?.pending_alerts || 0}</div>
                  <div className="kpi-footer">Flagged pending reviews</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>FALSE POSITIVE RATE</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-safe)' }}>📉</span>
                  </div>
                  <div className="kpi-value">{stats?.kpis?.false_positive_rate || 3.24}%</div>
                  <div className="kpi-footer">Declines validated as legitimate</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>SCORING LATENCY</span>
                    <span className="kpi-icon">⚡</span>
                  </div>
                  <div className="kpi-value">{stats?.kpis?.average_latency_ms || 14.2} ms</div>
                  <div className="kpi-footer">Average neural execution time</div>
                </div>
              </div>

              {/* Adaptive Hold System Dashboard Section for Bank Admin */}
              {user.role === 'Admin' && stats?.hold_stats && (
                <div style={{ marginTop: '24px' }}>
                  <div className="section-header" style={{ marginBottom: '16px' }}>
                    <span className="section-subtitle">Adaptive Transaction Verification & Hold System</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '4px', marginBottom: '16px' }}>Held & Verified Transactions Monitor</h3>
                  </div>

                  {/* Hold System KPIs */}
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL HELD TRANSACTIONS</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-primary)' }}>{stats.hold_stats.total_held}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flagged high-risk payments held</div>
                    </div>
                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>VERIFIED TRANSACTIONS</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-safe)' }}>{stats.hold_stats.verified_count}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Released after successful auth</div>
                    </div>
                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>UNVERIFIED TRANSACTIONS</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-danger)' }}>{stats.hold_stats.unverified_count}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blocked due to verification failure</div>
                    </div>
                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING VERIFICATION</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-warning)' }}>{stats.hold_stats.pending_verification}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Awaiting customer validation</div>
                    </div>
                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>VERIFICATION SUCCESS RATE</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-safe)' }}>{stats.hold_stats.verification_success_rate}%</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ratio of verified over total holds</div>
                    </div>
                  </div>

                  {/* Service Stats Subgrid */}
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px', marginBottom: '12px' }}>
                        👤 Face Verification Statistics
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Total Face ID Attempts:</span>
                        <span style={{ fontWeight: '700' }}>{stats.hold_stats.face_verification.attempts}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Successful Face Matches:</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-safe)' }}>{stats.hold_stats.face_verification.success}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>Avg Match Confidence:</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{(stats.hold_stats.face_verification.avg_confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px', marginBottom: '12px' }}>
                        💬 OTP Verification Statistics
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Total OTP Attempts:</span>
                        <span style={{ fontWeight: '700' }}>{stats.hold_stats.otp_verification.attempts}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Successful OTP Submissions:</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-safe)' }}>{stats.hold_stats.otp_verification.success}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>OTP Delivery Success Rate:</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-safe)' }}>{stats.hold_stats.otp_verification.delivery_rate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Admin Held Transactions Table */}
                  <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                      📑 Held Transactions Queue (Verification Logs)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px' }}>Transaction ID</th>
                            <th style={{ padding: '10px' }}>Risk Score</th>
                            <th style={{ padding: '10px' }}>Hold Status</th>
                            <th style={{ padding: '10px' }}>Verification Method</th>
                            <th style={{ padding: '10px' }}>Verification Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.filter(t => t.verification_status !== null || t.status === 'Hold').slice(0, 10).map((t) => {
                            const isActive = t.status === 'Hold' && t.verification_status === 'Pending' && t.hold_expires > nowTime;
                            return (
                              <tr key={t.transaction_id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                <td style={{ padding: '10px', fontWeight: '600' }}>{t.transaction_id}</td>
                                <td style={{ padding: '10px' }}>
                                  <span className={`tx-score-tag ${t.fraud_score >= 0.85 ? 'high' : t.fraud_score >= 0.4 ? 'medium' : 'low'}`}>
                                    {(t.fraud_score * 100).toFixed(0)}%
                                  </span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: '700',
                                    background: isActive ? 'rgba(255, 171, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                                    color: isActive ? 'var(--color-warning)' : 'var(--text-muted)'
                                  }}>
                                    {isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px' }}>{t.verification_method || 'N/A'}</td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ 
                                    color: t.verification_status === 'Verified' ? 'var(--color-safe)' : 
                                           t.verification_status === 'Unverified' ? 'var(--color-danger)' : 
                                           'var(--color-warning)',
                                    fontWeight: '700'
                                  }}>
                                    {t.verification_status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {transactions.filter(t => t.verification_status !== null || t.status === 'Hold').length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No held transactions registered in this cycle.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts row (only for non-Admin investigators, since Admin has deep dive tabs) */}
              {user.role !== 'Admin' && (
                <div className="charts-row">
                  <div className="glass-panel chart-card">
                    <div className="chart-title">Real-Time Risk & Ingestion Profile</div>
                    <div style={{ position: 'relative', height: '280px' }}>
                      <Line data={trendChartData} options={trendChartOptions} />
                    </div>
                  </div>
                  
                  <div className="glass-panel chart-card">
                    <div className="chart-title">Neural Drift & Anomaly</div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Data Drift Index: <b>{stats?.drift?.data_drift || 0.08}</b></span>
                      <span>Concept Drift Index: <b>{stats?.drift?.concept_drift || 0.05}</b></span>
                    </div>
                    <div style={{ padding: '8px', border: '1px solid var(--panel-border)', borderRadius: '6px', background: 'rgba(0,0,0,0.1)', textAlign: 'center', marginBottom: '16px' }}>
                      System Status: <span style={{ color: stats?.drift?.drift_status === 'Normal' ? 'var(--color-safe)' : 'var(--color-warning)', fontWeight: '700' }}>
                        {stats?.drift?.drift_status || "NORMAL"}
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: '170px' }}>
                      <Line 
                        data={distributionChartData} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false, 
                          scales: { x: { display: false }, y: { display: false } },
                          plugins: { legend: { display: false } }
                        }} 
                      />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Model Score Probability Distributions
                    </div>
                  </div>
                </div>
              )}
              
              {/* Transactions stream in dashboard */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">Audited Transactions Ticker</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Transaction ID</th>
                        <th style={{ padding: '12px' }}>Timestamp</th>
                        <th style={{ padding: '12px' }}>User ID</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Location</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Risk Score</th>
                        <th style={{ padding: '12px' }}>Reason for Decision</th>
                        <th style={{ padding: '12px' }}>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 15).map((t, idx) => {
                        let badgeClass = "tx-score-tag low";
                        if (t.fraud_score >= 0.85) badgeClass = "tx-score-tag high";
                        else if (t.fraud_score >= 0.4) badgeClass = "tx-score-tag medium";
                        
                        let reasons = [];
                        if (t.explanation) {
                          try {
                            reasons = typeof t.explanation === 'string' ? JSON.parse(t.explanation) : t.explanation;
                          } catch (e) {
                            reasons = [t.explanation];
                          }
                        }
                        const reasonText = reasons.join(', ') || 'N/A';
                        
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{new Date(t.timestamp * 1000).toLocaleTimeString()}</td>
                            <td style={{ padding: '12px' }}>{t.user_id}</td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{t.location}</td>
                            <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={badgeClass}>{(t.fraud_score * 100).toFixed(0)}%</span>
                            </td>
                            <td 
                              style={{ 
                                padding: '12px', 
                                maxWidth: '280px', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                color: 'var(--text-secondary)'
                              }}
                              title={reasonText}
                            >
                              {reasonText}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: '600', color: t.status === 'Approved' ? 'var(--color-safe)' : t.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                                  {t.status}
                                </span>
                                {t.status === 'Approved' && (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ 
                                      padding: '2px 8px', 
                                      fontSize: '0.75rem', 
                                      height: '24px', 
                                      width: 'auto',
                                      background: 'rgba(255, 51, 102, 0.1)',
                                      border: '1px solid rgba(255, 51, 102, 0.3)',
                                      color: 'var(--color-danger)',
                                      boxShadow: 'none'
                                    }}
                                    onClick={() => handleReportScam(t.transaction_id)}
                                  >
                                    ⚠️ Report Scam
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="investigator-layout">
              {/* User List Pane */}
              <div className="glass-panel queue-pane" style={{ flex: '1.2' }}>
                <div className="pane-header">
                  <span className="pane-title">Platform Access & User Directory</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {usersList.length} Accounts
                  </span>
                </div>
                
                <div className="pane-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                  {usersList.map((u, idx) => (
                    <div key={idx} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="user-avatar" style={{ margin: 0, width: '40px', height: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-glow)', borderRadius: '50%', fontWeight: '700' }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{u.full_name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.username}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{
                          background: u.role === 'Admin' ? 'var(--color-purple)' : u.role === 'SysAdmin' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>{u.role}</span>
                        
                        {u.username !== user.username && (
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              padding: '4px',
                              transition: 'transform 0.1s'
                            }}
                            title="Revoke User Access"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add User Form Pane */}
              <div className="glass-panel xai-pane" style={{ flex: '0.8' }}>
                <div className="pane-header">
                  <span className="pane-title">Provision New Access</span>
                </div>
                
                <form onSubmit={handleAddUser} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {addUserError && <div className="auth-error-msg">⚠️ {addUserError}</div>}
                  {addUserSuccess && <div className="auth-success-msg">✓ {addUserSuccess}</div>}

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addUserFullName}
                      onChange={e => setAddUserFullName(e.target.value)}
                      placeholder="e.g. Fraud Investigator Officer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (Username)</label>
                    <input
                      type="email"
                      className="form-input"
                      value={addUserEmail}
                      onChange={e => setAddUserEmail(e.target.value)}
                      placeholder="user@omnitrace.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={addUserPassword}
                      onChange={e => setAddUserPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Access Level Role</label>
                    <select
                      className="form-input form-select"
                      value={addUserRole}
                      onChange={e => setAddUserRole(e.target.value)}
                      required
                    >
                      <option value="Investigator">Fraud Investigator</option>
                      <option value="Admin">Bank Admin</option>
                      <option value="SysAdmin">System Administrator</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                    Register User Account
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: FRAUD ANALYTICS */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="charts-row" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
                <div className="glass-panel chart-card" style={{ height: '380px' }}>
                  <div className="chart-title">Real-Time Risk & Ingestion Profile</div>
                  <div style={{ position: 'relative', height: '300px' }}>
                    <Line data={trendChartData} options={trendChartOptions} />
                  </div>
                </div>

                <div className="glass-panel chart-card" style={{ height: '380px' }}>
                  <div className="chart-title">Merchant Category Risk Distribution</div>
                  <div style={{ position: 'relative', height: '300px' }}>
                    <Bar 
                      data={buildCategoryRiskData(transactions)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' }, min: 0, max: 100 }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">Ingested Transactions Stream (Recent History)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Transaction ID</th>
                        <th style={{ padding: '12px' }}>User ID</th>
                        <th style={{ padding: '12px' }}>Merchant</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Risk Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.transaction_id}</td>
                          <td style={{ padding: '12px' }}>{t.user_id}</td>
                          <td style={{ padding: '12px' }}>{t.merchant_name}</td>
                          <td style={{ padding: '12px' }}>{t.merchant_category}</td>
                          <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                          <td style={{ padding: '12px' }}>
                            <span className={`tx-score-tag ${t.fraud_score >= 0.85 ? 'high' : t.fraud_score >= 0.4 ? 'medium' : 'low'}`}>
                              {(t.fraud_score * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: THRESHOLD CONFIG */}
          {activeTab === 'thresholds' && (
            <div className="sys-dashboard">
              <div className="config-layout" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                {/* Sliders */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="chart-title">Interactive Risk Boundary Tuning</div>
                  
                  <div className="slider-group" style={{ marginBottom: '24px' }}>
                    <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="slider-title" style={{ fontWeight: '600' }}>Alert Threshold (Pending Queue)</span>
                      <span className="slider-val" style={{ color: 'var(--color-warning)', fontWeight: '700' }}>{(thresholds.fraud_threshold * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0.30"
                      max="0.85"
                      step="0.05"
                      className="custom-range-slider"
                      style={{ width: '100%' }}
                      value={thresholds.fraud_threshold}
                      onChange={e => handleUpdateThresholds(parseFloat(e.target.value), thresholds.auto_decline_threshold)}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Transactions scoring above this boundary generate alerts and are pushed to the investigator queue.
                    </p>
                  </div>
                  
                  <div className="slider-group">
                    <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="slider-title" style={{ fontWeight: '600' }}>Auto-Decline Threshold (Hard Block)</span>
                      <span className="slider-val" style={{ color: 'var(--color-danger)', fontWeight: '700' }}>{(thresholds.auto_decline_threshold * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0.75"
                      max="0.95"
                      step="0.05"
                      className="custom-range-slider"
                      style={{ width: '100%' }}
                      value={thresholds.auto_decline_threshold}
                      onChange={e => handleUpdateThresholds(thresholds.fraud_threshold, parseFloat(e.target.value))}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Transactions scoring above this boundary are hard-declined at POS without human intervention.
                    </p>
                  </div>
                </div>

                {/* Tradeoff Curve Plot */}
                <div className="glass-panel chart-card" style={{ padding: '24px' }}>
                  <div className="chart-title">Real-Time ROC Trade-Off Curve</div>
                  <div style={{ position: 'relative', height: '220px' }}>
                    <Line 
                      data={tradeoffChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: '#F3F4F6' } }
                        },
                        scales: {
                          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Security Audit Trail */}
              <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
                <div className="chart-title">Compliance Governance & Security Audit Trail</div>
                <div style={{ overflowX: 'auto', maxHeight: '250px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px' }}>Timestamp</th>
                        <th style={{ padding: '10px' }}>User</th>
                        <th style={{ padding: '10px' }}>Action</th>
                        <th style={{ padding: '10px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ padding: '10px', fontWeight: '600' }}>{log.username}</td>
                          <td style={{ padding: '10px', color: 'var(--color-purple)' }}>{log.action}</td>
                          <td style={{ padding: '10px' }}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXPLAINABILITY REPORTS */}
          {activeTab === 'explainability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">Explainable AI Audit Engine</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Enter any unique Transaction ID (e.g. <code>TX100423</code>) to retrieve mathematical feature attributions, model subscores, local SHAP waterfalls, and graph cycle analysis.
                </p>
                
                <form onSubmit={handleExplainSearch} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
                  <input 
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    placeholder="TX100423"
                    value={explainSearchId}
                    onChange={e => setExplainSearchId(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-primary" style={{ flexGrow: 0, width: '160px' }} disabled={explainLoading}>
                    {explainLoading ? 'Analyzing...' : 'Run Explainer'}
                  </button>
                </form>
              </div>

              {explainError && (
                <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-danger)', background: 'var(--color-danger-glow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)', fontWeight: '700' }}>
                    <span>⚠️ Query Failure</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>{explainError}</p>
                </div>
              )}

              {explainTx && (
                <div className="investigator-layout" style={{ marginTop: 0, height: 'auto', overflow: 'visible' }}>
                  {/* Left details panel */}
                  <div className="glass-panel queue-pane" style={{ flex: '0.9', padding: '24px' }}>
                    <div className="pane-header" style={{ marginBottom: '20px' }}>
                      <span className="pane-title">Transaction Information</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>ID</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{explainTx.transaction_id}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>User Account</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{explainTx.user_id}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Merchant</span>
                        <span>{explainTx.merchant_name} ({explainTx.merchant_category})</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                        <span style={{ fontWeight: '700' }}>₹{explainTx.amount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Location</span>
                        <span>{explainTx.location}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Device & IP</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{explainTx.device_id}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Transaction Type</span>
                        <span>{explainTx.transaction_type}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Timestamp</span>
                        <span>{new Date(explainTx.timestamp * 1000).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>System Outcome</span>
                        <span style={{ 
                          color: explainTx.status === 'Approved' ? 'var(--color-safe)' : explainTx.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)',
                          fontWeight: '700'
                        }}>{explainTx.status}</span>
                      </div>
                    </div>
                    
                    {/* Subscores breakdown */}
                    <div style={{ marginTop: '24px' }}>
                      <div className="xai-section-title" style={{ marginTop: 0 }}>Model Score Breakdown</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(explainTx.model_scores).map(([mName, val]) => (
                          <div key={mName} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{mName.toUpperCase()}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: val >= 0.7 ? 'var(--color-danger)' : val >= 0.4 ? 'var(--color-warning)' : 'var(--color-safe)' }}>{(val * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right XAI visualizations panel */}
                  <div className="glass-panel xai-pane" style={{ flex: '1.1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="pane-header">
                      <span className="pane-title">Neural Logic & Feature Impact</span>
                    </div>
                    <div className="xai-details-wrapper">
                      {/* Risk radial */}
                      <div className="risk-summary-box">
                        <div className={`risk-radial-gauge ${explainTx.fraud_score >= 0.85 ? 'high' : 'medium'}`}>
                          {(explainTx.fraud_score * 100).toFixed(0)}%
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>
                            Consolidated Fraud Score: {(explainTx.fraud_score * 100).toFixed(1)}%
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Mathematical combination of graph cycle search, LSTM sequence, Autoencoder reconstruction, and tabular feedforward neural nets.
                          </p>
                        </div>
                      </div>

                      {/* SHAP Chart */}
                      <div>
                        <div className="xai-section-title">SHAP Feature Influence</div>
                        <div style={{ height: '180px', position: 'relative' }}>
                          <Bar 
                            data={buildShapChartData(explainTx.shapley)}
                            options={{
                              indexAxis: 'y',
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                                y: { ticks: { color: '#F3F4F6', font: { family: 'Fira Code', size: 9 } } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Graph cycle loops */}
                      {explainTx.cycles_detected?.length > 0 && (
                        <div style={{ padding: '12px', border: '1px solid var(--color-danger)', borderRadius: '6px', background: 'var(--color-danger-glow)' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginBottom: '4px' }}>
                            🕸️ Graph Fraud Ring Cycles Detected
                          </h4>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {explainTx.cycles_detected.map((cycle, c_idx) => (
                              <div key={c_idx}>↳ {cycle.join(' ➔ ')}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cognitive indicators */}
                      <div>
                        <div className="xai-section-title">Explainability Narrative</div>
                        <ul className="bullet-insights">
                          {explainTx.shapley.explanations.map((exp, exp_idx) => (
                            <li key={exp_idx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* User Transaction History Panel */}
                  <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '24px', marginTop: '12px' }}>
                    <div className="chart-title">User Transaction History Ledger ({explainTx.user_id})</div>
                    {explainTxHistoryLoading ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        Loading transaction history...
                      </div>
                    ) : explainTxHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No historical transactions found for this user.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                              <th style={{ padding: '12px' }}>Transaction ID</th>
                              <th style={{ padding: '12px' }}>Timestamp</th>
                              <th style={{ padding: '12px' }}>Merchant</th>
                              <th style={{ padding: '12px' }}>Category</th>
                              <th style={{ padding: '12px' }}>Amount</th>
                              <th style={{ padding: '12px' }}>Type</th>
                              <th style={{ padding: '12px' }}>Risk Score</th>
                              <th style={{ padding: '12px' }}>Reason for Decision</th>
                              <th style={{ padding: '12px' }}>Outcome</th>
                            </tr>
                          </thead>
                          <tbody>
                            {explainTxHistory.map((t, idx) => {
                              let reasons = [];
                              if (t.explanation) {
                                try {
                                  reasons = typeof t.explanation === 'string' ? JSON.parse(t.explanation) : t.explanation;
                                } catch (e) {
                                  reasons = [t.explanation];
                                }
                              }
                              const reasonText = reasons.join(', ') || 'N/A';

                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: t.transaction_id === explainTx.transaction_id ? 'rgba(255,255,0,0.05)' : 'transparent' }}>
                                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>
                                    {t.transaction_id} {t.transaction_id === explainTx.transaction_id && <span style={{ color: 'var(--color-warning)', fontSize: '0.75rem' }}>(Current)</span>}
                                  </td>
                                  <td style={{ padding: '12px' }}>{new Date(t.timestamp * 1000).toLocaleString()}</td>
                                  <td style={{ padding: '12px' }}>{t.merchant_name}</td>
                                  <td style={{ padding: '12px' }}>{t.merchant_category}</td>
                                  <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                                  <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                                  <td style={{ padding: '12px' }}>
                                    <span className={`tx-score-tag ${t.fraud_score >= 0.85 ? 'high' : t.fraud_score >= 0.4 ? 'medium' : 'low'}`}>
                                      {(t.fraud_score * 100).toFixed(0)}%
                                    </span>
                                  </td>
                                  <td 
                                    style={{ 
                                      padding: '12px', 
                                      maxWidth: '280px', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      color: 'var(--text-secondary)'
                                    }}
                                    title={reasonText}
                                  >
                                    {reasonText}
                                  </td>
                                  <td style={{ padding: '12px', fontWeight: '600', color: t.status === 'Approved' ? 'var(--color-safe)' : t.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                                    {t.status}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: RISK ANALYTICS */}
          {activeTab === 'risk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>DATA DRIFT INDEX</span>
                    <span style={{ color: 'var(--color-primary)' }}>📊</span>
                  </div>
                  <div className="kpi-value">{stats?.drift?.data_drift || 0.08}</div>
                  <div className="kpi-footer">Feature distribution shift relative to training baseline</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>CONCEPT DRIFT INDEX</span>
                    <span style={{ color: 'var(--color-purple)' }}>🧬</span>
                  </div>
                  <div className="kpi-value">{stats?.drift?.concept_drift || 0.05}</div>
                  <div className="kpi-footer">Scoring probability shift over time</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>ACCURACY RATING</span>
                    <span style={{ color: 'var(--color-safe)' }}>🎯</span>
                  </div>
                  <div className="kpi-value">{stats?.drift?.model_accuracy || 98.42}%</div>
                  <div className="kpi-footer">Simulated model validation rating</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>DRIFT STATUS</span>
                    <span>🛡️</span>
                  </div>
                  <div className="kpi-value" style={{ color: stats?.drift?.drift_status === 'Normal' ? 'var(--color-safe)' : 'var(--color-warning)' }}>
                    {stats?.drift?.drift_status || 'NORMAL'}
                  </div>
                  <div className="kpi-footer">Real-time anomaly assessment status</div>
                </div>
              </div>

              <div className="glass-panel chart-card" style={{ padding: '24px' }}>
                <div className="chart-title" style={{ marginBottom: '16px' }}>Model Score Probability Distributions</div>
                <div style={{ position: 'relative', height: '320px' }}>
                  <Line 
                    data={distributionChartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      scales: { 
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }, 
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } } 
                      },
                      plugins: { 
                        legend: { 
                          display: true,
                          labels: { color: '#F3F4F6', font: { family: 'Inter' } } 
                        } 
                      }
                    }} 
                  />
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px' }}>
                  Visual representation of probability overlaps for normal (green) and high-risk (red) model outputs.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATION QUEUE */}
          {activeTab === 'queue' && (
            <div className="investigator-layout">
              {/* Queue List Pane */}
              <div className="glass-panel queue-pane">
                <div className="pane-header">
                  <span className="pane-title">Pending Flagged Reviews</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {queue.length} Active alerts
                  </span>
                </div>
                
                <div className="pane-list">
                  {queue.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      ✅ No pending alerts. System clear.
                    </div>
                  ) : (
                    queue.map((t, idx) => {
                      const isHigh = t.fraud_score >= 0.85;
                      return (
                        <div 
                          key={idx}
                          className={`tx-card ${isHigh ? 'high-risk' : 'medium-risk'} ${selectedTx?.transaction_id === t.transaction_id ? 'active' : ''}`}
                          onClick={() => handleSelectTx(t.transaction_id)}
                        >
                          <div className="tx-details">
                            <span className="tx-id">{t.transaction_id} — {t.user_id}</span>
                            <span className="tx-amount">₹{t.amount.toLocaleString()}</span>
                            <span className="tx-meta">
                              <span>📍 {t.location}</span>
                              <span>Category: {t.merchant_category}</span>
                            </span>
                          </div>
                          <div>
                            <span className={`tx-score-tag ${isHigh ? 'high' : 'medium'}`}>
                              {(t.fraud_score * 100).toFixed(0)}% Score
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Explainable AI Details Pane */}
              <div className="glass-panel xai-pane">
                {selectedTx ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="pane-header">
                      <span className="pane-title">Explainable AI Insights</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{selectedTx.transaction_id}</span>
                    </div>
                    
                    <div className="xai-details-wrapper">
                      {/* Risk gauge and subscores */}
                      <div className="risk-summary-box">
                        <div className={`risk-radial-gauge ${selectedTx.fraud_score >= 0.85 ? 'high' : 'medium'}`}>
                          {(selectedTx.fraud_score * 100).toFixed(0)}%
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>
                            Risk Level: {selectedTx.fraud_score >= 0.85 ? 'Critical High' : 'Medium Suspicious'}
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Ensemble prediction of 5 neural network layers.
                          </p>
                        </div>
                      </div>
                      
                      {/* Models radar metrics */}
                      <div>
                        <div className="xai-section-title">Ensemble Layer Analysis</div>
                        <div className="neural-attribution-grid">
                          <div className="neural-model-pill">
                            <div className="neural-model-name">DNN</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-primary)' }}>
                              {(selectedTx.model_scores.dnn * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">LSTM</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-purple)' }}>
                              {(selectedTx.model_scores.lstm * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">AE (Recon)</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-warning)' }}>
                              {(selectedTx.model_scores.autoencoder * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">GNN</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-danger)' }}>
                              {(selectedTx.model_scores.gnn * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">TRANS</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-safe)' }}>
                              {(selectedTx.model_scores.transformer * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* SHAP graph */}
                      <div>
                        <div className="xai-section-title">Local SHAP Feature Contributions</div>
                        <div style={{ height: '180px', position: 'relative' }}>
                          <Bar 
                            data={buildShapChartData(selectedTx.shapley)}
                            options={{
                              indexAxis: 'y',
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                                y: { ticks: { color: '#F3F4F6', font: { family: 'Fira Code', size: 9 } } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* GNN fraud loops */}
                      {selectedTx.cycles_detected?.length > 0 && (
                        <div style={{ padding: '12px', border: '1px solid var(--color-danger)', borderRadius: '6px', background: 'var(--color-danger-glow)' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginBottom: '4px' }}>
                            🕸️ Graph Fraud Ring Cycles Detected
                          </h4>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {selectedTx.cycles_detected.map((cycle, c_idx) => (
                              <div key={c_idx}>↳ {cycle.join(' ➔ ')}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attention visualizer (LSTM sequence) */}
                      {selectedTx.sequence_history?.length > 0 && (
                        <div>
                          <div className="xai-section-title">Sequential Context Attention Weights</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedTx.sequence_history.map((h_tx, h_idx) => {
                              // Compute mean attention score for this step in sequence
                              const attnWeight = selectedTx.attention_weights && selectedTx.attention_weights[selectedTx.attention_weights.length - 1]
                                ? selectedTx.attention_weights[selectedTx.attention_weights.length - 1][h_idx]
                                : 0.2;
                                
                              return (
                                <div key={h_idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--color-purple)' }}>
                                  <span style={{ fontSize: '0.8rem' }}>
                                    ₹{h_tx.amount.toLocaleString()} ({h_tx.merchant_category})
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                                    <div style={{ flexGrow: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${attnWeight * 100}%`, background: 'var(--color-purple)' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                      {(attnWeight * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '4px', background: 'var(--color-primary-glow)', borderLeft: '3px solid var(--color-primary)' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                                Target: ₹{selectedTx.amount.toLocaleString()} (Current)
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#FFFFFF', fontWeight: '700' }}>Active Step</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Explanations text justifications */}
                      <div>
                        <div className="xai-section-title">Cognitive Fraud Indicators</div>
                        <ul className="bullet-insights">
                          {selectedTx.shapley.explanations.map((exp, exp_idx) => (
                            <li key={exp_idx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Resolution action button row */}
                    <div className="action-buttons-row">
                      <button 
                        className="btn-action approve"
                        onClick={() => {
                          setFeedbackAction('Dismiss Alert');
                          setShowFeedbackModal(true);
                        }}
                      >
                        Dismiss (Legitimate)
                      </button>
                      <button 
                        className="btn-action decline"
                        onClick={() => {
                          setFeedbackAction('Confirm Fraud');
                          setShowFeedbackModal(true);
                        }}
                      >
                        Block & Confirm Fraud
                      </button>
                      <button 
                        className="btn-action escalate"
                        onClick={() => {
                          setFeedbackAction('Escalate');
                          setShowFeedbackModal(true);
                        }}
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="xai-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div>
                      <h3>Select a transaction from the queue</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Neural reasoning attributions and Shapley explanations will render here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MODEL CONFIG & GOVERNANCE */}
          {activeTab === 'models' && (
            <div className="sys-dashboard">
              <div className="config-layout" style={{ gridTemplateColumns: user.role === 'Admin' ? '1fr 1fr' : '1fr' }}>
                {/* Sliders */}
                {user.role === 'Admin' && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div className="chart-title">Interactive Risk Boundary Tuning</div>
                    
                    <div className="slider-group">
                      <div className="slider-header">
                        <span className="slider-title">Alert Threshold (Pending Investigation Queue)</span>
                        <span className="slider-val">{(thresholds.fraud_threshold * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0.30"
                        max="0.85"
                        step="0.05"
                        className="custom-range-slider"
                        value={thresholds.fraud_threshold}
                        onChange={e => handleUpdateThresholds(parseFloat(e.target.value), thresholds.auto_decline_threshold)}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Transactions scoring above this boundary generate alerts and are pushed to the investigator queue.
                      </p>
                    </div>
                    
                    <div className="slider-group">
                      <div className="slider-header">
                        <span className="slider-title">Auto-Decline Threshold (Hard Block Boundary)</span>
                        <span className="slider-val">{(thresholds.auto_decline_threshold * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0.75"
                        max="0.95"
                        step="0.05"
                        className="custom-range-slider"
                        value={thresholds.auto_decline_threshold}
                        onChange={e => handleUpdateThresholds(thresholds.fraud_threshold, parseFloat(e.target.value))}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Transactions scoring above this boundary are hard-declined at POS without human intervention.
                      </p>
                    </div>
                    
                    {/* Tradeoff Curve Plot */}
                    <div style={{ height: '220px', position: 'relative', marginTop: '24px' }}>
                      <Line 
                        data={tradeoffChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { labels: { color: '#F3F4F6' } }
                          },
                          scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Model Governance metadata */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="chart-title">Model Specifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Deep Neural Network (DNN)</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Input dimension: 7 Features. Hidden layers: Dense(16, ReLU) ➔ Dense(8, ReLU) ➔ Dense(1, Sigmoid).
                      </p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-purple)' }}>Long Short-Term Memory (LSTM)</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Sequence depth: 5 steps. Size: Input(5) ➔ LSTMCell(8 hidden units) ➔ Dense(1, Sigmoid).
                      </p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-warning)' }}>Autoencoder Anomaly Detector</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Unsupervised layers: Dense(5) ➔ Compression(2, Bottleneck) ➔ Dense(5, Reconstruction).
                      </p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-danger)' }}>Graph Neural Network (GNN)</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Peer graph analysis: networkx cycle extraction, pagerank clusters, bipartite connections.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Audit Trail */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">Compliance Governance & Security Audit Trail</div>
                <div style={{ overflowX: 'auto', maxH: '250px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px' }}>Timestamp</th>
                        <th style={{ padding: '10px' }}>User</th>
                        <th style={{ padding: '10px' }}>Action</th>
                        <th style={{ padding: '10px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ padding: '10px', fontWeight: '600' }}>{log.username}</td>
                          <td style={{ padding: '10px', color: 'var(--color-purple)' }}>{log.action}</td>
                          <td style={{ padding: '10px' }}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LIVE TRANSACTION STREAM */}
          {activeTab === 'live_stream' && (() => {
            const totalRisk = transactions.reduce((acc, t) => acc + t.fraud_score, 0);
            const avgRisk = transactions.length > 0 ? (totalRisk / transactions.length) * 100 : 0;
            const anomalies = transactions.filter(t => t.fraud_score >= (thresholds.fraud_threshold || 0.70)).length;
            const anomalyRatio = transactions.length > 0 ? (anomalies / transactions.length) * 100 : 0;
            const streamRate = isSimulating ? (0.20 + Math.sin(Date.now() / 50000) * 0.03).toFixed(2) : '0.00';
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Live stream stats cards */}
                <div className="kpi-grid">
                  <div className="glass-panel kpi-card">
                    <div className="kpi-header">
                      <span>STREAM RATE</span>
                      <span className="kpi-icon">⚡</span>
                    </div>
                    <div className="kpi-value">{streamRate} tps</div>
                    <div className="kpi-footer">Evaluations per second</div>
                  </div>

                  <div className="glass-panel kpi-card">
                    <div className="kpi-header">
                      <span>AVERAGE RISK</span>
                      <span className="kpi-icon" style={{ color: 'var(--color-warning)' }}>🛡️</span>
                    </div>
                    <div className="kpi-value">{avgRisk.toFixed(1)}%</div>
                    <div className="kpi-footer">Mean ensemble confidence score</div>
                  </div>

                  <div className="glass-panel kpi-card">
                    <div className="kpi-header">
                      <span>ANOMALY RATIO</span>
                      <span className="kpi-icon" style={{ color: 'var(--color-danger)' }}>🚨</span>
                    </div>
                    <div className="kpi-value">{anomalyRatio.toFixed(1)}%</div>
                    <div className="kpi-footer">Alert-level transaction fraction</div>
                  </div>
                </div>

                {/* Ingestion simulator toggle control panel */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>Ingestion Stream Influx Controller</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Toggle neural scoring pipeline simulation. Stream will generate fake transaction payloads every 5 seconds.
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    style={{
                      background: isSimulating ? 'var(--color-danger)' : 'var(--color-primary)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      transition: 'all var(--transition-fast)',
                      boxShadow: isSimulating ? '0 4px 16px rgba(255, 51, 102, 0.2)' : '0 4px 16px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    {isSimulating ? 'Pause Stream Ingestion' : 'Resume Stream Ingestion'}
                  </button>
                </div>

                {/* Scrolling list table */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="chart-title" style={{ marginBottom: '16px' }}>Live Decrypted Transactions Ticker</div>
                  <div style={{ overflowX: 'auto', maxHeight: '450px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px' }}>Transaction ID</th>
                          <th style={{ padding: '12px' }}>Timestamp</th>
                          <th style={{ padding: '12px' }}>User ID</th>
                          <th style={{ padding: '12px' }}>Merchant / Category</th>
                          <th style={{ padding: '12px' }}>Amount</th>
                          <th style={{ padding: '12px' }}>Type</th>
                          <th style={{ padding: '12px' }}>Risk Tag</th>
                          <th style={{ padding: '12px' }}>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{new Date(t.timestamp * 1000).toLocaleTimeString()}</td>
                            <td style={{ padding: '12px' }}>{t.user_id}</td>
                            <td style={{ padding: '12px' }}>{t.merchant_name} ({t.merchant_category})</td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                            <td style={{ padding: '12px' }}>
                              {getPulsingRiskTag(t.fraud_score)}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              fontWeight: '600', 
                              color: t.status === 'Approved' ? 'var(--color-safe)' : t.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)' 
                            }}>
                              {t.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* INVESTIGATOR DASHBOARDS */}
          {activeTab === 'fraud_investigation_dashboard' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Investigator Session & Duty Bar */}
              <div className="glass-panel" style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: '4px solid var(--color-purple)',
                background: 'rgba(139, 92, 246, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--color-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.35)'
                  }}>
                    🕵️
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {user.fullName || 'Fraud Analyst Specialist'}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: 'var(--color-safe)',
                        background: 'var(--color-safe-glow)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        ON DUTY
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Authenticated Account: <code style={{ color: 'var(--color-purple)' }}>{user.username}</code> • Role: <b>{user.role}</b>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={fetchData}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--text-primary)',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🔄</span>
                    <span>Sync Alerts</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(255, 51, 102, 0.15)',
                      border: '1px solid rgba(255, 51, 102, 0.4)',
                      color: 'var(--color-danger)',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 10px rgba(255, 51, 102, 0.2)'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'var(--color-danger)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'rgba(255, 51, 102, 0.15)';
                      e.currentTarget.style.color = 'var(--color-danger)';
                    }}
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>QUEUE SIZE</span>
                    <span className="kpi-icon">🚨</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{queue.length}</div>
                  <div className="kpi-footer">Alerts waiting for review</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>RESOLVED ALERTS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-safe)' }}>✓ 42</span>
                  </div>
                  <div className="kpi-value">87.5%</div>
                  <div className="kpi-footer">Average resolution rate (today)</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>AVG RESOLUTION SLA</span>
                    <span className="kpi-icon">⏱️</span>
                  </div>
                  <div className="kpi-value">4.8 min</div>
                  <div className="kpi-footer">Alert scoring to action time</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>THREAT STATUS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-warning)' }}>⚠️</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>ELEVATED</div>
                  <div className="kpi-footer">Ingestion velocity warning limit</div>
                </div>
              </div>

              <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="chart-title">Active Threat Investigators</div>
                  <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px' }}>Investigator</th>
                          <th style={{ padding: '12px' }}>Status</th>
                          <th style={{ padding: '12px' }}>Assigned Alerts</th>
                          <th style={{ padding: '12px' }}>Avg SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Officer Rajesh Kumar', status: 'On Duty', assigned: 3, sla: '3.8m' },
                          { name: 'Officer Priya Sharma', status: 'On Duty', assigned: 2, sla: '5.2m' },
                          { name: 'Officer Vikram Singh', status: 'Incidents Duty', assigned: 5, sla: '4.5m' }
                        ].map((inv, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{inv.name}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                color: 'var(--color-safe)',
                                background: 'var(--color-safe-glow)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                ● {inv.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>{inv.assigned} active</td>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{inv.sla}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                </div>

              {/* Held Transaction Queue Section */}
              <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div className="chart-title">⏳ Held Transaction Queue (Adaptive Verification Console)</div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255, 171, 0, 0.15)', color: 'var(--color-warning)', padding: '4px 10px', borderRadius: '4px', fontWeight: '700' }}>20-MIN QUARANTINE</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Transaction ID</th>
                        <th style={{ padding: '12px' }}>Fraud Score</th>
                        <th style={{ padding: '12px' }}>Hold Timer</th>
                        <th style={{ padding: '12px' }}>Verification Method</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.status === 'Hold' && t.verification_status === 'Pending').map((t) => {
                        const secondsLeft = Math.max(0, t.hold_expires - nowTime);
                        const mins = Math.floor(secondsLeft / 60);
                        const secs = Math.floor(secondsLeft % 60);
                        const timerText = secondsLeft > 0 ? `${mins}m ${secs}s left` : "Expired";
                        const isExpired = secondsLeft <= 0;

                        return (
                          <tr key={t.transaction_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{t.transaction_id}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={`tx-score-tag ${t.fraud_score >= 0.85 ? 'high' : t.fraud_score >= 0.4 ? 'medium' : 'low'}`}>
                                {(t.fraud_score * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: isExpired ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: '600' }}>
                              ⏱️ {timerText}
                            </td>
                            <td style={{ padding: '12px' }}>{t.verification_method}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>Awaiting Verification</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedHeldTx(t)}
                                style={{
                                  background: 'var(--color-primary)',
                                  border: 'none',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                🔍 Verify Identity
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {transactions.filter(t => t.status === 'Hold' && t.verification_status === 'Pending').length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No transactions currently on hold in this cycle.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verification Review Panel Modal */}
              {selectedHeldTx && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }} onClick={(e) => { if (e.target.style.position === 'fixed') setSelectedHeldTx(null); }}>
                  <div className="glass-panel" style={{
                    width: '100%',
                    maxWidth: '520px',
                    padding: '24px',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '12px',
                    background: 'rgba(20, 24, 33, 0.95)',
                    boxShadow: '0 0 30px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                        Verification Review Panel — {selectedHeldTx.transaction_id}
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setSelectedHeldTx(null)}
                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                      <span>User: <b>{selectedHeldTx.user_id}</b></span>
                      <span>Amount: <b>₹{selectedHeldTx.amount.toLocaleString()}</b></span>
                      <span>Method: <b>{selectedHeldTx.verification_method}</b></span>
                    </div>

                    {/* METHOD 1: Face Recognition Result Viewer */}
                    {selectedHeldTx.verification_method === 'Face ID' && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                          👤 Face Recognition Service Monitor
                        </div>
                        <div style={{ 
                          height: '180px', 
                          background: '#070a0e', 
                          border: '1px solid var(--panel-border)', 
                          borderRadius: '6px', 
                          position: 'relative', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {/* Mock Camera Scan Overlay */}
                          <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '2px dashed var(--color-primary)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {/* Face representation */}
                            <span style={{ fontSize: '3rem' }}>👤</span>
                            {/* Scanning line animation */}
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '2px',
                              background: 'var(--color-primary)',
                              boxShadow: '0 0 8px var(--color-primary)',
                              animation: 'scan-line 2s linear infinite'
                            }} />
                            <style>{`
                              @keyframes scan-line {
                                0% { top: 0%; }
                                50% { top: 100%; }
                                100% { top: 0%; }
                              }
                            `}</style>
                          </div>
                        </div>

                        {/* Progress Bar confidence */}
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                            <span>Face ID Match Confidence:</span>
                            <span style={{ fontWeight: '700', color: faceConfidence >= 85 ? 'var(--color-safe)' : 'var(--color-primary)' }}>
                              {faceConfidence.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${faceConfidence}%`, height: '100%', background: faceConfidence >= 85 ? 'var(--color-safe)' : 'var(--color-primary)', transition: 'width 0.15s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                            {faceConfidence < 94 ? "Scanning face structures..." : "✓ Match Confirmed (94.2%) — Identity Verified"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* METHOD 2: OTP Validation Status */}
                    {selectedHeldTx.verification_method === 'OTP' && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                          💬 OTP Gateway Delivery Monitor
                        </div>
                        <div style={{
                          maxHeight: '140px',
                          background: '#070a0e',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          padding: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: '#aaa',
                          overflowY: 'auto',
                          marginBottom: '16px'
                        }}>
                          {otpLog.map((log, idx) => (
                            <div key={idx} style={{ marginBottom: '4px', color: idx === otpLog.length - 1 ? 'var(--color-warning)' : '#888' }}>
                              {log}
                            </div>
                          ))}
                        </div>
                        
                        {/* Simulated input pins */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          {['4', '2', '8', '9'].map((digit, idx) => (
                            <div key={idx} style={{
                              width: '40px',
                              height: '40px',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--panel-border)',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              color: 'var(--color-primary)'
                            }}>
                              {digit}
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-safe)', marginTop: '8px', textAlign: 'center', fontWeight: '600' }}>
                          ✓ OTP matches SMS gateway verification token.
                        </div>
                      </div>
                    )}

                    {/* Review Actions */}
                    <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleVerifyTransaction(selectedHeldTx.transaction_id, 'Verified', selectedHeldTx.verification_method, selectedHeldTx.verification_method === 'Face ID' ? 0.942 : 0.99)}
                          style={{
                            flex: 1,
                            background: 'var(--color-safe)',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '700'
                          }}
                        >
                          Simulate Success Verification (Release)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyTransaction(selectedHeldTx.transaction_id, 'Unverified', selectedHeldTx.verification_method, selectedHeldTx.verification_method === 'Face ID' ? 0.42 : 0.0)}
                          style={{
                            flex: 1,
                            background: 'var(--color-danger)',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '700'
                          }}
                        >
                          Simulate Failure Verification (Block)
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleVerifyTransaction(selectedHeldTx.transaction_id, 'Verified', 'Analyst Manual Bypass', 1.0)}
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--panel-border)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Manual Approve Override
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyTransaction(selectedHeldTx.transaction_id, 'Unverified', 'Analyst Manual Block', 0.0)}
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--panel-border)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Manual Reject Override
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'live_transaction_monitoring' && (() => {
            const totalRisk = transactions.reduce((acc, t) => acc + t.fraud_score, 0);
            const avgRisk = transactions.length > 0 ? (totalRisk / transactions.length) * 100 : 0;
            const anomalies = transactions.filter(t => t.fraud_score >= (thresholds.fraud_threshold || 0.70)).length;
            const anomalyRatio = transactions.length > 0 ? (anomalies / transactions.length) * 100 : 0;
            const streamRate = isSimulating ? (0.20 + Math.sin(Date.now() / 50000) * 0.03).toFixed(2) : '0.00';
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="kpi-grid">
                  <div className="glass-panel kpi-card">
                    <div className="kpi-header">
                      <span>STREAM RATE</span>
                      <span className="kpi-icon">⚡</span>
                    </div>
                    <div className="kpi-value">{streamRate} tps</div>
                    <div className="kpi-footer">Evaluations per second</div>
                  </div>

                  <div className="glass-panel kpi-card">
                    <div className="kpi-header">
                      <span>AVERAGE RISK</span>
                      <span className="kpi-icon" style={{ color: 'var(--color-warning)' }}>🛡️</span>
                    </div>
                    <div className="kpi-value">{avgRisk.toFixed(1)}%</div>
                    <div className="kpi-footer">Mean ensemble confidence score</div>
                  </div>

                  <div className="glass-panel kpi-card">
                    <div className="kpi-header">
                      <span>ANOMALY RATIO</span>
                      <span className="kpi-icon" style={{ color: 'var(--color-danger)' }}>🚨</span>
                    </div>
                    <div className="kpi-value">{anomalyRatio.toFixed(1)}%</div>
                    <div className="kpi-footer">Alert-level transaction fraction</div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>Ingestion Stream Influx Controller</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Toggle neural scoring pipeline simulation. Stream will generate fake transaction payloads every 5 seconds.
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    style={{
                      background: isSimulating ? 'var(--color-danger)' : 'var(--color-primary)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      transition: 'all var(--transition-fast)',
                      boxShadow: isSimulating ? '0 4px 16px rgba(255, 51, 102, 0.2)' : '0 4px 16px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    {isSimulating ? 'Pause Stream Ingestion' : 'Resume Stream Ingestion'}
                  </button>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="chart-title" style={{ marginBottom: '16px' }}>Live Decrypted Transactions Ticker</div>
                  <div style={{ overflowX: 'auto', maxHeight: '450px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px' }}>Transaction ID</th>
                          <th style={{ padding: '12px' }}>Timestamp</th>
                          <th style={{ padding: '12px' }}>User ID</th>
                          <th style={{ padding: '12px' }}>Merchant / Category</th>
                          <th style={{ padding: '12px' }}>Amount</th>
                          <th style={{ padding: '12px' }}>Type</th>
                          <th style={{ padding: '12px' }}>Risk Tag</th>
                          <th style={{ padding: '12px' }}>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{new Date(t.timestamp * 1000).toLocaleTimeString()}</td>
                            <td style={{ padding: '12px' }}>{t.user_id}</td>
                            <td style={{ padding: '12px' }}>{t.merchant_name} ({t.merchant_category})</td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                            <td style={{ padding: '12px' }}>
                              {getPulsingRiskTag(t.fraud_score)}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              fontWeight: '600', 
                              color: t.status === 'Approved' ? 'var(--color-safe)' : t.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)' 
                            }}>
                              {t.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'fraud_alert_queue' && (
            <div className="investigator-layout">
              <div className="glass-panel queue-pane">
                <div className="pane-header">
                  <span className="pane-title">Pending Flagged Reviews</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {queue.length} Active alerts
                  </span>
                </div>
                
                <div className="pane-list">
                  {queue.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      ✅ No pending alerts. System clear.
                    </div>
                  ) : (
                    queue.map((t, idx) => {
                      const isHigh = t.fraud_score >= 0.85;
                      return (
                        <div 
                          key={idx}
                          className={`tx-card ${isHigh ? 'high-risk' : 'medium-risk'} ${selectedTx?.transaction_id === t.transaction_id ? 'active' : ''}`}
                          onClick={() => handleSelectTx(t.transaction_id)}
                        >
                          <div className="tx-details">
                            <span className="tx-id">{t.transaction_id} — {t.user_id}</span>
                            <span className="tx-amount">₹{t.amount.toLocaleString()}</span>
                            <span className="tx-meta">
                              <span>📍 {t.location}</span>
                              <span>Category: {t.merchant_category}</span>
                            </span>
                          </div>
                          <div>
                            <span className={`tx-score-tag ${isHigh ? 'high' : 'medium'}`}>
                              {(t.fraud_score * 100).toFixed(0)}% Score
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="glass-panel xai-pane">
                {selectedTx ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="pane-header">
                      <span className="pane-title">Explainable AI Insights</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{selectedTx.transaction_id}</span>
                    </div>
                    
                    <div className="xai-details-wrapper">
                      <div className="risk-summary-box">
                        <div className={`risk-radial-gauge ${selectedTx.fraud_score >= 0.85 ? 'high' : 'medium'}`}>
                          {(selectedTx.fraud_score * 100).toFixed(0)}%
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>
                            Risk Level: {selectedTx.fraud_score >= 0.85 ? 'Critical High' : 'Medium Suspicious'}
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Ensemble prediction of 5 neural network layers.
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="xai-section-title">Ensemble Layer Analysis</div>
                        <div className="neural-attribution-grid">
                          <div className="neural-model-pill">
                            <div className="neural-model-name">DNN</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-primary)' }}>
                              {(selectedTx.model_scores.dnn * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">LSTM</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-purple)' }}>
                              {(selectedTx.model_scores.lstm * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">AE (Recon)</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-warning)' }}>
                              {(selectedTx.model_scores.autoencoder * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">GNN</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-danger)' }}>
                              {(selectedTx.model_scores.gnn * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="neural-model-pill">
                            <div className="neural-model-name">TRANS</div>
                            <div className="neural-model-val" style={{ color: 'var(--color-safe)' }}>
                              {(selectedTx.model_scores.transformer * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="xai-section-title">Local SHAP Feature Contributions</div>
                        <div style={{ height: '180px', position: 'relative' }}>
                          <Bar 
                            data={buildShapChartData(selectedTx.shapley)}
                            options={{
                              indexAxis: 'y',
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                                y: { ticks: { color: '#F3F4F6', font: { family: 'Fira Code', size: 9 } } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {selectedTx.cycles_detected?.length > 0 && (
                        <div style={{ padding: '12px', border: '1px solid var(--color-danger)', borderRadius: '6px', background: 'var(--color-danger-glow)' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginBottom: '4px' }}>
                            🕸️ Graph Fraud Ring Cycles Detected
                          </h4>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {selectedTx.cycles_detected.map((cycle, c_idx) => (
                              <div key={c_idx}>↳ {cycle.join(' ➔ ')}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTx.sequence_history?.length > 0 && (
                        <div>
                          <div className="xai-section-title">Sequential Context Attention Weights</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedTx.sequence_history.map((h_tx, h_idx) => {
                              const attnWeight = selectedTx.attention_weights && selectedTx.attention_weights[selectedTx.attention_weights.length - 1]
                                ? selectedTx.attention_weights[selectedTx.attention_weights.length - 1][h_idx]
                                : 0.2;
                                
                              return (
                                <div key={h_idx} style={{ display: 'flex', alignItems: 'center', justify: 'space-between', padding: '8px 12px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--color-purple)' }}>
                                  <span style={{ fontSize: '0.8rem' }}>
                                    ₹{h_tx.amount.toLocaleString()} ({h_tx.merchant_category})
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                                    <div style={{ flexGrow: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${attnWeight * 100}%`, background: 'var(--color-purple)' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                      {(attnWeight * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', padding: '8px 12px', borderRadius: '4px', background: 'var(--color-primary-glow)', borderLeft: '3px solid var(--color-primary)' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                                Target: ₹{selectedTx.amount.toLocaleString()} (Current)
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#FFFFFF', fontWeight: '700' }}>Active Step</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="xai-section-title">Cognitive Fraud Indicators</div>
                        <ul className="bullet-insights">
                          {selectedTx.shapley.explanations.map((exp, exp_idx) => (
                            <li key={exp_idx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="action-buttons-row">
                      <button 
                        className="btn-action approve"
                        onClick={() => {
                          setFeedbackAction('Dismiss Alert');
                          setShowFeedbackModal(true);
                        }}
                      >
                        Dismiss (Legitimate)
                      </button>
                      <button 
                        className="btn-action decline"
                        onClick={() => {
                          setFeedbackAction('Confirm Fraud');
                          setShowFeedbackModal(true);
                        }}
                      >
                        Block & Confirm Fraud
                      </button>
                      <button 
                        className="btn-action escalate"
                        onClick={() => {
                          setFeedbackAction('Escalate');
                          setShowFeedbackModal(true);
                        }}
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="xai-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div>
                      <h3>Select a transaction from the queue</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Neural reasoning attributions and Shapley explanations will render here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'explainable_ai_reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">Explainable AI Audit Engine</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Enter any unique Transaction ID (e.g. <code>TX100423</code>) to retrieve mathematical feature attributions, model subscores, local SHAP waterfalls, and graph cycle analysis.
                </p>
                
                <form onSubmit={handleExplainSearch} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
                  <input 
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    placeholder="TX100423"
                    value={explainSearchId}
                    onChange={e => setExplainSearchId(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-primary" style={{ flexGrow: 0, width: '160px' }} disabled={explainLoading}>
                    {explainLoading ? 'Analyzing...' : 'Run Explainer'}
                  </button>
                </form>
              </div>

              {explainError && (
                <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-danger)', background: 'var(--color-danger-glow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)', fontWeight: '700' }}>
                    <span>⚠️ Query Failure</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>{explainError}</p>
                </div>
              )}

              {explainTx && (
                <div className="investigator-layout" style={{ marginTop: 0, height: 'auto', overflow: 'visible' }}>
                  <div className="glass-panel queue-pane" style={{ flex: '0.9', padding: '24px' }}>
                    <div className="pane-header" style={{ marginBottom: '20px' }}>
                      <span className="pane-title">Transaction Information</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>ID</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{explainTx.transaction_id}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>User Account</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{explainTx.user_id}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Merchant</span>
                        <span>{explainTx.merchant_name} ({explainTx.merchant_category})</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                        <span style={{ fontWeight: '700' }}>₹{explainTx.amount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Location</span>
                        <span>{explainTx.location}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Device & IP</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{explainTx.device_id}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Transaction Type</span>
                        <span>{explainTx.transaction_type}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Timestamp</span>
                        <span>{new Date(explainTx.timestamp * 1000).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>System Outcome</span>
                        <span style={{ 
                          color: explainTx.status === 'Approved' ? 'var(--color-safe)' : explainTx.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)',
                          fontWeight: '700'
                        }}>{explainTx.status}</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '24px' }}>
                      <div className="xai-section-title" style={{ marginTop: 0 }}>Model Score Breakdown</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(explainTx.model_scores).map(([mName, val]) => (
                          <div key={mName} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{mName.toUpperCase()}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: val >= 0.7 ? 'var(--color-danger)' : val >= 0.4 ? 'var(--color-warning)' : 'var(--color-safe)' }}>{(val * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel xai-pane" style={{ flex: '1.1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="pane-header">
                      <span className="pane-title">Neural Logic & Feature Impact</span>
                    </div>
                    <div className="xai-details-wrapper">
                      <div className="risk-summary-box">
                        <div className={`risk-radial-gauge ${explainTx.fraud_score >= 0.85 ? 'high' : 'medium'}`}>
                          {(explainTx.fraud_score * 100).toFixed(0)}%
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>
                            Consolidated Fraud Score: {(explainTx.fraud_score * 100).toFixed(1)}%
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Mathematical combination of ensemble Attributions.
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="xai-section-title">SHAP Feature Influence</div>
                        <div style={{ height: '180px', position: 'relative' }}>
                          <Bar 
                            data={buildShapChartData(explainTx.shapley)}
                            options={{
                              indexAxis: 'y',
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                                y: { ticks: { color: '#F3F4F6', font: { family: 'Fira Code', size: 9 } } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {explainTx.cycles_detected?.length > 0 && (
                        <div style={{ padding: '12px', border: '1px solid var(--color-danger)', borderRadius: '6px', background: 'var(--color-danger-glow)' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginBottom: '4px' }}>
                            🕸️ Graph Fraud Ring Cycles Detected
                          </h4>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {explainTx.cycles_detected.map((cycle, c_idx) => (
                              <div key={c_idx}>↳ {cycle.join(' ➔ ')}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="xai-section-title">Explainability Narrative</div>
                        <ul className="bullet-insights">
                          {explainTx.shapley.explanations.map((exp, exp_idx) => (
                            <li key={exp_idx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* User Transaction History Panel */}
                  <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '24px', marginTop: '12px' }}>
                    <div className="chart-title">User Transaction History Ledger ({explainTx.user_id})</div>
                    {explainTxHistoryLoading ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        Loading transaction history...
                      </div>
                    ) : explainTxHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No historical transactions found for this user.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                              <th style={{ padding: '12px' }}>Transaction ID</th>
                              <th style={{ padding: '12px' }}>Timestamp</th>
                              <th style={{ padding: '12px' }}>Merchant</th>
                              <th style={{ padding: '12px' }}>Category</th>
                              <th style={{ padding: '12px' }}>Amount</th>
                              <th style={{ padding: '12px' }}>Type</th>
                              <th style={{ padding: '12px' }}>Risk Score</th>
                              <th style={{ padding: '12px' }}>Reason for Decision</th>
                              <th style={{ padding: '12px' }}>Outcome</th>
                            </tr>
                          </thead>
                          <tbody>
                            {explainTxHistory.map((t, idx) => {
                              let reasons = [];
                              if (t.explanation) {
                                try {
                                  reasons = typeof t.explanation === 'string' ? JSON.parse(t.explanation) : t.explanation;
                                } catch (e) {
                                  reasons = [t.explanation];
                                }
                              }
                              const reasonText = reasons.join(', ') || 'N/A';

                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: t.transaction_id === explainTx.transaction_id ? 'rgba(255,255,0,0.05)' : 'transparent' }}>
                                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>
                                    {t.transaction_id} {t.transaction_id === explainTx.transaction_id && <span style={{ color: 'var(--color-warning)', fontSize: '0.75rem' }}>(Current)</span>}
                                  </td>
                                  <td style={{ padding: '12px' }}>{new Date(t.timestamp * 1000).toLocaleString()}</td>
                                  <td style={{ padding: '12px' }}>{t.merchant_name}</td>
                                  <td style={{ padding: '12px' }}>{t.merchant_category}</td>
                                  <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                                  <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                                  <td style={{ padding: '12px' }}>
                                    <span className={`tx-score-tag ${t.fraud_score >= 0.85 ? 'high' : t.fraud_score >= 0.4 ? 'medium' : 'low'}`}>
                                      {(t.fraud_score * 100).toFixed(0)}%
                                    </span>
                                  </td>
                                  <td 
                                    style={{ 
                                      padding: '12px', 
                                      maxWidth: '280px', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      color: 'var(--text-secondary)'
                                    }}
                                    title={reasonText}
                                  >
                                    {reasonText}
                                  </td>
                                  <td style={{ padding: '12px', fontWeight: '600', color: t.status === 'Approved' ? 'var(--color-safe)' : t.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                                    {t.status}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transaction_history_analysis' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">Historical Transaction Audit Ledger</div>
                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Transaction ID</th>
                        <th style={{ padding: '12px' }}>Timestamp</th>
                        <th style={{ padding: '12px' }}>User ID</th>
                        <th style={{ padding: '12px' }}>Merchant</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Risk Score</th>
                        <th style={{ padding: '12px' }}>Reason for Decision</th>
                        <th style={{ padding: '12px' }}>Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, idx) => {
                        let reasons = [];
                        if (t.explanation) {
                          try {
                            reasons = typeof t.explanation === 'string' ? JSON.parse(t.explanation) : t.explanation;
                          } catch (e) {
                            reasons = [t.explanation];
                          }
                        }
                        const reasonText = reasons.join(', ') || 'N/A';

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{new Date(t.timestamp * 1000).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{t.user_id}</td>
                            <td style={{ padding: '12px' }}>{t.merchant_name}</td>
                            <td style={{ padding: '12px' }}>{t.merchant_category}</td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>₹{t.amount.toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{t.transaction_type}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={`tx-score-tag ${t.fraud_score >= 0.85 ? 'high' : t.fraud_score >= 0.4 ? 'medium' : 'low'}`}>
                                {(t.fraud_score * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td 
                              style={{ 
                                padding: '12px', 
                                maxWidth: '280px', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                color: 'var(--text-secondary)'
                              }}
                              title={reasonText}
                            >
                              {reasonText}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: '600', color: t.status === 'Approved' ? 'var(--color-safe)' : t.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                                  {t.status}
                                </span>
                                {t.status === 'Approved' && (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ 
                                      padding: '2px 8px', 
                                      fontSize: '0.75rem', 
                                      height: '24px', 
                                      width: 'auto',
                                      background: 'rgba(255, 51, 102, 0.1)',
                                      border: '1px solid rgba(255, 51, 102, 0.3)',
                                      color: 'var(--color-danger)',
                                      boxShadow: 'none'
                                    }}
                                    onClick={() => handleReportScam(t.transaction_id)}
                                  >
                                    ⚠️ Report Scam
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'geolocation_fraud_heatmaps' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>HOTTEST METRO</span>
                    <span className="kpi-icon">📍</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>Mumbai Cluster</div>
                  <div className="kpi-footer">Highest average risk score (58%)</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>INTERNATIONAL HOPS</span>
                    <span className="kpi-icon">✈️</span>
                  </div>
                  <div className="kpi-value">12 Alerts</div>
                  <div className="kpi-footer">Cross-border device IP logins</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>REGIONAL COVERAGE</span>
                    <span className="kpi-icon">🗺️</span>
                  </div>
                  <div className="kpi-value">7 Cities</div>
                  <div className="kpi-footer">Active transaction geolocations</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title" style={{ marginBottom: '16px' }}>Geographic Risk Hotspots Ledger</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Region / City</th>
                        <th style={{ padding: '12px' }}>Total Volume</th>
                        <th style={{ padding: '12px' }}>Average Amount</th>
                        <th style={{ padding: '12px' }}>Average Risk Score</th>
                        <th style={{ padding: '12px' }}>Status Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { city: 'Mumbai', volume: 1420, avgAmt: '₹14,500', score: '58%', status: 'HIGH RISK', color: 'var(--color-danger)' },
                        { city: 'Bangalore', volume: 2840, avgAmt: '₹8,200', score: '12%', status: 'SECURE', color: 'var(--color-safe)' },
                        { city: 'London', volume: 185, avgAmt: '₹42,000', score: '72%', status: 'CRITICAL WARNING', color: 'var(--color-danger)' },
                        { city: 'New York', volume: 92, avgAmt: '₹68,500', score: '64%', status: 'HIGH RISK', color: 'var(--color-danger)' },
                        { city: 'Pune', volume: 950, avgAmt: '₹4,800', score: '18%', status: 'SECURE', color: 'var(--color-safe)' }
                      ].map((geo, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{geo.city}</td>
                          <td style={{ padding: '12px' }}>{geo.volume}</td>
                          <td style={{ padding: '12px' }}>{geo.avgAmt}</td>
                          <td style={{ padding: '12px', fontWeight: '700', color: geo.color }}>{geo.score}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              color: geo.color,
                              background: geo.color === 'var(--color-safe)' ? 'var(--color-safe-glow)' : 'var(--color-danger-glow)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              ● {geo.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk_score_analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>DATA DRIFT INDEX</span>
                    <span style={{ color: 'var(--color-primary)' }}>📊</span>
                  </div>
                  <div className="kpi-value">{stats?.drift?.data_drift || 0.08}</div>
                  <div className="kpi-footer">Feature distribution shift training baseline</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>CONCEPT DRIFT INDEX</span>
                    <span style={{ color: 'var(--color-purple)' }}>🧬</span>
                  </div>
                  <div className="kpi-value">{stats?.drift?.concept_drift || 0.05}</div>
                  <div className="kpi-footer">Scoring probability shift over time</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>ACCURACY RATING</span>
                    <span style={{ color: 'var(--color-safe)' }}>🎯</span>
                  </div>
                  <div className="kpi-value">{stats?.drift?.model_accuracy || 98.42}%</div>
                  <div className="kpi-footer">Simulated model validation rating</div>
                </div>
              </div>

              <div className="glass-panel chart-card" style={{ padding: '24px' }}>
                <div className="chart-title" style={{ marginBottom: '16px' }}>Model Score Probability Distributions</div>
                <div style={{ position: 'relative', height: '320px' }}>
                  <Line 
                    data={distributionChartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      scales: { 
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }, 
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } } 
                      },
                      plugins: { 
                        legend: { 
                          display: true,
                          labels: { color: '#F3F4F6', font: { family: 'Inter' } } 
                        } 
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fraud_trend_reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="charts-row" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
                <div className="glass-panel chart-card" style={{ height: '380px' }}>
                  <div className="chart-title">Real-Time Risk & Ingestion Profile</div>
                  <div style={{ position: 'relative', height: '300px' }}>
                    <Line data={trendChartData} options={trendChartOptions} />
                  </div>
                </div>

                <div className="glass-panel chart-card" style={{ height: '380px' }}>
                  <div className="chart-title">Merchant Category Risk Distribution</div>
                  <div style={{ position: 'relative', height: '300px' }}>
                    <Bar 
                      data={buildCategoryRiskData(transactions)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' }, min: 0, max: 100 }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COGNITIVE AI ENGINES & GOVERNANCE HUB */}
          {activeTab === 'ai_engines_hub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>COGNITIVE ENGINES</span>
                    <span className="kpi-icon">🧠</span>
                  </div>
                  <div className="kpi-value">{aiModules.filter(m => m.status === 'ACTIVE').length} / {aiModules.length}</div>
                  <div className="kpi-footer">Active model partitions online</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>COGNITIVE ACCURACY</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-safe)' }}>🎯</span>
                  </div>
                  <div className="kpi-value">{(aiModules.reduce((acc, m) => acc + m.accuracy, 0) / aiModules.length).toFixed(2)}%</div>
                  <div className="kpi-footer">Consolidated score validation</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>MODEL DRIFT INDEX</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-warning)' }}>📊</span>
                  </div>
                  <div className="kpi-value">0.012 KS</div>
                  <div className="kpi-footer">Drift distribution is healthy</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>GOVERNANCE STATUS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-purple)' }}>⚖️</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.8rem' }}>COMPLIANT</div>
                  <div className="kpi-footer">Governance verification check</div>
                </div>
              </div>

              {/* Row 2: AI Investigator Assistant & Prophet Chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
                {/* AI Investigator Assistant */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 className="pane-title" style={{ margin: 0 }}>🧠 AI Investigator Assistant (NLP Cognitive Summarizer)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Query real-time neural network explainability attributes in human-readable narratives.
                    </p>
                  </div>

                  <form onSubmit={handleAssistantQuery} style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flexGrow: 1, textTransform: 'uppercase' }}
                      placeholder="Enter Transaction ID (e.g. TX100423, TX_ESCROW_SECURE...)"
                      value={assistantSearchId}
                      onChange={e => setAssistantSearchId(e.target.value)}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0 20px', flexShrink: 0, height: '42px', marginTop: 0 }}>
                      Query Assistant
                    </button>
                  </form>

                  <div style={{ flexGrow: 1, minHeight: '220px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '16px', overflowY: 'auto' }}>
                    {assistantSummary ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)', fontSize: '0.8rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>TXID:</span> <strong style={{ color: 'var(--text-primary)' }}>{assistantSummary.txId}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>User:</span> <strong style={{ color: 'var(--text-primary)' }}>{assistantSummary.user}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Amount:</span> <strong style={{ color: 'var(--text-primary)' }}>₹{assistantSummary.amount.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Merchant:</span> <strong style={{ color: 'var(--text-primary)' }}>{assistantSummary.merchant}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Risk Score:</span> <strong style={{ color: assistantSummary.score >= 0.70 ? 'var(--color-danger)' : 'var(--color-safe)' }}>{(assistantSummary.score * 100).toFixed(1)}%</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ color: 'var(--color-safe)', fontWeight: 'bold' }}>EXPLAINED</span>
                          </div>
                        </div>
                        <pre style={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: '#E5E7EB',
                          margin: 0,
                          lineHeight: '1.6'
                        }}>
                          {assistantSummary.explanation}
                        </pre>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button
                            type="button"
                            className="btn-action escalate"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setAssistantSummary(null);
                              setAssistantSearchId('');
                            }}
                          >
                            Clear Summary
                          </button>
                          <button
                            type="button"
                            className="btn-action approve"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-purple)' }}
                            onClick={() => {
                              triggerToast(`Narrative report for ${assistantSummary.txId} exported to investigation queue.`);
                              playAlertSound('success');
                            }}
                          >
                            Export to Queue
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', gap: '8px', minHeight: '180px' }}>
                        <span style={{ fontSize: '2rem' }}>🤖</span>
                        <div>No query active. Enter a Transaction ID to generate dynamic cognitive explanations.</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try: <span style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAssistantSearchId('TX100423')}>TX100423</span> or <span style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAssistantSearchId('TX_ESCROW_SECURE')}>TX_ESCROW_SECURE</span></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prophet Forecast Chart */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 className="pane-title" style={{ margin: 0 }}>📈 Prophet AI Fraud Volume Prediction</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Next-7-day predictive timeline utilizing historical transaction telemetry.
                    </p>
                  </div>
                  <div style={{ position: 'relative', height: '260px', flexGrow: 1 }}>
                    <Line
                      data={{
                        labels: ['May 18', 'May 19', 'May 20', 'May 21', 'May 22 (Today)', 'May 23 (F)', 'May 24 (F)', 'May 25 (F)', 'May 26 (F)', 'May 27 (F)', 'May 28 (F)', 'May 29 (F)'],
                        datasets: [
                          {
                            label: 'Historical Fraud Volume',
                            data: [12, 19, 15, 8, 14, null, null, null, null, null, null, null],
                            borderColor: '#FF3366',
                            backgroundColor: 'rgba(255, 51, 102, 0.05)',
                            tension: 0.3,
                            fill: true,
                            spanGaps: true
                          },
                          {
                            label: 'Prophet AI Forecasted Fraud Volume',
                            data: [null, null, null, null, 14, 18, 22, 19, 13, 15, 20, 24],
                            borderColor: '#8B5CF6',
                            backgroundColor: 'rgba(139, 92, 246, 0.05)',
                            borderDash: [5, 5],
                            tension: 0.3,
                            fill: true,
                            spanGaps: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: '#F3F4F6', font: { family: 'Outfit', size: 11 } } },
                        },
                        scales: {
                          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 10 } } },
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 10 } } }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Insider Threat Logs & Synthetic KYC Matches */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Insider Threat Audits */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 className="pane-title" style={{ marginBottom: '16px' }}>🚨 Insider Threat DB Audits</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px' }}>Admin ID</th>
                          <th style={{ padding: '10px' }}>Action</th>
                          <th style={{ padding: '10px' }}>Geolocation / IP</th>
                          <th style={{ padding: '10px' }}>Timestamp</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Anomaly Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'EMP309', action: 'KYC DB Bulk Read', location: 'St. Petersburg, RU', ip: '92.242.58.11', time: '04:12:18', score: 94 },
                          { id: 'EMP822', action: 'API Key Regen', location: 'Lagos, NG', ip: '102.89.2.43', time: '03:45:10', score: 87 },
                          { id: 'EMP104', action: 'SQL Escalation', location: 'Proxy Node', ip: '185.220.101.5', time: '02:11:54', score: 79 },
                          { id: 'EMP511', action: 'Card Auth Bypass', location: 'Mumbai, IN', ip: '115.110.23.4', time: '01:05:33', score: 62 }
                        ].map((audit) => (
                          <tr key={audit.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{audit.id}</td>
                            <td style={{ padding: '10px' }}>{audit.action}</td>
                            <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {audit.location} <br />
                              <span style={{ color: 'var(--text-muted)' }}>{audit.ip}</span>
                            </td>
                            <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{audit.time}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: '#FFFFFF',
                                background: audit.score >= 85 ? 'var(--color-danger)' : 'var(--color-warning)'
                              }}>
                                {audit.score}% Risk
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Synthetic Identities */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 className="pane-title" style={{ marginBottom: '16px' }}>🎭 Synthetic Identity KYC Flags</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px' }}>App ID</th>
                          <th style={{ padding: '10px' }}>Applicant</th>
                          <th style={{ padding: '10px' }}>Match Pattern</th>
                          <th style={{ padding: '10px' }}>Risk Status</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Match Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'SYN803', name: 'Alok R. Sharma', matchType: 'SSN Hash Reuse', risk: 'CRITICAL', score: 96.4 },
                          { id: 'SYN512', name: 'Vikram S. Yadav', matchType: 'Device Duplicate', risk: 'HIGH', score: 88.2 },
                          { id: 'SYN991', name: 'Neha K. Patel', matchType: 'Mule Phone Linkage', risk: 'MEDIUM', score: 74.5 },
                          { id: 'SYN204', name: 'Rohit P. Joshi', matchType: 'Address Pattern', risk: 'HIGH', score: 82.8 }
                        ].map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.id}</td>
                            <td style={{ padding: '10px' }}>{item.name}</td>
                            <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{item.matchType}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                color: '#FFFFFF',
                                background: item.risk === 'CRITICAL' ? 'var(--color-danger)' : item.risk === 'HIGH' ? 'var(--color-warning)' : 'var(--color-primary)'
                              }}>
                                {item.risk}
                              </span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{item.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 4: AI Modules Toggle Configuration */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 className="pane-title" style={{ marginBottom: '16px' }}>🧠 Cognitive AI Engines (20 Feature Partitions)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {aiModules.map((m) => (
                    <div key={m.id} className="glass-panel" style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      background: m.status === 'ACTIVE' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.15)',
                      borderColor: m.status === 'ACTIVE' ? 'rgba(59, 130, 246, 0.15)' : 'var(--panel-border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: m.status === 'ACTIVE' ? '#FFFFFF' : 'var(--text-muted)' }}>
                            {m.name}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-secondary)'
                          }}>
                            {m.category}
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleModule(m.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: m.status === 'ACTIVE' ? 'var(--color-safe)' : 'var(--color-warning)',
                            background: m.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: m.status === 'ACTIVE' ? 'var(--color-safe)' : 'var(--color-warning)',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          {m.status}
                        </button>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: m.status === 'ACTIVE' ? 'var(--text-secondary)' : 'var(--text-muted)', minHeight: '36px', lineHeight: '1.4' }}>
                        {m.desc}
                      </div>

                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        Model: {m.model}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Precision:</span>
                          <span style={{ color: m.status === 'ACTIVE' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>{m.accuracy}%</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${m.accuracy}%`,
                            height: '100%',
                            background: m.status === 'ACTIVE' ? 'linear-gradient(to right, var(--color-primary), var(--color-safe))' : 'var(--text-muted)'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: ESCROW MONITOR */}
          {activeTab === 'escrow_monitor' && (
            <div className="escrow-monitor-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* KPIs */}
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>ACTIVE ESCROWS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-primary)' }}>⏱️</span>
                  </div>
                  <div className="kpi-value">{escrows.filter(e => e.status !== 'Reverted').length}</div>
                  <div className="kpi-footer">Transactions currently under monitoring</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>MOVED FUNDS ALERTS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-danger)' }}>🚨</span>
                  </div>
                  <div className="kpi-value" style={{ color: escrows.some(e => e.status === 'Moved') ? 'var(--color-danger)' : 'inherit' }}>
                    {escrows.filter(e => e.status === 'Moved').length}
                  </div>
                  <div className="kpi-footer">Scammer outbound movements flagged</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>REVERTED FUNDS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-safe)' }}>✓</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>
                    ₹{escrows.filter(e => e.status === 'Reverted').reduce((sum, e) => sum + e.original_tx.amount, 0).toLocaleString()}
                  </div>
                  <div className="kpi-footer">Reclaimed funds returned to senders</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>TOTAL UNDER REVIEW</span>
                    <span className="kpi-icon">💼</span>
                  </div>
                  <div className="kpi-value">
                    ₹{escrows.reduce((sum, e) => sum + e.original_tx.amount, 0).toLocaleString()}
                  </div>
                  <div className="kpi-footer">Total value in monitored pool</div>
                </div>
              </div>

              {/* Monitored List */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title">12-Hour Fund Escrow Queue & Chain-of-Custody Analytics</div>
                
                {escrowsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading monitored escrow cases...</div>
                ) : escrows.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions currently in the 12-hour escrow monitor. Mark transactions as scam in the History tab to test.</div>
                ) : (
                  <div className="escrow-grid" style={{ marginTop: '16px' }}>
                    {escrows.map((e, idx) => {
                      const timePct = e.status === 'Reverted' ? 100 : (1 - (e.time_remaining_seconds / 43200.0)) * 100;
                      
                      // Format countdown timer helper
                      const formatCountdown = (secs) => {
                        if (secs <= 0) return "Expired";
                        const hrs = Math.floor(secs / 3600);
                        const mins = Math.floor((secs % 3600) / 60);
                        const scs = Math.floor(secs % 60);
                        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${scs.toString().padStart(2, '0')}`;
                      };

                      return (
                        <div key={idx} className={`escrow-card ${e.status.toLowerCase()}`}>
                          <div className="escrow-header">
                            <span className="escrow-id">{e.original_tx.transaction_id}</span>
                            <span className={`escrow-status-badge ${e.status.toLowerCase()}`}>
                              {e.status === 'Reverted' && '● Reverted'}
                              {e.status === 'Moved' && '● Alert: Moved'}
                              {e.status === 'Monitored' && '● Escrow Active'}
                            </span>
                          </div>

                          <div className="escrow-details">
                            <div className="escrow-detail-item">
                              <span className="escrow-label">Sender (Victim)</span>
                              <span className="escrow-value">{e.original_tx.user_id}</span>
                            </div>
                            <div className="escrow-detail-item">
                              <span className="escrow-label">Escrowed Amount</span>
                              <span className="escrow-value amount">₹{e.original_tx.amount.toLocaleString()}</span>
                            </div>
                            <div className="escrow-detail-item" style={{ gridColumn: 'span 2' }}>
                              <span className="escrow-label">Receiver (Mule/Merchant)</span>
                              <span className="escrow-value" style={{ fontFamily: 'var(--font-mono)' }}>
                                {e.original_tx.merchant_id} ({e.original_tx.merchant_name})
                              </span>
                            </div>
                          </div>

                          {/* Countdown Timer */}
                          <div className="escrow-timer-section">
                            <div className="escrow-timer-header">
                              <span>Reversion Escrow Window</span>
                              <span style={{ 
                                fontWeight: '700', 
                                color: e.status === 'Reverted' ? 'var(--color-safe)' : (e.time_remaining_seconds < 14400 ? 'var(--color-danger)' : 'var(--color-warning)'),
                                animation: e.status === 'Monitored' || e.status === 'Moved' ? 'pulse-risk 1s infinite alternate' : 'none'
                              }}>
                                {e.status === 'Reverted' ? 'COMPLETED' : formatCountdown(e.time_remaining_seconds)}
                              </span>
                            </div>
                            <div className="escrow-progress-bg">
                              <div 
                                className={`escrow-progress-fill ${e.status === 'Reverted' ? 'reverted' : (e.time_remaining_seconds < 14400 ? 'warning' : '')}`}
                                style={{ width: `${Math.min(100, Math.max(0, timePct))}%` }}
                              />
                            </div>
                          </div>

                          {/* Flow Diagram */}
                          <div className="escrow-timer-section">
                            <span className="escrow-label" style={{ marginBottom: '4px' }}>Fund Flow Tracer Node</span>
                            <div className="escrow-flow-chart">
                              <div className="flow-node sender">
                                <div className="flow-node-icon">👤</div>
                                <div className="flow-node-label">{e.original_tx.user_id}</div>
                                <div className="flow-node-sub">Victim</div>
                              </div>

                              <div className={`flow-connector active ${e.status === 'Moved' ? 'alert' : ''}`}>
                                <div className={`flow-connector-text ${e.status === 'Moved' ? 'alert' : ''}`}>
                                  ₹{e.original_tx.amount.toLocaleString()}
                                </div>
                              </div>

                              <div className={`flow-node scammer ${e.status === 'Moved' ? 'alert' : ''}`}>
                                <div className="flow-node-icon">😈</div>
                                <div className="flow-node-label">{e.original_tx.merchant_name.substring(0, 12)}</div>
                                <div className="flow-node-sub">Scammer</div>
                              </div>

                              {e.next_hop && (
                                <>
                                  <div className="flow-connector alert">
                                    <div className="flow-connector-text alert">
                                      ₹{e.next_hop.amount.toLocaleString()}
                                    </div>
                                  </div>

                                  <div className="flow-node recipient alert">
                                    <div className="flow-node-icon">🏦</div>
                                    <div className="flow-node-label">{e.next_hop.recipient_name.substring(0, 12)}</div>
                                    <div className="flow-node-sub">Next Hop</div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {e.status === 'Moved' && (
                            <div style={{ 
                              color: 'var(--color-danger)', 
                              background: 'var(--color-danger-glow)',
                              padding: '10px 14px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              border: '1px solid rgba(255, 51, 102, 0.25)',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}>
                              <span>⚠️</span>
                              <span style={{ fontSize: '0.78rem' }}>
                                <b>Alert:</b> Scammer moved ₹{e.next_hop.amount.toLocaleString()} out of the receiving account to <i>{e.next_hop.recipient_name}</i> ({e.next_hop.time_delta_mins}m after original transaction).
                              </span>
                            </div>
                          )}

                          {e.status !== 'Reverted' && (
                            <button
                              type="button"
                              className="btn-primary revert-action-btn"
                              style={{
                                background: e.status === 'Moved' 
                                  ? 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-purple) 100%)' 
                                  : 'linear-gradient(135deg, var(--color-safe) 0%, var(--color-primary) 100%)',
                                boxShadow: e.status === 'Moved'
                                  ? '0 4px 15px rgba(255, 51, 102, 0.25)'
                                  : '0 4px 15px rgba(16, 185, 129, 0.25)',
                                height: '40px',
                                fontSize: '0.9rem',
                                width: '100%'
                              }}
                              onClick={() => handleRevertEscrow(e.original_tx.transaction_id)}
                              disabled={e.time_remaining_seconds <= 0}
                            >
                              ⏪ Revert Funds Back to Victim
                            </button>
                          )}

                          {e.status === 'Reverted' && (
                            <div style={{
                              color: 'var(--color-safe)',
                              background: 'var(--color-safe-glow)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              padding: '10px',
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontWeight: '700',
                              fontSize: '0.85rem'
                            }}>
                              ✓ Reversion Completed. Funds returned to sender.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: INFRASTRUCTURE DASHBOARD */}
          {activeTab === 'infrastructure_dashboard' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>GLOBAL CPU LOAD</span>
                    <span className="kpi-icon">🖥️</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>34.2%</div>
                  <div className="kpi-footer">Average across 3 cluster nodes</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>MEMORY UTILS</span>
                    <span className="kpi-icon">💾</span>
                  </div>
                  <div className="kpi-value">2.12 GB / 8.00 GB</div>
                  <div className="kpi-footer">26.5% system memory allocated</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>NETWORK EGRESS</span>
                    <span className="kpi-icon">📈</span>
                  </div>
                  <div className="kpi-value">3.42 MB/s</div>
                  <div className="kpi-footer">Active streaming traffic bandwidth</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>CLIENT SESSIONS</span>
                    <span className="kpi-icon">👥</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-primary)' }}>184</div>
                  <div className="kpi-footer">Active authenticated WS connections</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title" style={{ marginBottom: '16px' }}>Active Infrastructure Nodes</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Node Name</th>
                        <th style={{ padding: '12px' }}>IP Address</th>
                        <th style={{ padding: '12px' }}>Region & Zone</th>
                        <th style={{ padding: '12px' }}>CPU Load</th>
                        <th style={{ padding: '12px' }}>Memory</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'omnitrace-node-primary', ip: '10.140.0.12', region: 'asia-south1-a', cpu: '42%', mem: '1.1 GB', status: 'Online' },
                        { name: 'omnitrace-node-secondary', ip: '10.140.0.13', region: 'asia-south1-b', cpu: '28%', mem: '0.9 GB', status: 'Online' },
                        { name: 'omnitrace-node-failover', ip: '10.140.0.14', region: 'asia-south1-c', cpu: '2%', mem: '0.1 GB', status: 'Standby' }
                      ].map((node, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{node.name}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{node.ip}</td>
                          <td style={{ padding: '12px' }}>{node.region}</td>
                          <td style={{ padding: '12px' }}>{node.cpu}</td>
                          <td style={{ padding: '12px' }}>{node.mem}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              color: node.status === 'Online' ? 'var(--color-safe)' : 'var(--color-warning)',
                              background: node.status === 'Online' ? 'var(--color-safe-glow)' : 'var(--color-warning-glow)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              fontSize: '0.75rem'
                            }}>
                              ● {node.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Authentication & Verification Services Monitoring */}
              {sysHealth?.face_service && (
                <div style={{ marginTop: '24px' }}>
                  <div className="section-header" style={{ marginBottom: '16px' }}>
                    <span className="section-subtitle">Identity Verification Services</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '4px', marginBottom: '16px' }}>Adaptive Authentication & API Health</h3>
                  </div>

                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>FACE RECOGNITION HEALTH</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-safe)' }}>
                        ● {sysHealth.face_service.status}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Latency: {sysHealth.face_service.latency} | Uptime: {sysHealth.face_service.uptime}
                      </div>
                    </div>

                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OTP SERVICE STATUS</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-safe)' }}>
                        ● {sysHealth.otp_service.status}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Deliv. Rate: {sysHealth.otp_service.delivery_rate}% | Uptime: {sysHealth.otp_service.uptime}
                      </div>
                    </div>

                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>VERIFICATION API MONITORING</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-primary)' }}>
                        {sysHealth.verification_api_uptime}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Auth Latency SLA: {sysHealth.auth_latency}
                      </div>
                    </div>

                    <div className="glass-panel kpi-card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>HOLD QUEUE CAPACITY</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--color-warning)' }}>
                        {sysHealth.hold_queue_monitoring.active_holds} / {sysHealth.hold_queue_monitoring.max_capacity}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Concurrent queue buffer load
                      </div>
                    </div>
                  </div>

                  {/* Verification Failure Logs */}
                  <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                    <div className="chart-title" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Verification Failure Logs & Audit Track</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'rgba(255, 51, 102, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>ALERT CONSOLE</span>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '200px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: '#0e1117', padding: '12px', borderRadius: '6px', border: '1px solid var(--panel-border)', textAlign: 'left' }}>
                      {sysHealth.verification_failures.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>[{log.timestamp}]</span>{' '}
                          <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>[FAILURE]</span>{' '}
                          <span style={{ color: 'var(--color-primary)' }}>{log.tx_id}</span> -{' '}
                          <span style={{ color: '#eee' }}>({log.method})</span> {log.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DEPLOYMENT MONITORING */}
          {activeTab === 'deployment_monitoring' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="charts-row" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
                {/* Pipeline Stepper */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="chart-title">CI/CD Production Deployment Pipeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                    {[
                      { step: '1', name: 'Lint & Format Verification', status: 'Success', time: '10 mins ago', desc: 'Pre-commit checks validated cleanly.' },
                      { step: '2', name: 'Unit & Regression Tests', status: 'Success', time: '8 mins ago', desc: '42 test suites completed successfully.' },
                      { step: '3', name: 'Docker Container Construction', status: 'Success', time: '5 mins ago', desc: 'Multi-stage build completed for backend and worker.' },
                      { step: '4', name: 'Image Vulnerability Auditing', status: 'Success', time: '4 mins ago', desc: '0 CVE vulnerabilities flagged in base Alpine image.' },
                      { step: '5', name: 'Firebase Hosting Release', status: 'Active', time: '1 min ago', desc: 'Deployed bundle to https://omnitrace-portal-2026.web.app.' }
                    ].map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: idx === 4 ? '0' : '16px' }}>
                        {idx !== 4 && (
                          <div style={{
                            position: 'absolute',
                            left: '15px',
                            top: '30px',
                            bottom: '0',
                            width: '2px',
                            background: step.status === 'Success' ? 'var(--color-safe)' : 'var(--color-primary-glow)'
                          }}></div>
                        )}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: step.status === 'Success' ? 'var(--color-safe-glow)' : 'var(--color-primary-glow)',
                          border: `2px solid ${step.status === 'Success' ? 'var(--color-safe)' : 'var(--color-primary)'}`,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          zIndex: 2
                        }}>
                          {step.status === 'Success' ? '✓' : step.step}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{step.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.time}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata Board */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="chart-title">Production Release Metadata</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Environment</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-safe)' }}>Firebase Production (Live)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Active Commit Hash</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>0c1be784ad9a</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Workflow Run ID</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>#18485285</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Assets Bundle Size</span>
                      <span style={{ fontWeight: '600' }}>2.42 MB</span>
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--panel-border)', borderRadius: '6px', padding: '12px', background: 'rgba(0,0,0,0.15)', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-primary)' }}>Bundle Manifest File Sizes</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>dist/index.html</span>
                        <span>4.20 KB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>dist/assets/index.js</span>
                        <span>1.82 MB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>dist/assets/index.css</span>
                        <span>20.45 KB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>dist/assets/vendor.js</span>
                        <span>580.12 KB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: API MONITORING */}
          {activeTab === 'api_monitoring' && (
            <div className="sys-dashboard">
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>CONNECTION POOL</span>
                    <span className="kpi-icon">🔌</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>12 / 20</div>
                  <div className="kpi-footer">Active DB & worker pools</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>AVERAGE LATENCY</span>
                    <span className="kpi-icon">⚡</span>
                  </div>
                  <div className="kpi-value">14.2 ms</div>
                  <div className="kpi-footer">Response time p50 baseline</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>REQUEST VOLUME</span>
                    <span className="kpi-icon">📊</span>
                  </div>
                  <div className="kpi-value">45.8 req/s</div>
                  <div className="kpi-footer">Live throughput metrics</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>ERROR RATE</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-safe)' }}>📉</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>0.02%</div>
                  <div className="kpi-footer">Non-2xx response status codes</div>
                </div>
              </div>

              {/* Charts row */}
              <div className="charts-row">
                <div className="glass-panel chart-card" style={{ height: '350px' }}>
                  <div className="chart-title">API Response Latency Distributions (p50 / p95 / p99)</div>
                  <div style={{ position: 'relative', height: '270px' }}>
                    <Line data={apiLatencyChartData} options={apiChartOptions} />
                  </div>
                </div>
                
                <div className="glass-panel chart-card" style={{ height: '350px' }}>
                  <div className="chart-title">HTTP Response Code Distribution</div>
                  <div style={{ position: 'relative', height: '270px' }}>
                    <Bar data={apiStatusCodesChartData} options={apiChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLOUD MANAGEMENT */}
          {activeTab === 'cloud_management' && (
            <div className="sys-dashboard">
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>GCP HOSTING REGION</span>
                    <span>☁️</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.4rem' }}>asia-south1</div>
                  <div className="kpi-footer">Mumbai region cluster</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>FIRESTORE STORAGE</span>
                    <span>💿</span>
                  </div>
                  <div className="kpi-value">4.82 GB</div>
                  <div className="kpi-footer">48% of 10 GB limits quota</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>FIRESTORE READS / WRITES</span>
                    <span>📊</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.3rem' }}>124k / 45k</div>
                  <div className="kpi-footer">Daily reads and writes loads</div>
                </div>

                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>GCP NETWORK EGRESS</span>
                    <span>📈</span>
                  </div>
                  <div className="kpi-value">12.8 GB</div>
                  <div className="kpi-footer">Egress bytes usage month-to-date</div>
                </div>
              </div>

              <div className="charts-row">
                <div className="glass-panel chart-card" style={{ height: '350px' }}>
                  <div className="chart-title">Cloud Network Traffic Rate (Ingress vs Egress)</div>
                  <div style={{ position: 'relative', height: '270px' }}>
                    <Line data={cloudTrafficChartData} options={apiChartOptions} />
                  </div>
                </div>

                <div className="glass-panel chart-card" style={{ height: '350px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="chart-title">Cloud Resources Pool Meters</div>
                  
                  {/* Dials / progress bars */}
                  {[
                    { name: 'Firestore Connections', current: 24, max: 100, unit: 'active pools' },
                    { name: 'Cloud Storage Objects', current: 1485, max: 5000, unit: 'files stored' },
                    { name: 'Firebase Hosting Inode Quota', current: 72, max: 200, unit: 'deployed routes' }
                  ].map((dial, d_idx) => {
                    const ratio = (dial.current / dial.max) * 100;
                    return (
                      <div key={d_idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '500' }}>{dial.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{dial.current} / {dial.max} {dial.unit}</span>
                        </div>
                        <div style={{
                          height: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${ratio}%`,
                            background: 'linear-gradient(to right, var(--color-primary), var(--color-purple))',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATABASE MANAGEMENT */}
          {activeTab === 'database_management' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>ACTIVE CONNECTION POOLS</span>
                    <span className="kpi-icon">💾</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>14 / 30</div>
                  <div className="kpi-footer">SQLAlchemy session pooling limit</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>CACHE HIT RATIO</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-primary)' }}>⚡</span>
                  </div>
                  <div className="kpi-value">94.8%</div>
                  <div className="kpi-footer">Redis cache hit distribution rate</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>AVG QUERY LATENCY</span>
                    <span className="kpi-icon">⏱️</span>
                  </div>
                  <div className="kpi-value">2.45 ms</div>
                  <div className="kpi-footer">Read/Write transaction latency</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>SQLITE DB SIZE</span>
                    <span className="kpi-icon">💿</span>
                  </div>
                  <div className="kpi-value">224 KB</div>
                  <div className="kpi-footer">Persistent SQLite storage allocations</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="glass-panel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px' }}>
                  <span style={{ fontWeight: '600', fontSize: '1rem' }}>Query Performance Optimizer</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Trigger VACUUM, run ANALYZE, and reconstruct SQLite b-tree indices to optimize query performance.
                  </span>
                </div>
                <button
                  disabled={optimizingDatabase}
                  onClick={handleOptimizeDatabase}
                  style={{
                    background: optimizingDatabase ? 'var(--color-warning-glow)' : 'var(--color-safe-glow)',
                    border: `1px solid ${optimizingDatabase ? 'var(--color-warning)' : 'var(--color-safe)'}`,
                    color: optimizingDatabase ? 'var(--color-warning)' : '#FFFFFF',
                    marginRight: '16px',
                    padding: '8px 20px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    cursor: optimizingDatabase ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {optimizingDatabase ? 'Database Optimizing...' : 'Optimize Indices Now'}
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title" style={{ marginBottom: '16px' }}>SQLite DB Table Metrics</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Table Name</th>
                        <th style={{ padding: '12px' }}>Recorded Rows</th>
                        <th style={{ padding: '12px' }}>Total Columns</th>
                        <th style={{ padding: '12px' }}>Index Count</th>
                        <th style={{ padding: '12px' }}>Index Integrity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'auth_users', rows: 11, cols: 5, indices: 2, status: 'Optimal' },
                        { name: 'transactions', rows: 245, cols: 9, indices: 3, status: 'Optimal' },
                        { name: 'audit_logs', rows: 120, cols: 5, indices: 1, status: 'Optimal' }
                      ].map((tbl, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{tbl.name}</td>
                          <td style={{ padding: '12px' }}>{tbl.rows}</td>
                          <td style={{ padding: '12px' }}>{tbl.cols}</td>
                          <td style={{ padding: '12px' }}>{tbl.indices}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              color: 'var(--color-safe)',
                              background: 'var(--color-safe-glow)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              fontSize: '0.75rem'
                            }}>
                              ✓ {tbl.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY MONITORING */}
          {activeTab === 'security_monitoring' && (
            <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>WAF SHIELD</span>
                    <span className="kpi-icon">🛡️</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>Active</div>
                  <div className="kpi-footer">Cloudflare rules fully engaged</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>SSL EXPIRY</span>
                    <span className="kpi-icon">🔑</span>
                  </div>
                  <div className="kpi-value">284 Days</div>
                  <div className="kpi-footer">Next renew: Jan 20, 2027</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>BLOCKED REQUESTS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-danger)' }}>🚨</span>
                  </div>
                  <div className="kpi-value">342</div>
                  <div className="kpi-footer">Rate limit blocks (24 hrs)</div>
                </div>
                
                <div className="glass-panel kpi-card">
                  <div className="kpi-header">
                    <span>THREAT STATUS</span>
                    <span className="kpi-icon" style={{ color: 'var(--color-safe)' }}>📉</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-safe)' }}>LOW</div>
                  <div className="kpi-footer">No active intrusion alerts</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="chart-title" style={{ marginBottom: '16px' }}>Recent Firewall Security Events</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Event Time</th>
                        <th style={{ padding: '12px' }}>IP / Source</th>
                        <th style={{ padding: '12px' }}>Requested Path</th>
                        <th style={{ padding: '12px' }}>Trigger Rule</th>
                        <th style={{ padding: '12px' }}>Severity</th>
                        <th style={{ padding: '12px' }}>System Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { time: '18:02:45', src: '198.51.100.42', path: '/api/auth/login', rule: 'Brute Force Attempt', level: 'HIGH', action: 'IP Temp Blocked' },
                        { time: '17:45:12', src: '203.0.113.88', path: '/api/transactions/predict', rule: 'SQLi Filter Signature', level: 'CRITICAL', action: 'Request Dropped' },
                        { time: '16:30:19', src: '192.0.2.14', path: '/wp-admin/index.php', rule: 'Vulnerability Scan Path', level: 'MEDIUM', action: '404 Response' }
                      ].map((evt, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px' }}>{evt.time}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{evt.src}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{evt.path}</td>
                          <td style={{ padding: '12px' }}>{evt.rule}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              color: evt.level === 'CRITICAL' || evt.level === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)',
                              fontWeight: '700'
                            }}>{evt.level}</span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-safe)' }}>{evt.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTAINER MANAGEMENT */}
          {activeTab === 'container_management' && (
            <div className="sys-dashboard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Docker Cluster Ingress Nodes</h3>
                <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-safe)', color: 'var(--color-safe)', padding: '4px 10px', borderRadius: '4px' }}>
                  ● Cluster Healthy (5 / 5 Up)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'omnitrace-backend', port: '8000:8000', type: 'Python FastAPI', cpu: '12%', memory: '245 MB' },
                  { name: 'omnitrace-frontend', port: '80:80', type: 'Nginx Static / Client', cpu: '2%', memory: '42 MB' },
                  { name: 'omnitrace-redis-cache', port: '6379:6379', type: 'Redis Service', cpu: '1%', memory: '88 MB' },
                  { name: 'omnitrace-db-volume', port: 'Persistent Storage', type: 'SQLite Database', cpu: '4%', memory: '1.24 GB' },
                  { name: 'omnitrace-gnn-worker', port: 'Internal Worker', type: 'Graph Neural Net Engine', cpu: '28%', memory: '482 MB' }
                ].map((cont, idx) => {
                  const isRebooting = rebootingContainer === cont.name;
                  return (
                    <div 
                      key={idx} 
                      className={`glass-panel ${isRebooting ? 'container-rebooting' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px',
                        background: isRebooting ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                        border: `1px solid ${isRebooting ? 'var(--color-warning)' : 'var(--panel-border)'}`,
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        {/* Status Light indicator */}
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: isRebooting ? 'var(--color-warning)' : 'var(--color-safe)',
                          boxShadow: `0 0 10px ${isRebooting ? 'var(--color-warning)' : 'var(--color-safe)'}`,
                          animation: isRebooting ? 'container-reboot-pulse 0.8s infinite' : 'none'
                        }}></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{cont.name}</span>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span>Type: <b>{cont.type}</b></span>
                            <span>Port: <code>{cont.port}</code></span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CPU</span>
                            <span style={{ fontWeight: '600' }}>{isRebooting ? '0%' : cont.cpu}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>MEM</span>
                            <span style={{ fontWeight: '600' }}>{isRebooting ? '---' : cont.memory}</span>
                          </div>
                        </div>

                        <button
                          disabled={rebootingContainer !== null}
                          onClick={() => handleRestartContainer(cont.name)}
                          style={{
                            background: isRebooting 
                              ? 'var(--color-warning-glow)' 
                              : rebootingContainer 
                                ? 'rgba(255,255,255,0.02)' 
                                : 'var(--color-primary-glow)',
                            border: `1px solid ${isRebooting ? 'var(--color-warning)' : rebootingContainer ? 'transparent' : 'var(--color-primary)'}`,
                            color: isRebooting ? 'var(--color-warning)' : rebootingContainer ? 'var(--text-muted)' : '#FFFFFF',
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            cursor: rebootingContainer ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          {isRebooting ? 'Rebooting...' : 'Restart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: PERFORMANCE LOGS */}
          {activeTab === 'performance_logs' && (() => {
            const filteredLogs = terminalLogs.filter(log => {
              if (logsSearchTerm && !log.toLowerCase().includes(logsSearchTerm.toLowerCase())) {
                return false;
              }
              if (logsFilterLevel !== 'ALL') {
                const levelTag = `[${logsFilterLevel}]`;
                if (logsFilterLevel === 'ERROR') {
                  return log.includes('[ERROR]') || log.includes('[DECLINED]') || log.includes('[ALERT]');
                }
                return log.includes(levelTag);
              }
              return true;
            });
            
            return (
              <div className="sys-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 160px)' }}>
                {/* Filter controls */}
                <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Log Level:</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['ALL', 'INFO', 'WARNING', 'ALERT'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setLogsFilterLevel(lvl)}
                          style={{
                            background: logsFilterLevel === lvl ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${logsFilterLevel === lvl ? 'var(--color-primary)' : 'var(--panel-border)'}`,
                            color: logsFilterLevel === lvl ? '#FFFFFF' : 'var(--text-secondary)',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexGrow: 1, maxWidth: '400px', marginLeft: 'auto' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      placeholder="Search performance logs pattern..."
                      value={logsSearchTerm}
                      onChange={e => setLogsSearchTerm(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setLogsAutoScroll(!logsAutoScroll)}
                      style={{
                        background: logsAutoScroll ? 'var(--color-safe-glow)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${logsAutoScroll ? 'var(--color-safe)' : 'var(--panel-border)'}`,
                        color: logsAutoScroll ? '#FFFFFF' : 'var(--text-secondary)',
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {logsAutoScroll ? 'Lock Auto-Scroll' : 'Unlock Auto-Scroll'}
                    </button>
                  </div>
                </div>

                {/* Terminal Logs list */}
                <div className="logs-terminal-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  <div className="terminal-header">
                    <div className="term-dot" style={{ backgroundColor: '#EF4444' }}></div>
                    <div className="term-dot" style={{ backgroundColor: '#F59E0B' }}></div>
                    <div className="term-dot" style={{ backgroundColor: '#10B981' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginLeft: '12px' }}>
                      omnitrace_system.log
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                      Showing {filteredLogs.length} of {terminalLogs.length} logs
                    </span>
                  </div>
                  <div className="term-output" style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                    {filteredLogs.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>No logs match the current filters.</div>
                    ) : (
                      filteredLogs.map((log, idx) => {
                        let logColor = '#D1D5DB';
                        if (log.includes('[ALERT]') || log.includes('[ERROR]')) logColor = 'var(--color-danger)';
                        else if (log.includes('[WARNING]')) logColor = 'var(--color-warning)';
                        else if (log.includes('[INFO]')) logColor = 'var(--color-safe)';
                        
                        return (
                          <div key={idx} style={{ color: logColor }}>
                            {log}
                          </div>
                        );
                      })
                    )}
                    <div ref={terminalEndRef}></div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </main>

      {/* Resolution Comments Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <form className="glass-panel modal-content" onSubmit={handleResolveAlert}>
            <h3 className="pane-title" style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              Confirm Risk Action: {feedbackAction}
            </h3>
            
            <div className="form-group">
              <label className="form-label">Resolution Comments</label>
              <textarea 
                className="form-input"
                style={{ height: '100px', resize: 'none' }}
                value={feedbackComments}
                onChange={e => setFeedbackComments(e.target.value)}
                placeholder="Enter audit investigation details for feedback loop..."
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-action" 
                style={{ background: 'rgba(255,255,255,0.05)', flexGrow: 0, width: '100px' }}
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="btn-action approve"
                style={{ flexGrow: 0, width: '160px', background: feedbackAction === 'Confirm Fraud' ? 'var(--color-danger)' : 'var(--color-safe)' }}
              >
                Submit Decision
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Toast Notification Component */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#F8FAFC',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: 'var(--font-sans)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-safe)',
            boxShadow: '0 0 8px var(--color-safe)'
          }}></div>
          <div>{toastMessage}</div>
        </div>
      )}
    </div>
  );
}
