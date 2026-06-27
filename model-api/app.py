import os
import re
import warnings
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import joblib
import pandas as pd
from dotenv import load_dotenv

warnings.filterwarnings('ignore')

# Load .env from current directory for standalone deployment, fallback to parent for local mono-repo
env_path = Path(__file__).resolve().parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.environ.get('JWT_SECRET', 'jwt-secret-key-jarrdin')
SRUSUN_JWT_SECRET = os.environ.get('SRUSUN_JWT_SECRET', 'jarrdin-cihampelas')

# Pre-load the model to save time on each request
MODEL_PATH = Path(__file__).resolve().parent.parent / 'model_xgboost.pkl'
try:
    bundle = joblib.load(MODEL_PATH)
    model = bundle['model']
    label_encoders = bundle['label_encoders']
    selected_features = bundle['selected_features']
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model from {MODEL_PATH}: {e}")
    model, label_encoders, selected_features = None, None, []

def check_auth(token):
    if not token:
        return False, "Akses ditolak. Silakan login."
    
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return True, None
    except Exception:
        try:
            jwt.decode(token, SRUSUN_JWT_SECRET, algorithms=["HS256"])
            return True, None
        except Exception:
            return False, "Token tidak valid. Silakan login ulang."

def encode_value(feature_name, value):
    if label_encoders is None:
        return value
    encoder = label_encoders.get(feature_name)
    if encoder is None:
        return value
    candidate = value if value in list(encoder.classes_) else 'Unknown'
    return int(encoder.transform([candidate])[0])

def parse_hour_value(time_str, default_hour=0):
    if not time_str:
        return default_hour
    match = re.match(r'^(\d{1,2}):', str(time_str))
    if match:
        return int(match.group(1))
    return default_hour

@app.route('/api/predict', methods=['POST'])
def predict():
    auth_header = request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    else:
        token = request.args.get('token')

    is_valid, error_msg = check_auth(token)
    if not is_valid:
        return jsonify({'success': False, 'message': error_msg}), 401

    if model is None:
        return jsonify({'success': False, 'message': 'Model not loaded properly.'}), 500

    data = request.json or {}
    
    try:
        lama_menginap = int(data.get('lama_menginap') or 0)
        
        waktu_checkin = data.get('waktu_checkin')
        waktu_checkout = data.get('waktu_checkout')
        
        checkin_hour = parse_hour_value(waktu_checkin, 0)
        checkout_hour = parse_hour_value(waktu_checkout or waktu_checkin, parse_hour_value(waktu_checkin, 0))
        
        row = {
            'lama_menginap': lama_menginap,
            'checkin_hour': checkin_hour,
            'checkout_hour': checkout_hour,
            'jenis_sewa': encode_value('jenis_sewa', data.get('jenis_sewa', 'Unknown')),
            'status_pasutri': encode_value('status_pasutri', data.get('status_pasutri', 'Unknown')),
            'status_kewarganegaraan': encode_value('status_kewarganegaraan', data.get('status_kewarganegaraan', 'Unknown')),
            'metode_pembayaran': encode_value('metode_pembayaran', data.get('metode_pembayaran', 'Unknown'))
        }

        final_features = [row.get(feature, 0) for feature in selected_features]
        frame = pd.DataFrame([final_features], columns=selected_features)

        prediction = int(model.predict(frame)[0])
        probability = None

        if hasattr(model, 'predict_proba'):
            probability = float(model.predict_proba(frame)[0][prediction])

        return jsonify({
            'success': True,
            'prediction': {
                'class': prediction,
                'label': 'Aman' if prediction == 0 else 'Melanggar',
                'notification': '⚠️Penyewa Berpotensi Melakukan Pelanggaran!' if prediction == 1 else None,
                'probability': probability
            }
        })
    except Exception as e:
        print("Prediction API Error:", e)
        return jsonify({'success': False, 'message': 'Prediction API Error', 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('MODEL_API_PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=False)
