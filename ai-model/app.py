from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import cv2
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
import requests
from PIL import Image
import io
import base64
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pickle
import json
import os

# Download required NLTK data
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load models and scalers
try:
    model = joblib.load("model.pkl")
    features = joblib.load("features.pkl")
    time_series_model = joblib.load("time_series_model.pkl") if os.path.exists("time_series_model.pkl") else None
    scaler = joblib.load("scaler.pkl") if os.path.exists("scaler.pkl") else None
    logger.info("✅ All models loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load models: {e}")
    model = None
    features = None
    time_series_model = None
    scaler = None

# Load pre-trained image classification model
try:
    image_model = MobileNetV2(weights='imagenet', include_top=True)
    logger.info("✅ Image classification model loaded")
except Exception as e:
    logger.error(f"❌ Failed to load image model: {e}")
    image_model = None

# Initialize sentiment analyzer
sia = SentimentIntensityAnalyzer()

# Food waste categories and their decay rates
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

def analyze_image_spoilage(image_data):
    """Analyze image for food spoilage using transfer learning"""
    try:
        if image_model is None:
            return {"confidence": 0.5, "spoilage_detected": False, "error": "Model not available"}
        
        # Decode base64 image
        if isinstance(image_data, str):
            image_bytes = base64.b64decode(image_data.split(',')[1])
        else:
            image_bytes = image_data
        
        # Load and preprocess image
        img = Image.open(io.BytesIO(image_bytes))
        img = img.resize((224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        
        # Predict
        predictions = image_model.predict(img_array)
        decoded = decode_predictions(predictions, top=5)[0]
        
        # Analyze for food-related classes and spoilage indicators
        food_keywords = ['banana', 'apple', 'orange', 'tomato', 'lettuce', 'milk', 'cheese', 'bread', 'meat']
        spoilage_indicators = ['mold', 'rotten', 'spoiled', 'decay']
        
        food_detected = any(keyword in pred[1].lower() for pred in decoded)
        spoilage_detected = any(indicator in pred[1].lower() for pred in decoded)
        
        confidence = max(pred[2] for pred in decoded)
        
        return {
            "confidence": float(confidence),
            "spoilage_detected": spoilage_detected,
            "food_detected": food_detected,
            "predictions": [(pred[1], float(pred[2])) for pred in decoded]
        }
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {"confidence": 0.0, "spoilage_detected": False, "error": str(e)}

def analyze_text_sentiment(text):
    """Analyze text for sentiment and waste-related keywords"""
    try:
        # Sentiment analysis
        sentiment_scores = sia.polarity_scores(text)
        
        # Waste-related keyword analysis
        waste_keywords = ['expired', 'spoiled', 'rotten', 'mold', 'waste', 'throw', 'discard', 'bad']
        text_lower = text.lower()
        waste_count = sum(1 for keyword in waste_keywords if keyword in text_lower)
        
        # Calculate waste sentiment score
        waste_sentiment = waste_count / len(waste_keywords) if waste_keywords else 0
        
        return {
            "sentiment": sentiment_scores,
            "waste_keywords_found": waste_count,
            "waste_sentiment_score": waste_sentiment,
            "overall_sentiment": sentiment_scores['compound']
        }
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        return {"error": str(e)}

def calculate_decay_curve(category, days_since_added, storage_conditions):
    """Calculate decay curve using advanced statistical model"""
    try:
        category_info = FOOD_CATEGORIES.get(category, FOOD_CATEGORIES['Other'])
        base_decay_rate = category_info['decay_rate']
        
        # Adjust for storage conditions
        temp_factor = 1.0
        if storage_conditions.get('temperature'):
            optimal_temp = category_info['storage_temp']
            actual_temp = storage_conditions['temperature']
            temp_factor = 1 + abs(actual_temp - optimal_temp) * 0.1
        
        humidity_factor = 1.0
        if storage_conditions.get('humidity'):
            humidity = storage_conditions['humidity']
            if humidity > 70:  # High humidity accelerates decay
                humidity_factor = 1.2
            elif humidity < 30:  # Low humidity can preserve some items
                humidity_factor = 0.9
        
        # Calculate decay using exponential decay model
        adjusted_decay_rate = base_decay_rate * temp_factor * humidity_factor
        decay_factor = np.exp(-adjusted_decay_rate * days_since_added)
        
        return {
            "decay_factor": float(decay_factor),
            "adjusted_decay_rate": adjusted_decay_rate,
            "remaining_quality": float(decay_factor * 100)
        }
    except Exception as e:
        logger.error(f"Decay calculation error: {e}")
        return {"decay_factor": 0.5, "error": str(e)}

def predict_time_series_consumption(historical_data):
    """Predict consumption patterns using time series analysis"""
    try:
        if time_series_model is None:
            return {"prediction": 0.5, "confidence": 0.3, "error": "Model not available"}
        
        # Prepare features for time series prediction
        features = []
        for data_point in historical_data:
            features.append([
                data_point.get('quantity', 0),
                data_point.get('days_since_added', 0),
                data_point.get('temperature', 20),
                data_point.get('humidity', 50)
            ])
        
        if not features:
            return {"prediction": 0.5, "confidence": 0.3, "error": "No historical data"}
        
        # Scale features
        if scaler:
            features_scaled = scaler.transform(features)
        else:
            features_scaled = features
        
        # Predict
        prediction = time_series_model.predict(features_scaled[-1:])[0]
        
        return {
            "prediction": float(prediction),
            "confidence": 0.8,
            "trend": "increasing" if prediction > 0.5 else "decreasing"
        }
    except Exception as e:
        logger.error(f"Time series prediction error: {e}")
        return {"prediction": 0.5, "confidence": 0.3, "error": str(e)}

def calculate_days_until_expiry(expiry_date_str):
    """Calculate days until expiry with proper error handling"""
    try:
        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d")
        days_until = (expiry_date - datetime.now()).days
        return max(days_until, 0)  # Don't return negative days
    except Exception as e:
        logger.error(f"Error calculating expiry days: {e}")
        return 7  # Default to 7 days if error

def predict_usage_rate(item_name, quantity, days_until_expiry, category, storage_conditions=None):
    """Advanced usage rate prediction with multiple factors"""
    try:
        # Base usage rates by category
        category_rates = {
            'Fruits': 0.3, 'Vegetables': 0.4, 'Dairy': 0.2, 'Meat': 0.15,
            'Grains': 0.1, 'Beverages': 0.25, 'Snacks': 0.35, 'Condiments': 0.05,
            'Frozen': 0.15, 'Canned': 0.08, 'Other': 0.2
        }
        
        base_rate = category_rates.get(category, 0.2)
        
        # Adjust based on expiry proximity (urgency factor)
        if days_until_expiry <= 1:
            urgency_factor = 2.0  # Very urgent
        elif days_until_expiry <= 3:
            urgency_factor = 1.5  # Urgent
        elif days_until_expiry <= 7:
            urgency_factor = 1.2  # Soon
        else:
            urgency_factor = 1.0  # Normal
        
        # Adjust based on quantity (scarcity factor)
        quantity_factor = min(quantity / 10, 1.0)  # Normalize quantity
        
        # Adjust based on storage conditions
        storage_factor = 1.0
        if storage_conditions:
            temp = storage_conditions.get('temperature', 20)
            humidity = storage_conditions.get('humidity', 50)
            
            # Temperature affects usage rate
            if temp < 5:  # Very cold - slower usage
                storage_factor *= 0.8
            elif temp > 25:  # Very warm - faster usage
                storage_factor *= 1.3
            
            # Humidity affects usage rate
            if humidity > 80:  # High humidity - faster usage
                storage_factor *= 1.2
        
        # Calculate final usage rate
        usage_rate = base_rate * urgency_factor * quantity_factor * storage_factor
        return round(min(usage_rate, 1.0), 3)  # Cap at 1.0
        
    except Exception as e:
        logger.error(f"Usage rate prediction error: {e}")
        return 0.2  # Default rate

def calculate_recommended_quantity(usage_rate, days_until_expiry, category):
    """Calculate recommended quantity with category-specific logic"""
    try:
        category_info = FOOD_CATEGORIES.get(category, FOOD_CATEGORIES['Other'])
        shelf_life = category_info['shelf_life_days']
        
        # Base recommendation
        daily_usage = usage_rate
        recommended = daily_usage * min(days_until_expiry, shelf_life)
        
        # Adjust for category sensitivity
        sensitivity_factors = {
            'very_high': 0.8,  # Buy less of very sensitive items
            'high': 0.9,
            'medium': 1.0,
            'low': 1.1,
            'very_low': 1.2   # Buy more of stable items
        }
        
        sensitivity = category_info['sensitivity']
        sensitivity_factor = sensitivity_factors.get(sensitivity, 1.0)
        
        final_recommendation = recommended * sensitivity_factor
        return max(1, round(final_recommendation, 1))
        
    except Exception as e:
        logger.error(f"Recommended quantity calculation error: {e}")
        return 1.0

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        logger.info(f"Received prediction request: {data}")

        # Validate required fields
        required_fields = ['name', 'quantity', 'expiryDate', 'category']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Extract and validate fields
        item_name = str(data.get("name", "")).strip()
        quantity = float(data.get("quantity", 0))
        expiry_date = str(data.get("expiryDate", ""))
        category = str(data.get("category", "Other")).strip()
        storage_conditions = data.get("storage_conditions", {})
        image_data = data.get("image")
        text_logs = data.get("text_logs", "")
        historical_data = data.get("historical_data", [])
        
        # Validate quantity
        if quantity <= 0:
            return jsonify({"error": "Quantity must be greater than 0"}), 400

        # Calculate days until expiry
        days_until_expiry = calculate_days_until_expiry(expiry_date)
        
        # Advanced predictions
        usage_rate = predict_usage_rate(item_name, quantity, days_until_expiry, category, storage_conditions)
        recommended_qty = calculate_recommended_quantity(usage_rate, days_until_expiry, category)
        decay_analysis = calculate_decay_curve(category, 0, storage_conditions)
        
        # Image analysis if provided
        image_analysis = None
        if image_data:
            image_analysis = analyze_image_spoilage(image_data)
        
        # Text sentiment analysis
        text_analysis = None
        if text_logs:
            text_analysis = analyze_text_sentiment(text_logs)
        
        # Time series prediction
        time_series_prediction = None
        if historical_data:
            time_series_prediction = predict_time_series_consumption(historical_data)
        
        # Determine if likely to expire
        likely_to_expire = (
            days_until_expiry <= 3 or 
            usage_rate < 0.1 or 
            (image_analysis and image_analysis.get('spoilage_detected', False)) or
            (text_analysis and text_analysis.get('waste_sentiment_score', 0) > 0.5)
        )
        
        # Use ML model if available
        ml_prediction = None
        if model is not None and features is not None:
            try:
                input_data = {
                    "item": item_name,
                    "quantity": quantity,
                    "temperature": storage_conditions.get('temperature', 20.0),
                    "packaging": storage_conditions.get('packaging', 'plastic'),
                    "storage": storage_conditions.get('storage', 'refrigerator' if category in ['Dairy', 'Meat', 'Fruits', 'Vegetables'] else 'pantry'),
                    "humidity": storage_conditions.get('humidity', 60.0),
                    "days_since_added": 0,
                    "days_until_expiry": days_until_expiry
                }
                
                df = pd.DataFrame([input_data])
                df = df[features]
                
                prediction = model.predict(df)[0]
                proba = model.predict_proba(df)[0]
                confidence = float(max(proba))
                
                ml_prediction = {
                    "will_spoil": bool(prediction),
                    "confidence": round(confidence, 4)
                }
                
            except Exception as e:
                logger.error(f"ML prediction failed: {e}")
                ml_prediction = None

        # Prepare comprehensive response
        response = {
            "predictedUsageRate": usage_rate,
            "recommendedQty": recommended_qty,
            "likelyToExpire": likely_to_expire,
            "daysUntilExpiry": days_until_expiry,
            "category": category,
            "decay_analysis": decay_analysis,
            "image_analysis": image_analysis,
            "text_analysis": text_analysis,
            "time_series_prediction": time_series_prediction,
            "ml_prediction": ml_prediction,
            "storage_recommendations": {
                "optimal_temperature": FOOD_CATEGORIES.get(category, {}).get('storage_temp', 20),
                "optimal_humidity": 60,
                "storage_type": "refrigerator" if category in ['Dairy', 'Meat', 'Fruits', 'Vegetables'] else "pantry"
            }
        }
        
        logger.info(f"Advanced prediction response generated")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    """Analyze uploaded image for food spoilage"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"error": "No image data provided"}), 400
        
        result = analyze_image_spoilage(image_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return jsonify({"error": "Image analysis failed", "details": str(e)}), 500

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze text logs for waste-related sentiment"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        result = analyze_text_sentiment(text)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        return jsonify({"error": "Text analysis failed", "details": str(e)}), 500

@app.route('/predict-consumption', methods=['POST'])
def predict_consumption():
    """Predict consumption patterns using time series analysis"""
    try:
        data = request.get_json()
        historical_data = data.get('historical_data', [])
        
        if not historical_data:
            return jsonify({"error": "No historical data provided"}), 400
        
        result = predict_time_series_consumption(historical_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Consumption prediction error: {e}")
        return jsonify({"error": "Consumption prediction failed", "details": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "features_loaded": features is not None,
        "image_model_loaded": image_model is not None,
        "time_series_model_loaded": time_series_model is not None
    })

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Predict for multiple items at once with advanced features"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        if not items:
            return jsonify({"error": "No items provided"}), 400
        
        predictions = []
        for item in items:
            try:
                days_until_expiry = calculate_days_until_expiry(item.get("expiryDate", ""))
                usage_rate = predict_usage_rate(
                    item.get("name", ""), 
                    item.get("quantity", 0), 
                    days_until_expiry, 
                    item.get("category", "Other"),
                    item.get("storage_conditions", {})
                )
                
                decay_analysis = calculate_decay_curve(
                    item.get("category", "Other"), 
                    0, 
                    item.get("storage_conditions", {})
                )
                
                prediction = {
                    "itemId": item.get("_id"),
                    "predictedUsageRate": usage_rate,
                    "recommendedQty": calculate_recommended_quantity(usage_rate, days_until_expiry, item.get("category", "Other")),
                    "likelyToExpire": days_until_expiry <= 3 or usage_rate < 0.1,
                    "daysUntilExpiry": days_until_expiry,
                    "decay_analysis": decay_analysis
                }
                predictions.append(prediction)
                
            except Exception as e:
                logger.error(f"Error predicting for item {item.get('name')}: {e}")
                continue
        
        return jsonify({"predictions": predictions})
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({"error": "Batch prediction failed", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
