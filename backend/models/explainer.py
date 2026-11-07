import numpy as np
from typing import List, Dict, Any, Callable

class ShapleyExplainer:
    def __init__(self, baseline_tx: Dict[str, float] = None):
        # Baseline features of a completely normal/safe transaction
        self.baseline = baseline_tx or {
            "amount": 1000.0,
            "location_anomaly": 0.0,
            "device_anomaly": 0.0,
            "merchant_risk": 0.1,
            "velocity": 1.0
        }
        self.feature_names = ["amount", "location_anomaly", "device_anomaly", "merchant_risk", "velocity"]

    def _factorial(self, n: int) -> int:
        return 1 if n <= 1 else n * self._factorial(n - 1)

    def explain(self, 
                target_tx: Dict[str, Any], 
                model_fn: Callable[[Dict[str, Any]], float]) -> Dict[str, Any]:
        """
        Calculates exact Shapley values for the primary features using a baseline.
        The sum of Shapley values plus the baseline prediction will equal the final prediction score.
        """
        F = len(self.feature_names)
        shap_values = {name: 0.0 for name in self.feature_names}
        
        # Calculate baseline value (coalition of 0 active features)
        v_empty = model_fn(self.baseline)
        
        # Calculate full value (coalition of all active features)
        target_features = {
            "amount": float(target_tx.get("amount", 0)),
            "location_anomaly": float(target_tx.get("location_anomaly", 0)),
            "device_anomaly": float(target_tx.get("device_anomaly", 0)),
            "merchant_risk": float(target_tx.get("merchant_risk", 0.1)),
            "velocity": float(target_tx.get("velocity", 0.0))
        }
        v_full = model_fn(target_features)

        # For each feature, compute Shapley value
        for i, feat_name in enumerate(self.feature_names):
            # All features except feat_name
            other_feats = [f for f in self.feature_names if f != feat_name]
            num_others = len(other_feats)
            
            # Iterate through all coalitions of other features
            # (2^4 = 16 combinations)
            for mask in range(1 << num_others):
                # Build coalition S
                S = []
                for j in range(num_others):
                    if (mask & (1 << j)):
                        S.append(other_feats[j])
                
                # Size of S
                s = len(S)
                
                # Weight = s! * (F - s - 1)! / F!
                weight = (self._factorial(s) * self._factorial(F - s - 1)) / self._factorial(F)
                
                # v(S) -> Coalition features take target values, others take baseline values
                coalition_without = {}
                for f in self.feature_names:
                    if f in S:
                        coalition_without[f] = target_features[f]
                    else:
                        coalition_without[f] = self.baseline[f]
                v_S = model_fn(coalition_without)
                
                # v(S U {i}) -> Add the feature of interest
                coalition_with = coalition_without.copy()
                coalition_with[feat_name] = target_features[feat_name]
                v_S_plus_i = model_fn(coalition_with)
                
                # Marginal contribution
                marginal_contribution = v_S_plus_i - v_S
                
                # Add to Shapley value
                shap_values[feat_name] += weight * marginal_contribution
                
        # Generate readable risk justifications
        explanations = []
        if target_features["amount"] > 15000:
            explanations.append(f"High amount detected: INR {target_features['amount']:,.2f} exceeds standard risk baseline")
        if target_features["location_anomaly"] > 0.5:
            explanations.append(f"Geographic hop alert: Transaction location deviates from user profile (Shapley Impact: {shap_values['location_anomaly'] * 100:.1f}%)")
        if target_features["device_anomaly"] > 0.5:
            explanations.append("Device authenticity check: Signature mismatch or unfamiliar hardware fingerprint detected")
        if target_features["merchant_risk"] > 0.5:
            explanations.append(f"High-risk Merchant Category: Activity registered on high-risk MCC code ({target_tx.get('merchant_category', 'Wire Transfer')})")
        if target_features["velocity"] > 4:
            explanations.append(f"Velocity spike: {int(target_features['velocity'])} transactions processed in the last 60 minutes")
            
        if not explanations:
            explanations.append("Normal transaction parameters: Feature scores remain within normal statistical variance.")

        # Ensure prediction sum math matches
        sum_shaps = sum(shap_values.values())
        # Let's adjust values slightly if there is rounding error to guarantee sum_shaps + v_empty = v_full
        diff = v_full - (sum_shaps + v_empty)
        if abs(diff) > 1e-9:
            # Distribute error correction
            for k in shap_values:
                shap_values[k] += diff / F

        return {
            "base_value": float(v_empty),
            "prediction_value": float(v_full),
            "shap_values": {k: float(v) for k, v in shap_values.items()},
            "explanations": explanations
        }
