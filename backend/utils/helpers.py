import sqlite3
import hashlib
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure paths using environment variables
DB_PATH = os.environ.get("DB_PATH", "omnitrace.db")
LOG_PATH = os.environ.get("LOG_PATH", "omnitrace_system.log")

# Ensure directories for DB and logs exist
db_dir = os.path.dirname(DB_PATH)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

log_dir = os.path.dirname(LOG_PATH)
if log_dir:
    os.makedirs(log_dir, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_PATH)
    ]
)
logger = logging.getLogger("OmniTrace")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn

def hash_password(password: str) -> str:
    """Uses SHA256 with a static salt for robust, compile-free hashing."""
    salt = "omnitrace_secure_salt_9988"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def init_db():
    """Initializes all SQLite database tables and seeds initial data."""
    logger.info("Initializing SQLite Database...")
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Auth Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_users (
        username TEXT PRIMARY KEY,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL
    )
    """)

    # 2. Config table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # 3. Users profile table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bank_users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        home_location TEXT NOT NULL,
        home_device TEXT NOT NULL,
        average_amount REAL NOT NULL
    )
    """)

    # 4. Merchants table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS merchants (
        merchant_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        risk REAL NOT NULL
    )
    """)

    # 5. Transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        merchant_id TEXT NOT NULL,
        merchant_name TEXT NOT NULL,
        merchant_category TEXT NOT NULL,
        amount REAL NOT NULL,
        location TEXT NOT NULL,
        location_anomaly REAL NOT NULL,
        device_id TEXT NOT NULL,
        device_anomaly REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        timestamp REAL NOT NULL,
        velocity REAL NOT NULL,
        status TEXT NOT NULL,          -- 'Approved', 'Declined', 'Pending', 'Hold'
        label TEXT NOT NULL,           -- 'Legitimate', 'Fraudulent', 'Unresolved'
        escalated INTEGER DEFAULT 0,   -- 0 = No, 1 = Yes
        fraud_score REAL,
        dnn_score REAL,
        lstm_score REAL,
        autoencoder_score REAL,
        gnn_score REAL,
        transformer_score REAL,
        explanation TEXT,              -- JSON list of explanations
        hold_expires REAL,
        verification_method TEXT,
        verification_status TEXT,
        verification_score REAL
    )
    """)

    # 6. Audit logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL
    )
    """)

    # 7. Feedback Loop table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyst_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT NOT NULL,
        username TEXT NOT NULL,
        original_score REAL NOT NULL,
        action_taken TEXT NOT NULL,    -- 'Confirm Fraud', 'Dismiss Alert', 'Escalate'
        comments TEXT,
        timestamp REAL NOT NULL,
        FOREIGN KEY(transaction_id) REFERENCES transactions(transaction_id)
    )
    """)

    # Check for missing columns and run ALTER TABLE if necessary (migration)
    cursor.execute("PRAGMA table_info(transactions)")
    cols = [row[1] for row in cursor.fetchall()]
    new_cols = {
        "hold_expires": "REAL",
        "verification_method": "TEXT",
        "verification_status": "TEXT",
        "verification_score": "REAL"
    }
    for col_name, col_type in new_cols.items():
        if col_name not in cols:
            logger.info(f"Adding column {col_name} to transactions table...")
            cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col_name} {col_type}")

    # Seed Auth Users
    users_to_seed = [
        ("admin@omnitrace.com", hash_password("admin123"), "Admin", "Chief Risk Officer"),
        ("investigator@omnitrace.com", hash_password("inv123"), "Investigator", "Fraud Analyst Specialist"),
        ("sysadmin@omnitrace.com", hash_password("sys123"), "SysAdmin", "Systems Infrastructure Lead")
    ]
    cursor.executemany("INSERT OR IGNORE INTO auth_users VALUES (?, ?, ?, ?)", users_to_seed)

    # Seed Config
    config_to_seed = [
        ("fraud_threshold", "0.70"),
        ("auto_decline_threshold", "0.90"),
        ("lstm_sequence_length", "5")
    ]
    cursor.executemany("INSERT OR IGNORE INTO system_config VALUES (?, ?)", config_to_seed)

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully.")

def write_audit_log(username: str, action: str, details: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_logs (timestamp, username, action, details) VALUES (?, ?, ?, ?)",
            (datetime.now().isoformat(), username, action, details)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
