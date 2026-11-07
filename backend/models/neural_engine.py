import numpy as np
import networkx as nx
from typing import List, Dict, Any, Tuple

# Set seed for deterministic neural weights (simulating a trained model)
np.random.seed(42)

class NeuralFraudEngine:
    def __init__(self):
        # 1. DNN Weights (Tabular model)
        # Input features: [amount, location_anomaly, device_anomaly, merchant_risk, velocity, hour_sin, hour_cos]
        self.dnn_w1 = np.random.randn(7, 16) * 0.1
        self.dnn_b1 = np.zeros(16)
        self.dnn_w2 = np.random.randn(16, 8) * 0.1
        self.dnn_b2 = np.zeros(8)
        self.dnn_w3 = np.random.randn(8, 1) * 0.1
        self.dnn_b3 = np.zeros(1)

        # 2. LSTM Weights (Sequence model - last 5 transactions)
        # Input features per transaction: [amount, time_delta, location_anomaly, device_anomaly, merchant_risk]
        # Input size: 5, Hidden size: 8
        self.lstm_w_ih = np.random.randn(32, 5) * 0.1 # 4 * hidden_size = 32
        self.lstm_w_hh = np.random.randn(32, 8) * 0.1
        self.lstm_b = np.zeros(32)
        self.lstm_w_out = np.random.randn(8, 1) * 0.1
        self.lstm_b_out = np.zeros(1)

        # 3. Autoencoder Weights (Anomaly detection)
        # Input: [amount, hour_sin, hour_cos, merchant_risk, type_code] (size 5)
        # Encoder: 5 -> 2, Decoder: 2 -> 5
        self.ae_w_enc = np.random.randn(5, 2) * 0.1
        self.ae_b_enc = np.zeros(2)
        self.ae_w_dec = np.random.randn(2, 5) * 0.1
        self.ae_b_dec = np.zeros(5)

        # 4. Transformer Attention parameters
        # Embedding size: 8, Sequence length: 5
        self.trans_w_q = np.random.randn(8, 8) * 0.1
        self.trans_w_k = np.random.randn(8, 8) * 0.1
        self.trans_w_v = np.random.randn(8, 8) * 0.1
        self.trans_w_out = np.random.randn(8, 1) * 0.1

    def _sigmoid(self, x: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-np.clip(x, -50, 50)))

    def _relu(self, x: np.ndarray) -> np.ndarray:
        return np.maximum(0, x)

    def run_dnn(self, features: np.ndarray) -> float:
        """
        Deep Neural Network for transaction classification.
        Features input shape: (7,)
        """
        h1 = self._relu(np.dot(features, self.dnn_w1) + self.dnn_b1)
        h2 = self._relu(np.dot(h1, self.dnn_w2) + self.dnn_b2)
        out = self._sigmoid(np.dot(h2, self.dnn_w3) + self.dnn_b3)
        return float(out[0])

    def run_lstm(self, sequence: np.ndarray) -> Tuple[float, np.ndarray]:
        """
        LSTM Sequence evaluation over user's last 5 transactions.
        Sequence input shape: (L, 5) where L <= 5.
        Returns:
            lstm_score (float)
            hidden_states (np.ndarray of shape (L, 8))
        """
        L, F = sequence.shape
        h = np.zeros(8)
        c = np.zeros(8)
        hidden_history = []

        for t in range(L):
            xt = sequence[t]
            # LSTM cell calculations
            gates = np.dot(self.lstm_w_ih, xt) + np.dot(self.lstm_w_hh, h) + self.lstm_b
            
            # Split into input, forget, cell, output gates
            i = self._sigmoid(gates[0:8])
            f = self._sigmoid(gates[8:16])
            g = np.tanh(gates[16:24])
            o = self._sigmoid(gates[24:32])
            
            c = f * c + i * g
            h = o * np.tanh(c)
            hidden_history.append(h.copy())

        hidden_history = np.array(hidden_history)
        out = self._sigmoid(np.dot(h, self.lstm_w_out) + self.lstm_b_out)
        return float(out[0]), hidden_history

    def run_autoencoder(self, features: np.ndarray) -> Tuple[float, float]:
        """
        Autoencoder unsupervised anomaly detection.
        Reconstructs input features. High reconstruction error indicates an anomaly.
        Input features shape: (5,)
        Returns:
            reconstruction_error (float)
            autoencoder_score (float) - reconstruction error normalized to [0, 1]
        """
        # Encoder
        latent = np.tanh(np.dot(features, self.ae_w_enc) + self.ae_b_enc)
        # Decoder
        reconstructed = np.dot(latent, self.ae_w_dec) + self.ae_b_dec
        
        # Calculate MSE reconstruction error
        error = float(np.mean((features - reconstructed) ** 2))
        
        # Normalize error to a score between 0 and 1 (using a soft-limit threshold)
        ae_score = 1.0 - np.exp(-error * 5.0)
        return error, ae_score

    def run_gnn(self, user_id: str, merchant_id: str, graph: nx.DiGraph) -> Tuple[float, List[List[str]]]:
        """
        Graph Neural Network node and relationship checker.
        Analyzes cyclic money transfers (e.g. ACC_A -> ACC_B -> ACC_C -> ACC_A) and high-density fraud rings.
        Returns:
            gnn_score (float)
            cycles_detected (list of paths)
        """
        # Find paths and loops containing the user or merchant in the graph
        gnn_score = 0.0
        suspicious_cycles = []
        
        if not graph.has_node(user_id):
            return 0.0, []

        # Find cycles containing user_id
        try:
            cycles = list(nx.simple_cycles(graph))
            for cycle in cycles:
                if user_id in cycle:
                    suspicious_cycles.append(cycle)
        except Exception:
            pass
        
        # Calculate score based on node degree and local cycle connectivity
        in_degree = graph.in_degree(user_id) if graph.has_node(user_id) else 0
        out_degree = graph.out_degree(user_id) if graph.has_node(user_id) else 0
        
        # High number of outgoing transactions to unique devices or accounts increases score
        degree_anomaly = min(1.0, (in_degree + out_degree) / 20.0)
        
        if len(suspicious_cycles) > 0:
            gnn_score = 0.85 + 0.15 * min(1.0, len(suspicious_cycles) / 5.0)
        else:
            gnn_score = degree_anomaly * 0.4
            
        return float(gnn_score), suspicious_cycles

    def run_transformer(self, hidden_states: np.ndarray) -> Tuple[float, np.ndarray]:
        """
        Transformer Attention.
        Takes sequential hidden states from LSTM (L, 8) and performs Self-Attention.
        Returns:
            transformer_score (float)
            attention_matrix (np.ndarray of shape (L, L))
        """
        L, D = hidden_states.shape
        if L == 0:
            return 0.0, np.zeros((1, 1))

        # Project Q, K, V
        Q = np.dot(hidden_states, self.trans_w_q) # (L, 8)
        K = np.dot(hidden_states, self.trans_w_k) # (L, 8)
        V = np.dot(hidden_states, self.trans_w_v) # (L, 8)

        # Scaled dot-product attention
        scores = np.dot(Q, K.T) / np.sqrt(D) # (L, L)
        # Softmax over rows
        exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        attention_matrix = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)

        # Context representation
        context = np.dot(attention_matrix, V) # (L, 8)
        
        # Pool (mean) and output classification
        pooled = np.mean(context, axis=0)
        score = self._sigmoid(np.dot(pooled, self.trans_w_out))[0]
        
        return float(score), attention_matrix

    def evaluate_transaction(self, 
                             tx: Dict[str, Any], 
                             history: List[Dict[str, Any]], 
                             graph: nx.DiGraph,
                             config_threshold: float = 0.5) -> Dict[str, Any]:
        """
        Evaluate full transaction risk.
        Returns an ensemble risk score and individual model subscores.
        """
        # 1. Feature Preprocessing
        amount = float(tx.get("amount", 0))
        # Amount feature scaling
        amount_scaled = min(1.0, np.log1p(amount) / np.log1p(100000))
        
        # Location anomaly
        loc_anomaly = float(tx.get("location_anomaly", 0))
        # Device anomaly
        dev_anomaly = float(tx.get("device_anomaly", 0))
        
        # Merchant risk index
        m_risk = float(tx.get("merchant_risk", 0.1))
        
        # Velocity
        velocity = float(tx.get("velocity", 0.0))
        vel_scaled = min(1.0, velocity / 10.0)
        
        # Timestamp hour extraction
        import datetime
        dt = datetime.datetime.fromtimestamp(tx.get("timestamp", datetime.datetime.now().timestamp()))
        hour = dt.hour
        hour_sin = np.sin(2 * np.pi * hour / 24.0)
        hour_cos = np.cos(2 * np.pi * hour / 24.0)
        
        # Type code map
        t_type = tx.get("transaction_type", "UPI")
        type_risk_map = {"UPI": 0.5, "Credit Card": 0.6, "Debit Card": 0.3, "Wire Transfer": 0.7}
        type_code = type_risk_map.get(t_type, 0.4)

        # 2. Run DNN
        dnn_features = np.array([amount_scaled, loc_anomaly, dev_anomaly, m_risk, vel_scaled, hour_sin, hour_cos])
        dnn_score = self.run_dnn(dnn_features)

        # 3. Run Autoencoder
        ae_features = np.array([amount_scaled, hour_sin, hour_cos, m_risk, type_code])
        ae_error, ae_score = self.run_autoencoder(ae_features)

        # 4. Sequence Generation for LSTM and Transformer
        # Compile last 5 transactions
        seq_list = []
        # Add historical transactions (up to 4)
        for h_tx in history[-4:]:
            h_amt = float(h_tx.get("amount", 0))
            h_amt_scaled = min(1.0, np.log1p(h_amt) / np.log1p(100000))
            h_time_diff = float(h_tx.get("time_delta", 0.0))
            h_td_scaled = min(1.0, h_time_diff / 3600.0) # Scaled to hours
            h_loc = float(h_tx.get("location_anomaly", 0))
            h_dev = float(h_tx.get("device_anomaly", 0))
            h_merch = float(h_tx.get("merchant_risk", 0.1))
            seq_list.append([h_amt_scaled, h_td_scaled, h_loc, h_dev, h_merch])
        
        # Add current transaction to sequence
        # For current transaction, compute time delta from last
        time_diff = 0.0
        if len(history) > 0:
            time_diff = tx.get("timestamp", 0) - history[-1].get("timestamp", 0)
        td_scaled = min(1.0, time_diff / 3600.0)
        seq_list.append([amount_scaled, td_scaled, loc_anomaly, dev_anomaly, m_risk])

        seq_array = np.array(seq_list)
        lstm_score, lstm_h = self.run_lstm(seq_array)

        # 5. Run Transformer
        transformer_score, attn_matrix = self.run_transformer(lstm_h)

        # 6. Run GNN
        gnn_score, cycles = self.run_gnn(tx.get("user_id"), tx.get("merchant_id"), graph)

        # 7. Ensemble Calculation (weighted average)
        # DNN = 0.25, LSTM = 0.25, Autoencoder = 0.15, GNN = 0.20, Transformer = 0.15
        weighted_score = (
            dnn_score * 0.25 +
            lstm_score * 0.25 +
            ae_score * 0.15 +
            gnn_score * 0.20 +
            transformer_score * 0.15
        )
        
        # Check rule override (e.g. extreme values or GNN confirmed cycle)
        if len(cycles) > 0:
            # Graph cyclic ring detected -> elevated fraud risk automatically
            weighted_score = max(weighted_score, 0.96)
        if amount > 80000 and (loc_anomaly > 0.8 or dev_anomaly > 0.8):
            # Out of pattern high value transaction
            weighted_score = max(weighted_score, 0.90)

        risk_level = "Low"
        if weighted_score >= config_threshold:
            risk_level = "High" if weighted_score >= 0.85 else "Medium"
        elif weighted_score >= config_threshold * 0.6:
            risk_level = "Medium"

        return {
            "fraud_score": float(weighted_score),
            "risk_level": risk_level,
            "prediction": "Fraudulent" if weighted_score >= config_threshold else "Legitimate",
            "model_scores": {
                "dnn": float(dnn_score),
                "lstm": float(lstm_score),
                "autoencoder": float(ae_score),
                "gnn": float(gnn_score),
                "transformer": float(transformer_score)
            },
            "ae_error": float(ae_error),
            "attention_weights": attn_matrix.tolist(),
            "cycles_detected": cycles,
            "features_evaluated": {
                "amount": amount,
                "location_anomaly": loc_anomaly,
                "device_anomaly": dev_anomaly,
                "merchant_risk": m_risk,
                "velocity": velocity,
                "hour_sin": float(hour_sin),
                "hour_cos": float(hour_cos)
            }
        }
