import json
import time
from datetime import datetime
import networkx as nx
from typing import List, Dict, Any, Optional
from backend.utils.helpers import get_db_connection, logger, init_db
from backend.utils.data_gen import generate_synthetic_data
from backend.models.neural_engine import NeuralFraudEngine
from backend.models.explainer import ShapleyExplainer

class TransactionService:
    def __init__(self):
        # Make sure database is initialized
        init_db()
        self.engine = NeuralFraudEngine()
        self.explainer = ShapleyExplainer()
        self.gnn_graph = nx.DiGraph()
        
        # Load GNN graph and seed transactions if database is empty
        self._seed_if_empty()
        self.seed_escrow_simulations()
        self._build_gnn_graph()

    def _seed_if_empty(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM transactions")
        count = cursor.fetchone()[0]
        
        if count == 0:
            logger.info("Database is empty. Seeding synthetic transaction data...")
            data = generate_synthetic_data(num_users=30)
            
            # Insert users
            for u in data["users"]:
                cursor.execute(
                    "INSERT OR IGNORE INTO bank_users VALUES (?, ?, ?, ?, ?)",
                    (u["user_id"], u["name"], u["home_location"], u["home_device"], u["average_amount"])
                )
            
            # Insert merchants
            for m in data["merchants"]:
                cursor.execute(
                    "INSERT OR IGNORE INTO merchants VALUES (?, ?, ?, ?)",
                    (m["merchant_id"], m["name"], m["category"], m["risk"])
                )
                
            # Populate transactions with generated/pre-scored values
            for tx in data["transactions"]:
                # Fetch history for scoring
                hist = self._get_user_history_from_db(tx["user_id"], tx["timestamp"])
                
                # Retrieve threshold
                cursor.execute("SELECT value FROM system_config WHERE key = 'fraud_threshold'")
                threshold = float(cursor.fetchone()[0])

                # Score
                res = self.engine.evaluate_transaction(tx, hist, self.gnn_graph, config_threshold=threshold)
                
                # Shapley explanation
                def model_predict_fn(f_dict):
                    # Wraps evaluation using partial feature values
                    eval_tx = tx.copy()
                    eval_tx.update(f_dict)
                    r = self.engine.evaluate_transaction(eval_tx, hist, self.gnn_graph, config_threshold=threshold)
                    return r["fraud_score"]
                
                ex_res = self.explainer.explain(tx, model_predict_fn)
                
                # Check GNN update
                if tx["merchant_category"] == "Transfer":
                    self.gnn_graph.add_edge(tx["user_id"], tx["merchant_id"], amount=tx["amount"])
                else:
                    self.gnn_graph.add_node(tx["user_id"])
                    self.gnn_graph.add_node(tx["merchant_id"])

                # Insert transaction with scored values
                cursor.execute("""
                INSERT INTO transactions VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    tx["transaction_id"], tx["user_id"], tx["merchant_id"], tx["merchant_name"], 
                    tx["merchant_category"], tx["amount"], tx["location"], tx["location_anomaly"], 
                    tx["device_id"], tx["device_anomaly"], tx["transaction_type"], tx["timestamp"], 
                    tx["velocity"], tx["status"], tx["label"], 1 if tx["escalated"] else 0,
                    res["fraud_score"], res["model_scores"]["dnn"], res["model_scores"]["lstm"], 
                    res["model_scores"]["autoencoder"], res["model_scores"]["gnn"], 
                    res["model_scores"]["transformer"], json.dumps(ex_res["explanations"]),
                    None, None, None, None
                ))
            conn.commit()
            logger.info("Successfully seeded database.")
        conn.close()

    def _build_gnn_graph(self):
        """Constructs GNN networkx directed graph representing peer transfer loops."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, merchant_id, amount, merchant_category FROM transactions")
        rows = cursor.fetchall()
        for r in rows:
            if r["merchant_category"] == "Transfer":
                self.gnn_graph.add_edge(r["user_id"], r["merchant_id"], amount=r["amount"])
            else:
                self.gnn_graph.add_node(r["user_id"])
                self.gnn_graph.add_node(r["merchant_id"])
        conn.close()
        logger.info(f"Built GNN Graph: {self.gnn_graph.number_of_nodes()} nodes, {self.gnn_graph.number_of_edges()} edges.")

    def _get_user_history_from_db(self, user_id: str, before_timestamp: float) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT amount, timestamp, location_anomaly, device_anomaly, merchant_category 
            FROM transactions 
            WHERE user_id = ? AND timestamp < ? 
            ORDER BY timestamp DESC LIMIT 4
        """, (user_id, before_timestamp))
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for r in reversed(rows):
            # Compute logical time delta (in seconds)
            history.append({
                "amount": r["amount"],
                "timestamp": r["timestamp"],
                "time_delta": before_timestamp - r["timestamp"],
                "location_anomaly": r["location_anomaly"],
                "device_anomaly": r["device_anomaly"],
                "merchant_risk": 0.8 if r["merchant_category"] in ["Electronics", "Transfer"] else 0.1
            })
        return history

    def ingest_and_score(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receives new transaction, validates features, scores via Neural Engine,
        computes SHAP value explanations, and stores results in SQLite.
        """
        user_id = tx.get("user_id")
        merchant_id = tx.get("merchant_id", "MERCH_GEN")
        
        # 1. Fill missing details from database or seed
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch user
        cursor.execute("SELECT * FROM bank_users WHERE user_id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            # Create user dynamically
            cursor.execute(
                "INSERT INTO bank_users VALUES (?, ?, ?, ?, ?)",
                (user_id, f"User {user_id}", tx.get("location", "Bangalore"), tx.get("device_id", "DEV_GEN"), tx.get("amount", 1000.0))
            )
            user_row = {"home_location": tx.get("location", "Bangalore"), "home_device": tx.get("device_id", "DEV_GEN")}
        
        # Fetch merchant risk
        cursor.execute("SELECT risk, category, name FROM merchants WHERE merchant_id = ?", (merchant_id,))
        m_row = cursor.fetchone()
        if not m_row:
            # Create merchant dynamically
            merchant_category = tx.get("merchant_category", "Groceries")
            m_risk = 0.8 if merchant_category in ["Transfer", "Electronics"] else 0.1
            m_name = tx.get("merchant_name", f"Merchant {merchant_id}")
            cursor.execute(
                "INSERT INTO merchants VALUES (?, ?, ?, ?)",
                (merchant_id, m_name, merchant_category, m_risk)
            )
            m_row = {"risk": m_risk, "category": merchant_category, "name": m_name}
            
        # Get threshold
        cursor.execute("SELECT value FROM system_config WHERE key = 'fraud_threshold'")
        threshold = float(cursor.fetchone()[0])
        cursor.execute("SELECT value FROM system_config WHERE key = 'auto_decline_threshold'")
        decline_threshold = float(cursor.fetchone()[0])
        
        # Calculate dynamic velocity (transactions in last hour)
        now_ts = tx.get("timestamp", time.time())
        one_hour_ago = now_ts - 3600
        cursor.execute(
            "SELECT COUNT(*) FROM transactions WHERE user_id = ? AND timestamp BETWEEN ? AND ?",
            (user_id, one_hour_ago, now_ts)
        )
        velocity = float(cursor.fetchone()[0]) + 1.0 # Include current
        
        # Populate derived features
        tx["velocity"] = velocity
        tx["merchant_risk"] = m_row["risk"]
        tx["merchant_category"] = m_row["category"]
        tx["merchant_name"] = m_row["name"]
        
        # Evaluate anomaly status
        tx["location_anomaly"] = 1.0 if tx.get("location") != user_row["home_location"] else 0.0
        tx["device_anomaly"] = 0.0  # Device check disabled; login/transact from all devices allowed

        # Score
        hist = self._get_user_history_from_db(user_id, now_ts)
        res = self.engine.evaluate_transaction(tx, hist, self.gnn_graph, config_threshold=threshold)
        
        # Shapley Explainability
        def model_predict_fn(f_dict):
            eval_tx = tx.copy()
            eval_tx.update(f_dict)
            r = self.engine.evaluate_transaction(eval_tx, hist, self.gnn_graph, config_threshold=threshold)
            return r["fraud_score"]
            
        ex_res = self.explainer.explain(tx, model_predict_fn)
        
        # Decide status based on threshold configurations
        fraud_score = res["fraud_score"]
        hold_expires = None
        verification_method = None
        verification_status = None
        verification_score = None

        if fraud_score >= threshold:
            status = "Hold"
            label = "Unresolved"
            hold_expires = now_ts + 1200
            verification_method = "Face ID" if (tx.get("amount", 0) >= 30000 or tx.get("merchant_category") == "Transfer") else "OTP"
            verification_status = "Pending"
        else:
            status = "Approved"
            label = "Legitimate"

        # Update GNN Graph if transfer
        if tx["merchant_category"] == "Transfer":
            self.gnn_graph.add_edge(user_id, merchant_id, amount=tx["amount"])
        else:
            self.gnn_graph.add_node(user_id)
            self.gnn_graph.add_node(merchant_id)

        tx_id = tx.get("transaction_id", f"TX{int(time.time()*1000) % 1000000:06d}")
        
        cursor.execute("""
        INSERT INTO transactions VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tx_id, user_id, merchant_id, tx["merchant_name"], tx["merchant_category"], 
            tx["amount"], tx["location"], tx["location_anomaly"], tx["device_id"], 
            tx["device_anomaly"], tx["transaction_type"], now_ts, velocity, status, label, 0,
            fraud_score, res["model_scores"]["dnn"], res["model_scores"]["lstm"], 
            res["model_scores"]["autoencoder"], res["model_scores"]["gnn"], 
            res["model_scores"]["transformer"], json.dumps(ex_res["explanations"]),
            hold_expires, verification_method, verification_status, verification_score
        ))
        conn.commit()
        conn.close()

        # Combine results
        return {
            "transaction_id": tx_id,
            "fraud_score": fraud_score,
            "risk_level": res["risk_level"],
            "prediction": res["prediction"],
            "status": status,
            "label": label,
            "model_scores": res["model_scores"],
            "shapley": ex_res,
            "attention_weights": res["attention_weights"],
            "hold_expires": hold_expires,
            "verification_method": verification_method,
            "verification_status": verification_status
        }

    def _check_and_expire_holds(self):
        """Checks for active holds that have expired and automatically updates them to Declined/Unverified."""
        now = time.time()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Select active holds that have expired
        cursor.execute("SELECT transaction_id FROM transactions WHERE status = 'Hold' AND hold_expires < ?", (now,))
        expired_rows = cursor.fetchall()
        
        for r in expired_rows:
            tx_id = r["transaction_id"]
            logger.info(f"Auto-expiring hold for transaction {tx_id}...")
            cursor.execute("""
                UPDATE transactions 
                SET status = 'Declined', label = 'Fraudulent', verification_status = 'Unverified', fraud_score = 0.99
                WHERE transaction_id = ?
            """, (tx_id,))
            
            # Log analyst feedback automatically
            cursor.execute("""
                INSERT INTO analyst_feedback (transaction_id, username, original_score, action_taken, comments, timestamp)
                VALUES (?, 'System', 0.85, 'Confirm Fraud', 'Hold expired after 20 minutes without customer verification.', ?)
            """, (tx_id, now))
            
            # Write audit log directly on same connection
            cursor.execute(
                "INSERT INTO audit_logs (timestamp, username, action, details) VALUES (?, ?, ?, ?)",
                (datetime.now().isoformat(), "System", "AUTO_EXPIRE_HOLD", f"Transaction {tx_id} hold expired. Blocked transaction.")
            )
            
        if expired_rows:
            conn.commit()
        conn.close()

    def get_transactions_list(self, 
                              limit: int = 50, 
                              offset: int = 0, 
                              user_id: Optional[str] = None,
                              risk_level: Optional[str] = None,
                              status: Optional[str] = None) -> Dict[str, Any]:
        self._check_and_expire_holds()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM transactions WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        if status:
            query += " AND status = ?"
            params.append(status)
        if risk_level:
            if risk_level == "High":
                query += " AND fraud_score >= 0.85"
            elif risk_level == "Medium":
                query += " AND fraud_score >= 0.40 AND fraud_score < 0.85"
            else:
                query += " AND fraud_score < 0.40"
                
        # Count total
        count_query = query.replace("SELECT * FROM transactions", "SELECT COUNT(*) FROM transactions")
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        if limit is not None and limit >= 0:
            query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
        else:
            query += " ORDER BY timestamp DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        conn.close()
        
        txs = []
        for r in rows:
            txs.append(dict(r))
        return {"total": total, "transactions": txs}

    def get_queue(self) -> List[Dict[str, Any]]:
        """Returns transactions that are flagged as 'Pending' or 'Hold' for investigator review."""
        self._check_and_expire_holds()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE status IN ('Pending', 'Hold') AND label = 'Unresolved' ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def submit_feedback(self, tx_id: str, action: str, username: str, comments: str) -> bool:
        """
        Saves analyst resolution feedback, updates transaction state, 
        supporting continuous model feedback.
        """
        tx_id = tx_id.upper()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch current record
        cursor.execute("SELECT fraud_score, label FROM transactions WHERE transaction_id = ?", (tx_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
            
        original_score = row["fraud_score"]
        
        # Decide new status and label based on action
        if action == "Confirm Fraud":
            status = "Declined"
            label = "Fraudulent"
            escalated = 0
        elif action == "Dismiss Alert":
            status = "Approved"
            label = "Legitimate"
            escalated = 0
        elif action == "Escalate":
            status = "Pending"
            label = "Unresolved"
            escalated = 1
        else:
            conn.close()
            return False
            
        # Update transaction
        cursor.execute(
            "UPDATE transactions SET status = ?, label = ?, escalated = ? WHERE transaction_id = ?",
            (status, label, escalated, tx_id)
        )
        
        # Insert feedback
        cursor.execute("""
            INSERT INTO analyst_feedback (transaction_id, username, original_score, action_taken, comments, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tx_id, username, original_score, action, comments, time.time()))
        
        conn.commit()
        conn.close()
        return True

    def get_monitored_escrows(self) -> List[Dict[str, Any]]:
        """
        Retrieves all transactions marked as 'Fraudulent' or status is 'Declined' or 'Reverted'
        within a 12-hour window. Scans the database to see if the receiver has transferred
        funds out to another merchant (next hop).
        """
        self._check_and_expire_holds()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 12 hours ago
        twelve_hours_ago = time.time() - 43200
        
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE (label = 'Fraudulent' OR status = 'Declined' OR status = 'Reverted') 
              AND timestamp >= ?
            ORDER BY timestamp DESC
        """, (twelve_hours_ago,))
        
        rows = cursor.fetchall()
        
        escrows = []
        for r in rows:
            tx = dict(r)
            elapsed = time.time() - tx["timestamp"]
            time_remaining = max(0.0, 43200.0 - elapsed)
            
            # Find subsequent transaction from the receiver (merchant_id)
            cursor.execute("""
                SELECT transaction_id, merchant_name, amount, timestamp 
                FROM transactions 
                WHERE user_id = ? AND timestamp > ? 
                ORDER BY timestamp ASC LIMIT 1
            """, (tx["merchant_id"], tx["timestamp"]))
            
            hop_row = cursor.fetchone()
            next_hop = None
            if hop_row:
                next_hop = {
                    "transaction_id": hop_row["transaction_id"],
                    "recipient_name": hop_row["merchant_name"],
                    "amount": round(hop_row["amount"], 2),
                    "timestamp": hop_row["timestamp"],
                    "time_delta_mins": round((hop_row["timestamp"] - tx["timestamp"]) / 60.0, 1)
                }
                
            escrows.append({
                "original_tx": {
                    "transaction_id": tx["transaction_id"],
                    "user_id": tx["user_id"],
                    "merchant_id": tx["merchant_id"],
                    "merchant_name": tx["merchant_name"],
                    "amount": round(tx["amount"], 2),
                    "timestamp": tx["timestamp"],
                    "status": tx["status"]
                },
                "elapsed_seconds": round(elapsed, 0),
                "time_remaining_seconds": round(time_remaining, 0),
                "next_hop": next_hop,
                "status": "Reverted" if tx["status"] == "Reverted" else ("Moved" if next_hop else "Monitored")
            })
            
        conn.close()
        return escrows

    def revert_transaction(self, tx_id: str, username: str) -> bool:
        """
        Reverts a transaction by updating its status to 'Reverted' in the database
        and writing an audit log.
        """
        tx_id = tx_id.upper()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if transaction exists
        cursor.execute("SELECT amount, user_id, status FROM transactions WHERE transaction_id = ?", (tx_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
            
        if row["status"] == "Reverted":
            conn.close()
            return True
            
        # Update transaction status to Reverted
        cursor.execute("UPDATE transactions SET status = 'Reverted' WHERE transaction_id = ?", (tx_id,))
        
        # Log resolution in analyst_feedback
        cursor.execute("""
            INSERT INTO analyst_feedback (transaction_id, username, original_score, action_taken, comments, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tx_id, username, 0.99, "Dismiss Alert", "Funds reverted back to sender by admin/investigator.", time.time()))
        
        conn.commit()
        conn.close()
        
        # Write audit log
        from backend.utils.helpers import write_audit_log
        write_audit_log(username, "REVERT_FUNDS", f"Reverted transaction {tx_id} of amount ₹{row['amount']} back to user {row['user_id']}.")
        
        return True

    def report_scam(self, tx_id: str, username: str) -> bool:
        """
        Reports a transaction as a scam (marks it as Fraudulent/Declined to start the escrow).
        """
        tx_id = tx_id.upper()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if transaction exists
        cursor.execute("SELECT status FROM transactions WHERE transaction_id = ?", (tx_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
            
        # Update status and label
        cursor.execute(
            "UPDATE transactions SET status = 'Declined', label = 'Fraudulent', fraud_score = 0.95 WHERE transaction_id = ?",
            (tx_id,)
        )
        
        # Insert feedback
        cursor.execute("""
            INSERT INTO analyst_feedback (transaction_id, username, original_score, action_taken, comments, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tx_id, username, 0.5, "Confirm Fraud", "User reported this transaction as a scam.", time.time()))
        
        conn.commit()
        conn.close()
        
        # Write audit log
        from backend.utils.helpers import write_audit_log
        write_audit_log(username, "REPORT_SCAM", f"User reported scam on transaction {tx_id}. Placed under 12-hour fund escrow.")
        
        return True

    def seed_escrow_simulations(self):
        """Seeds simulation cases for the Escrow Monitor and Hold System if not already present."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if our seeded cases exist
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE transaction_id IN ('TX_ESCROW_SECURE', 'TX_ESCROW_MOVED', 'TX_HOLD_FACE', 'TX_HOLD_OTP')")
        count = cursor.fetchone()[0]
        
        if count < 4:
            logger.info("Seeding simulation cases...")
            now = time.time()
            
            # Case 1: Secured Escrow (No next-hop transfers)
            cursor.execute("INSERT OR IGNORE INTO bank_users VALUES ('ACC_VICTIM_1', 'Ramesh Chandra', 'Delhi', 'DEV_MOTO_G', 15000.0)")
            cursor.execute("INSERT OR IGNORE INTO merchants VALUES ('MERCH_SCAMMER_1', 'Fake Electricity Board', 'Transfer', 0.95)")
            cursor.execute("""
                INSERT OR REPLACE INTO transactions VALUES 
                ('TX_ESCROW_SECURE', 'ACC_VICTIM_1', 'MERCH_SCAMMER_1', 'Fake Electricity Board', 'Transfer', 
                42000.0, 'Delhi', 0.0, 'DEV_MOTO_G', 0.0, 'UPI', ?, 1.0, 'Declined', 'Fraudulent', 0,
                0.95, 0.92, 0.94, 0.85, 0.98, 0.90, '["Spike in transaction amount to new transfer recipient"]',
                NULL, NULL, NULL, NULL)
            """, (now - 7200,))
            
            # Case 2: Moved Funds Escrow
            cursor.execute("INSERT OR IGNORE INTO bank_users VALUES ('ACC_VICTIM_2', 'Sunita Rao', 'Mumbai', 'DEV_IPHONE_14', 8000.0)")
            cursor.execute("INSERT OR IGNORE INTO bank_users VALUES ('MERCH_SCAMMER_2', 'Mule Account #8892', 'Transfer', 'DEV_MULE_PC', 50000.0)")
            cursor.execute("INSERT OR IGNORE INTO merchants VALUES ('MERCH_SCAMMER_2', 'Mule Account #8892', 'Transfer', 0.95)")
            cursor.execute("INSERT OR IGNORE INTO merchants VALUES ('MERCH_CASHOUT_3', 'Crypto Exchange P2P', 'Transfer', 0.98)")
            
            # Original scam transaction
            cursor.execute("""
                INSERT OR REPLACE INTO transactions VALUES 
                ('TX_ESCROW_MOVED', 'ACC_VICTIM_2', 'MERCH_SCAMMER_2', 'Mule Account #8892', 'Transfer', 
                75000.0, 'Mumbai', 0.0, 'DEV_IPHONE_14', 0.0, 'UPI', ?, 1.0, 'Declined', 'Fraudulent', 0,
                0.98, 0.96, 0.95, 0.90, 0.99, 0.93, '["Entity identified in known mule cycle ring"]',
                NULL, NULL, NULL, NULL)
            """, (now - 28800,))
            
            # Subsequent transfer from scammer to third party (moved funds!)
            cursor.execute("""
                INSERT OR REPLACE INTO transactions VALUES 
                ('TX_ESCROW_HOP_2', 'MERCH_SCAMMER_2', 'MERCH_CASHOUT_3', 'Crypto Exchange P2P', 'Transfer', 
                72000.0, 'Kolkata', 1.0, 'DEV_MULE_PC', 0.0, 'UPI', ?, 2.0, 'Approved', 'Legitimate', 0,
                0.35, 0.30, 0.25, 0.20, 0.40, 0.30, '["Standard transfer out"]',
                NULL, NULL, NULL, NULL)
            """, (now - 21600,))

            # Case 3: Face Verification Hold Simulation (12 minutes left)
            cursor.execute("""
                INSERT OR REPLACE INTO transactions VALUES 
                ('TX_HOLD_FACE', 'ACC_VICTIM_1', 'MERCH_SCAMMER_1', 'Fake Electricity Board', 'Transfer', 
                65000.0, 'Delhi', 0.0, 'DEV_MOTO_G', 0.0, 'UPI', ?, 1.0, 'Hold', 'Unresolved', 0,
                0.92, 0.90, 0.88, 0.82, 0.94, 0.86, '["High amount transfer flagged for face authentication"]',
                ?, 'Face ID', 'Pending', NULL)
            """, (now - 480, now + 720))

            # Case 4: OTP Verification Hold Simulation (8 minutes left)
            cursor.execute("""
                INSERT OR REPLACE INTO transactions VALUES 
                ('TX_HOLD_OTP', 'ACC_VICTIM_2', 'MERCH_SCAMMER_2', 'Mule Account #8892', 'Transfer', 
                12000.0, 'Mumbai', 0.0, 'DEV_IPHONE_14', 0.0, 'UPI', ?, 1.0, 'Hold', 'Unresolved', 0,
                0.78, 0.75, 0.72, 0.65, 0.80, 0.70, '["MFA trigger for out of pattern transfer request"]',
                ?, 'OTP', 'Pending', NULL)
            """, (now - 720, now + 480))
            
            conn.commit()
            logger.info("Successfully seeded escrow monitor and hold simulations.")
            
        conn.close()

    def verify_transaction(self, tx_id: str, status: str, method: str, score: float, username: str) -> bool:
        """
        Processes adaptive hold verification from customer authentication (Face ID or OTP).
        Recalculates fraud score based on verification outcome.
        """
        tx_id = tx_id.upper()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if transaction exists
        cursor.execute("SELECT amount, user_id, status FROM transactions WHERE transaction_id = ?", (tx_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
            
        if status == "Verified":
            new_status = "Approved"
            new_label = "Legitimate"
            new_score = 0.35 # AI Recalculated risk: Approved
            comments = f"Customer successfully verified via {method}. Match score/delivery: {score}. Hold released."
        else: # Unverified
            new_status = "Declined"
            new_label = "Fraudulent"
            new_score = 0.99 # AI Recalculated risk: Blocked & Escalated
            comments = f"Customer verification failed via {method}. Match score/delivery: {score}. Hold blocked."
            
        cursor.execute("""
            UPDATE transactions 
            SET status = ?, label = ?, verification_status = ?, verification_method = ?, verification_score = ?, fraud_score = ?
            WHERE transaction_id = ?
        """, (new_status, new_label, status, method, score, new_score, tx_id))
        
        # Insert feedback
        cursor.execute("""
            INSERT INTO analyst_feedback (transaction_id, username, original_score, action_taken, comments, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tx_id, username, 0.85, "Confirm Fraud" if status != "Verified" else "Dismiss Alert", comments, time.time()))
        
        conn.commit()
        conn.close()
        
        # Write audit log
        from backend.utils.helpers import write_audit_log
        write_audit_log(username, f"TRANSACTION_VERIFICATION_{status.upper()}", f"Verified transaction {tx_id} ({method}) as {status}. Score: {score}. New risk score: {new_score * 100}%. Status: {new_status}")
        
        return True
