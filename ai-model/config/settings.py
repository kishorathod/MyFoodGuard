import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Flask settings
FLASK_HOST = os.getenv('FLASK_HOST', '127.0.0.1')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

# Model settings
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')
FEATURES_PATH = os.path.join(BASE_DIR, 'features.pkl')
TIME_SERIES_MODEL_PATH = os.path.join(BASE_DIR, 'time_series_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')

# Logging settings
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# CORS settings
CORS_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# AI Model settings
AI_MODEL_TIMEOUT = int(os.getenv('AI_MODEL_TIMEOUT', 10))  # seconds
BATCH_PREDICTION_TIMEOUT = int(os.getenv('BATCH_PREDICTION_TIMEOUT', 15))  # seconds

# Food categories configuration
FOOD_CATEGORIES = {
    'Fruits': {
        'decay_rate': 0.15,
        'storage_temp': 4,
        'shelf_life_days': 7,
        'sensitivity': 'high'
    },
    'Vegetables': {
        'decay_rate': 0.12,
        'storage_temp': 4,
        'shelf_life_days': 10,
        'sensitivity': 'high'
    },
    'Dairy': {
        'decay_rate': 0.08,
        'storage_temp': 2,
        'shelf_life_days': 14,
        'sensitivity': 'medium'
    },
    'Meat': {
        'decay_rate': 0.20,
        'storage_temp': 1,
        'shelf_life_days': 5,
        'sensitivity': 'very_high'
    },
    'Grains': {
        'decay_rate': 0.02,
        'storage_temp': 20,
        'shelf_life_days': 365,
        'sensitivity': 'low'
    },
    'Beverages': {
        'decay_rate': 0.05,
        'storage_temp': 4,
        'shelf_life_days': 30,
        'sensitivity': 'medium'
    },
    'Snacks': {
        'decay_rate': 0.03,
        'storage_temp': 20,
        'shelf_life_days': 90,
        'sensitivity': 'low'
    },
    'Condiments': {
        'decay_rate': 0.01,
        'storage_temp': 20,
        'shelf_life_days': 180,
        'sensitivity': 'very_low'
    },
    'Frozen': {
        'decay_rate': 0.01,
        'storage_temp': -18,
        'shelf_life_days': 365,
        'sensitivity': 'very_low'
    },
    'Canned': {
        'decay_rate': 0.001,
        'storage_temp': 20,
        'shelf_life_days': 1095,
        'sensitivity': 'very_low'
    }
}

# Image analysis settings
IMAGE_SIZE = (224, 224)
IMAGE_MODEL_WEIGHTS = 'imagenet'
IMAGE_TOP_PREDICTIONS = 5

# Sentiment analysis settings
SENTIMENT_ANALYZER = 'vader'
WASTE_KEYWORDS = [
    'expired', 'spoiled', 'rotten', 'mold', 'waste', 
    'throw', 'discard', 'bad', 'gone', 'off'
]

# Prediction settings
DEFAULT_CONFIDENCE_THRESHOLD = 0.7
DEFAULT_EXPIRY_WARNING_DAYS = 7
DEFAULT_USAGE_RATE_FACTOR = 0.8 