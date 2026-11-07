import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_synthetic_data(num_users: int = 30) -> Dict[str, Any]:
    """
    Generates users, merchants, devices, and a history of normal and fraudulent transactions.
    """
    categories = ["Groceries", "Dining", "Utilities", "Electronics", "Travel", "Entertainment", "Transfer"]
    locations = ["Bangalore", "Mumbai", "Delhi", "Chennai", "Kolkata", "Hyderabad", "Pune", "London", "New York"]
    devices = [f"DEV_{random.randint(1000, 9999)}" for _ in range(num_users * 2)]
    
    users = []
    for i in range(1, num_users + 1):
        uid = f"ACC{i:03d}"
        users.append({
            "user_id": uid,
            "name": f"User {uid}",
            "home_location": random.choice(locations[:7]), # Primary Indian cities
            "home_device": devices[i-1],
            "average_amount": random.choice([800.0, 1500.0, 4000.0, 12000.0]) # spending profiles
        })
        
    merchants = [
        {"merchant_id": f"MERCH{i:03d}", "name": f"Merchant {i:03d}", "category": random.choice(categories), "risk": 0.1}
        for i in range(1, 41)
    ]
    # Set high risk merchants
    for m in merchants:
        if m["category"] in ["Electronics", "Transfer"]:
            m["risk"] = random.uniform(0.6, 0.85)
        elif m["category"] in ["Travel", "Entertainment"]:
            m["risk"] = random.uniform(0.3, 0.5)

    transactions = []
    now = datetime.now()
    
    # 1. Generate Historical Safe Transactions (past 7 days)
    for user in users:
        uid = user["user_id"]
        # Generate 10-20 transactions per user
        num_tx = random.randint(10, 20)
        curr_time = now - timedelta(days=7)
        
        for _ in range(num_tx):
            # Advance time by some random hours
            curr_time += timedelta(hours=random.uniform(2, 18))
            if curr_time >= now - timedelta(hours=6):
                break
                
            amount = abs(random.normalvariate(user["average_amount"], user["average_amount"] * 0.3))
            amount = max(10.0, round(amount, 2))
            
            m = random.choice(merchants)
            
            transactions.append({
                "transaction_id": f"TX{len(transactions)+100000:06d}",
                "user_id": uid,
                "merchant_id": m["merchant_id"],
                "merchant_name": m["name"],
                "merchant_category": m["category"],
                "amount": amount,
                "location": user["home_location"],
                "location_anomaly": 0.0,
                "device_id": user["home_device"],
                "device_anomaly": 0.0,
                "transaction_type": "Credit Card" if amount > 5000 else random.choice(["UPI", "Debit Card"]),
                "timestamp": curr_time.timestamp(),
                "velocity": random.choice([1.0, 2.0]),
                "status": "Approved",
                "label": "Legitimate",
                "escalated": False
            })

    # 2. Inject Specific Fraud Scenario Transactions (Recent 6 hours)
    # Scenario A: Velocity Spike (Fast spending on high risk merchants)
    user_a = users[0]
    curr_time = now - timedelta(minutes=90)
    for i in range(5):
        curr_time += timedelta(minutes=random.randint(1, 4))
        transactions.append({
            "transaction_id": f"TX{len(transactions)+100000:06d}",
            "user_id": user_a["user_id"],
            "merchant_id": "MERCH001",
            "merchant_name": "E-Spend Electronics",
            "merchant_category": "Electronics",
            "amount": 25000.0 + i * 5000,
            "location": user_a["home_location"],
            "location_anomaly": 0.1,
            "device_id": user_a["home_device"],
            "device_anomaly": 0.0,
            "transaction_type": "UPI",
            "timestamp": curr_time.timestamp(),
            "velocity": float(i + 1),
            "status": "Pending",
            "label": "Unresolved",
            "escalated": False
        })
        
    # Scenario B: Geographic Hop (Location change within short time)
    user_b = users[1]
    curr_time_b1 = now - timedelta(minutes=45)
    curr_time_b2 = now - timedelta(minutes=35) # 10 mins later in London!
    
    # Normal transaction
    transactions.append({
        "transaction_id": f"TX{len(transactions)+100000:06d}",
        "user_id": user_b["user_id"],
        "merchant_id": "MERCH002",
        "merchant_name": "Bangalore Cafe",
        "merchant_category": "Dining",
        "amount": 450.0,
        "location": user_b["home_location"],
        "location_anomaly": 0.0,
        "device_id": user_b["home_device"],
        "device_anomaly": 0.0,
        "transaction_type": "UPI",
        "timestamp": curr_time_b1.timestamp(),
        "velocity": 1.0,
        "status": "Approved",
        "label": "Legitimate",
        "escalated": False
    })
    
    # Fraud hop
    transactions.append({
        "transaction_id": f"TX{len(transactions)+100000:06d}",
        "user_id": user_b["user_id"],
        "merchant_id": "MERCH003",
        "merchant_name": "London Luxury Boutique",
        "merchant_category": "Travel",
        "amount": 85000.0,
        "location": "London",
        "location_anomaly": 1.0, # Geographic Hop
        "device_id": "DEV_NEW_IP",
        "device_anomaly": 0.0,
        "transaction_type": "Credit Card",
        "timestamp": curr_time_b2.timestamp(),
        "velocity": 2.0,
        "status": "Pending",
        "label": "Unresolved",
        "escalated": False
    })

    # Scenario C: Account Takeover (New Device, high value transfers)
    user_c = users[2]
    curr_time_c = now - timedelta(minutes=15)
    transactions.append({
        "transaction_id": f"TX{len(transactions)+100000:06d}",
        "user_id": user_c["user_id"],
        "merchant_id": "MERCH004",
        "merchant_name": "Peer Transfer Wire",
        "merchant_category": "Transfer",
        "amount": 95000.0,
        "location": "New York",
        "location_anomaly": 1.0,
        "device_id": "DEV_UNRECOGNIZED_99",
        "device_anomaly": 0.0,
        "transaction_type": "Wire Transfer",
        "timestamp": curr_time_c.timestamp(),
        "velocity": 1.0,
        "status": "Pending",
        "label": "Unresolved",
        "escalated": False
    })

    # Scenario D: Circular Fraud Ring (Graph anomaly)
    # We create cycles in transactions: ACC004 -> ACC005 -> ACC006 -> ACC004
    user_d1 = users[3] # ACC004
    user_d2 = users[4] # ACC005
    user_d3 = users[5] # ACC006
    curr_time_d = now - timedelta(minutes=10)
    
    # 1. ACC004 transfers to ACC005
    transactions.append({
        "transaction_id": f"TX{len(transactions)+100000:06d}",
        "user_id": user_d1["user_id"],
        "merchant_id": user_d2["user_id"], # Send to ACC005
        "merchant_name": user_d2["name"],
        "merchant_category": "Transfer",
        "amount": 50000.0,
        "location": user_d1["home_location"],
        "location_anomaly": 0.0,
        "device_id": user_d1["home_device"],
        "device_anomaly": 0.0,
        "transaction_type": "UPI",
        "timestamp": (curr_time_d - timedelta(minutes=2)).timestamp(),
        "velocity": 1.0,
        "status": "Approved",
        "label": "Legitimate",
        "escalated": False
    })
    # 2. ACC005 transfers to ACC006
    transactions.append({
        "transaction_id": f"TX{len(transactions)+100000:06d}",
        "user_id": user_d2["user_id"],
        "merchant_id": user_d3["user_id"], # Send to ACC006
        "merchant_name": user_d3["name"],
        "merchant_category": "Transfer",
        "amount": 49900.0,
        "location": user_d2["home_location"],
        "location_anomaly": 0.0,
        "device_id": user_d2["home_device"],
        "device_anomaly": 0.0,
        "transaction_type": "UPI",
        "timestamp": (curr_time_d - timedelta(minutes=1)).timestamp(),
        "velocity": 1.0,
        "status": "Approved",
        "label": "Legitimate",
        "escalated": False
    })
    # 3. ACC006 transfers back to ACC004 (Completing cycle!)
    transactions.append({
        "transaction_id": f"TX{len(transactions)+100000:06d}",
        "user_id": user_d3["user_id"],
        "merchant_id": user_d1["user_id"], # Send to ACC004
        "merchant_name": user_d1["name"],
        "merchant_category": "Transfer",
        "amount": 49800.0,
        "location": user_d3["home_location"],
        "location_anomaly": 0.8,
        "device_id": user_d3["home_device"],
        "device_anomaly": 0.0,
        "transaction_type": "UPI",
        "timestamp": curr_time_d.timestamp(),
        "velocity": 2.0,
        "status": "Pending",
        "label": "Unresolved",
        "escalated": False
    })

    return {
        "users": users,
        "merchants": merchants,
        "transactions": transactions
    }
