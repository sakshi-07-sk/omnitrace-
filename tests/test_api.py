import unittest
import requests
import time
import subprocess
import os
import signal

class TestOmniTraceAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Starts backend FastAPI server as a local process for testing."""
        print("Starting FastAPI test server...")
        # Start server in workspace root
        cls.server_proc = subprocess.Popen(
            ["python", "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8005"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        # Give the server 25 seconds to spin up and seed if database is missing
        time.sleep(25)
        cls.base_url = "http://127.0.0.1:8005/api"

    @classmethod
    def tearDownClass(cls):
        """Terminates backend FastAPI test server."""
        print("Stopping FastAPI test server...")
        if cls.server_proc:
            cls.server_proc.terminate()
            cls.server_proc.wait()

    def test_01_healthz(self):
        """Verifies backend API service is online."""
        try:
            res = requests.get(f"{self.base_url}/healthz")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "healthy")
            self.assertEqual(data["service"], "OmniTrace Engine")
            print("[OK] API Health Check passed.")
        except Exception as e:
            self.fail(f"Health check request failed: {e}")

    def test_02_auth_login(self):
        """Verifies JWT login authentication and role checks."""
        # Test Investigator Login
        payload = {
            "username": "investigator@omnitrace.com",
            "password": "inv123"
        }
        res = requests.post(
            f"{self.base_url}/auth/login",
            data=payload  # Form URL encoded
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "Investigator")
        self.assertIn("access_token", data)
        self.token = data["access_token"]
        print("[OK] Authenticated Investigator role successfully.")

    def test_03_predict_legitimate(self):
        """Verifies a standard legitimate transaction gets a low fraud score."""
        payload = {
            "user_id": "ACC001",
            "merchant_id": "MERCH002",
            "amount": 450.0,
            "transaction_type": "UPI",
            "location": "Bangalore",
            "device_id": "DEV_1001"
        }
        
        # Warm up the connection/imports
        for _ in range(3):
            requests.post(f"{self.base_url}/transactions/predict", json=payload)
        
        latencies = []
        for _ in range(3):
            start = time.time()
            res = requests.post(f"{self.base_url}/transactions/predict", json=payload)
            latencies.append((time.time() - start) * 1000.0)
        
        latency = min(latencies)
        
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        # Verify latency is below 300ms
        self.assertLess(latency, 300.0, f"Latency of {latency:.2f}ms (from runs {latencies}) exceeded 300ms target.")
        self.assertLess(data["fraud_score"], 0.50)
        self.assertEqual(data["status"], "Approved")
        self.assertEqual(data["risk_level"], "Medium")
        print(f"[OK] Scored legitimate transaction in {latency:.2f}ms (Risk: {data['fraud_score']*100:.1f}%).")

    def test_04_predict_high_risk_shap(self):
        """Verifies location hop triggers high-risk classification and accurate SHAP attributions."""
        # Scenario: location changed to London (Hop) and amount is very high
        payload = {
            "user_id": "ACC001",
            "merchant_id": "MERCH003",
            "amount": 85000.0,
            "transaction_type": "Credit Card",
            "location": "London",
            "device_id": "DEV_NEW_IP"
        }
        
        res = requests.post(f"{self.base_url}/transactions/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertGreaterEqual(data["fraud_score"], 0.70)
        self.assertIn("shapley", data)
        
        shap = data["shapley"]
        base_val = shap["base_value"]
        pred_val = shap["prediction_value"]
        shap_vals = shap["shap_values"]
        
        # Verify Shapley Mathematical Completeness: sum of SHAP values + base value = final prediction value
        sum_shaps = sum(shap_vals.values())
        self.assertAlmostEqual(base_val + sum_shaps, pred_val, places=6)
        
        # Verify specific feature impact (location anomaly and amount should increase risk)
        self.assertGreater(shap_vals["location_anomaly"], 0.0)
        self.assertGreater(shap_vals["amount"], 0.0)
        
        print(f"[OK] Location anomaly flagged high risk: {data['fraud_score']*100:.1f}%.")
        print(f"[OK] Verified SHAP completeness: base({base_val:.4f}) + sum_shaps({sum_shaps:.4f}) = prediction({pred_val:.4f}).")

    def test_05_auth_register(self):
        """Verifies the new user registration API and subsequent login."""
        # Clean up database from previous run if any
        import sqlite3
        try:
            conn = sqlite3.connect("omnitrace.db")
            cursor = conn.cursor()
            cursor.execute("DELETE FROM auth_users WHERE username = ?", ("test_register_user@omnitrace.com",))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Warning: could not clean up test user from DB: {e}")

        # 1. Register a new user
        reg_payload = {
            "email": "test_register_user@omnitrace.com",
            "password": "testpassword123",
            "role": "Investigator",
            "full_name": "Test Investigator Account"
        }
        res = requests.post(f"{self.base_url}/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        print("[OK] Registered a new user successfully.")

        # 2. Check duplicate registration rejection
        res_dup = requests.post(f"{self.base_url}/auth/register", json=reg_payload)
        self.assertEqual(res_dup.status_code, 400)
        print("[OK] Duplicate email registration rejected.")

        # 3. Check invalid email format rejection
        reg_payload_invalid_email = reg_payload.copy()
        reg_payload_invalid_email["email"] = "invalid-email-format"
        res_invalid_email = requests.post(f"{self.base_url}/auth/register", json=reg_payload_invalid_email)
        self.assertEqual(res_invalid_email.status_code, 400)
        self.assertIn("Invalid email format", res_invalid_email.json()["detail"])
        print("[OK] Invalid email format registration rejected.")

        # 4. Check invalid role rejection
        reg_payload_invalid = reg_payload.copy()
        reg_payload_invalid["email"] = "test_invalid_role_user@omnitrace.com"
        reg_payload_invalid["role"] = "SuperUser"
        res_invalid = requests.post(f"{self.base_url}/auth/register", json=reg_payload_invalid)
        self.assertEqual(res_invalid.status_code, 400)
        print("[OK] Invalid role registration rejected.")

        # 5. Login with the newly created user
        login_payload = {
            "username": "test_register_user@omnitrace.com",
            "password": "testpassword123"
        }
        res_login = requests.post(f"{self.base_url}/auth/login", data=login_payload)
        self.assertEqual(res_login.status_code, 200)
        login_data = res_login.json()
        self.assertEqual(login_data["role"], "Investigator")
        self.assertEqual(login_data["full_name"], "Test Investigator Account")
        self.assertIn("access_token", login_data)
        
        # 6. Access /auth/me with the new JWT
        new_token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {new_token}"}
        res_me = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(res_me.status_code, 200)
        me_data = res_me.json()
        self.assertEqual(me_data["username"], "test_register_user@omnitrace.com")
        self.assertEqual(me_data["role"], "Investigator")
        self.assertEqual(me_data["full_name"], "Test Investigator Account")
        print("[OK] Successfully logged in and queried profile of registered user.")

    def test_06_admin_user_management(self):
        """Verifies admin user management APIs (list, delete, self-delete prevention)."""
        # 1. Login as Admin
        admin_login = {
            "username": "admin@omnitrace.com",
            "password": "admin123"
        }
        res_admin = requests.post(f"{self.base_url}/auth/login", data=admin_login)
        self.assertEqual(res_admin.status_code, 200)
        admin_token = res_admin.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Login as Investigator
        inv_login = {
            "username": "investigator@omnitrace.com",
            "password": "inv123"
        }
        res_inv = requests.post(f"{self.base_url}/auth/login", data=inv_login)
        self.assertEqual(res_inv.status_code, 200)
        inv_token = res_inv.json()["access_token"]
        inv_headers = {"Authorization": f"Bearer {inv_token}"}

        # 3. Retrieve users list as Investigator (should be 403 Forbidden)
        res_list_inv = requests.get(f"{self.base_url}/auth/users", headers=inv_headers)
        self.assertEqual(res_list_inv.status_code, 403)
        print("[OK] Access to list users denied to non-Admin role.")

        # 4. Retrieve users list as Admin (should be 200)
        res_list_admin = requests.get(f"{self.base_url}/auth/users", headers=admin_headers)
        self.assertEqual(res_list_admin.status_code, 200)
        users = res_list_admin.json()
        self.assertTrue(len(users) >= 2)
        emails = [u["username"] for u in users]
        self.assertIn("admin@omnitrace.com", emails)
        self.assertIn("investigator@omnitrace.com", emails)
        print(f"[OK] Admin listed {len(users)} users successfully.")

        # 5. Try self-deletion (should be 400 Bad Request)
        res_delete_self = requests.delete(f"{self.base_url}/auth/users/admin@omnitrace.com", headers=admin_headers)
        self.assertEqual(res_delete_self.status_code, 400)
        self.assertIn("Self-deletion is not permitted", res_delete_self.json()["detail"])
        print("[OK] Self-deletion prevention works.")

        # 6. Try deleting a non-existent user (should be 404 Not Found)
        res_delete_fake = requests.delete(f"{self.base_url}/auth/users/nonexistent@omnitrace.com", headers=admin_headers)
        self.assertEqual(res_delete_fake.status_code, 404)
        print("[OK] Non-existent user deletion returns 404.")

        # 7. Create a temporary user to delete
        temp_user = {
            "email": "temp_delete_user@omnitrace.com",
            "password": "temppassword123",
            "role": "Investigator",
            "full_name": "Temporary Investigator"
        }
        res_reg = requests.post(f"{self.base_url}/auth/register", json=temp_user)
        self.assertEqual(res_reg.status_code, 200)

        # Confirm user is in the list
        res_list_admin2 = requests.get(f"{self.base_url}/auth/users", headers=admin_headers)
        emails = [u["username"] for u in res_list_admin2.json()]
        self.assertIn("temp_delete_user@omnitrace.com", emails)

        # 8. Non-Admin tries deleting the user (should be 403 Forbidden)
        res_delete_inv = requests.delete(f"{self.base_url}/auth/users/temp_delete_user@omnitrace.com", headers=inv_headers)
        self.assertEqual(res_delete_inv.status_code, 403)
        print("[OK] Access to delete users denied to non-Admin role.")

        # 9. Admin deletes the user (should be 200)
        res_delete_admin = requests.delete(f"{self.base_url}/auth/users/temp_delete_user@omnitrace.com", headers=admin_headers)
        self.assertEqual(res_delete_admin.status_code, 200)
        print("[OK] Admin deleted user successfully.")

        # Confirm user is no longer in the list
        res_list_admin3 = requests.get(f"{self.base_url}/auth/users", headers=admin_headers)
        emails = [u["username"] for u in res_list_admin3.json()]
        self.assertNotIn("temp_delete_user@omnitrace.com", emails)
        print("[OK] Verified user is no longer present in DB.")

    def test_07_unbounded_user_history(self):
        """Verifies that requesting user transactions history with limit=-1 returns unbounded results."""
        # 1. Login as Admin
        admin_login = {
            "username": "admin@omnitrace.com",
            "password": "admin123"
        }
        res_admin = requests.post(f"{self.base_url}/auth/login", data=admin_login)
        self.assertEqual(res_admin.status_code, 200)
        admin_token = res_admin.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Get actual total in DB dynamically
        import sqlite3
        conn = sqlite3.connect("omnitrace.db")
        expected_count = conn.execute("SELECT COUNT(*) FROM transactions WHERE user_id = 'ACC001'").fetchone()[0]
        conn.close()

        # 2. Get history with default limit (50) for ACC001
        res_default = requests.get(f"{self.base_url}/transactions/history?limit=50&user_id=ACC001", headers=admin_headers)
        self.assertEqual(res_default.status_code, 200)
        txs_default = res_default.json()["transactions"]
        self.assertEqual(len(txs_default), min(50, expected_count))

        # 3. Get history with limit=-1 for ACC001 (unbounded)
        res_unbounded = requests.get(f"{self.base_url}/transactions/history?limit=-1&user_id=ACC001", headers=admin_headers)
        self.assertEqual(res_unbounded.status_code, 200)
        txs_unbounded = res_unbounded.json()["transactions"]

        self.assertEqual(len(txs_unbounded), expected_count)
        print(f"[OK] Unbounded user transaction history query returned {len(txs_unbounded)} transactions.")

if __name__ == "__main__":
    unittest.main()
