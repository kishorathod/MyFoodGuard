from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
from datetime import datetime, timedelta
import re

app = Flask(__name__)
CORS(app)

# Mock AI model for demonstration
class MockAIModel:
    def __init__(self):
        self.categories = {
            'dairy': {'shelf_life': 7, 'spoilage_rate': 0.1},
            'fruits': {'shelf_life': 5, 'spoilage_rate': 0.15},
            'vegetables': {'shelf_life': 10, 'spoilage_rate': 0.08},
            'meat': {'shelf_life': 3, 'spoilage_rate': 0.25},
            'grains': {'shelf_life': 30, 'spoilage_rate': 0.02},
            'beverages': {'shelf_life': 14, 'spoilage_rate': 0.05},
            'snacks': {'shelf_life': 21, 'spoilage_rate': 0.03},
            'other': {'shelf_life': 7, 'spoilage_rate': 0.1}
        }
    
    def predict_expiry(self, item_name, category, quantity, storage_conditions):
        """Predict expiry date and usage rate"""
        base_shelf_life = self.categories.get(category, self.categories['other'])['shelf_life']
        spoilage_rate = self.categories.get(category, self.categories['other'])['spoilage_rate']
        
        # Adjust based on storage conditions
        temperature = storage_conditions.get('temperature', 4)
        humidity = storage_conditions.get('humidity', 60)
        storage_type = storage_conditions.get('storage', 'refrigerator')
        
        # Temperature adjustment
        if temperature > 10:
            base_shelf_life *= 0.7
        elif temperature < 2:
            base_shelf_life *= 1.2
        
        # Humidity adjustment
        if humidity > 80:
            base_shelf_life *= 0.8
        elif humidity < 40:
            base_shelf_life *= 0.9
        
        # Storage type adjustment
        if storage_type == 'freezer':
            base_shelf_life *= 3
        elif storage_type == 'pantry':
            base_shelf_life *= 0.6
        
        # Add some randomness
        shelf_life = base_shelf_life * random.uniform(0.8, 1.2)
        
        # Calculate expiry date
        expiry_date = datetime.now() + timedelta(days=int(shelf_life))
        
        # Calculate usage rate based on quantity and shelf life
        usage_rate = min(quantity / shelf_life, 1.0) * random.uniform(0.8, 1.2)
        
        return {
            'expiry_date': expiry_date.strftime('%Y-%m-%d'),
            'shelf_life_days': int(shelf_life),
            'usage_rate': round(usage_rate, 2),
            'confidence': random.uniform(0.7, 0.95),
            'recommended_quantity': max(1, int(quantity * 0.8)),
            'spoilage_risk': round(spoilage_rate * (1 + random.uniform(-0.2, 0.2)), 3)
        }
    
    def analyze_image(self, image_data):
        """Mock image analysis"""
        # Simulate OCR processing
        possible_dates = [
            '2024-02-15', '2024-02-20', '2024-02-25',
            '2024-03-01', '2024-03-05', '2024-03-10'
        ]
        
        return {
            'expiry_date': random.choice(possible_dates),
            'confidence': random.uniform(0.7, 0.95),
            'pattern_found': 'DD/MM/YYYY',
            'days_until_expiry': random.randint(1, 30)
        }
    
    def analyze_text(self, text):
        """Mock text analysis for sentiment and keywords"""
        positive_words = ['fresh', 'good', 'tasty', 'delicious', 'healthy']
        negative_words = ['spoiled', 'rotten', 'bad', 'moldy', 'expired']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        sentiment = 'neutral'
        if positive_count > negative_count:
            sentiment = 'positive'
        elif negative_count > positive_count:
            sentiment = 'negative'
        
        return {
            'sentiment': sentiment,
            'confidence': random.uniform(0.6, 0.9),
            'keywords': ['food', 'quality', 'freshness'],
            'spoilage_indicators': negative_count
        }

# Initialize mock AI model
ai_model = MockAIModel()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Model Server',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict expiry and usage for food items"""
    try:
        data = request.json
        item_name = data.get('name', 'Unknown Item')
        category = data.get('category', 'other')
        quantity = data.get('quantity', 1)
        expiry_date = data.get('expiryDate')
        storage_conditions = data.get('storage_conditions', {})
        
        # If expiry date is provided, calculate days until expiry
        if expiry_date:
            expiry = datetime.strptime(expiry_date, '%Y-%m-%d')
            days_until_expiry = (expiry - datetime.now()).days
        else:
            # Use AI prediction
            prediction = ai_model.predict_expiry(item_name, category, quantity, storage_conditions)
            days_until_expiry = prediction['shelf_life_days']
            expiry_date = prediction['expiry_date']
        
        # Calculate risk level
        if days_until_expiry < 0:
            risk_level = 'expired'
        elif days_until_expiry <= 1:
            risk_level = 'critical'
        elif days_until_expiry <= 3:
            risk_level = 'high'
        elif days_until_expiry <= 7:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        response = {
            'item_name': item_name,
            'category': category,
            'expiry_date': expiry_date,
            'days_until_expiry': days_until_expiry,
            'risk_level': risk_level,
            'usage_rate': ai_model.predict_expiry(item_name, category, quantity, storage_conditions)['usage_rate'],
            'recommended_quantity': ai_model.predict_expiry(item_name, category, quantity, storage_conditions)['recommended_quantity'],
            'confidence': random.uniform(0.8, 0.95),
            'suggestions': [
                f"Use {item_name} within {max(1, days_until_expiry)} days",
                "Store in appropriate conditions",
                "Consider freezing if not used soon"
            ]
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    """Analyze food image for spoilage detection"""
    try:
        # Mock image analysis
        result = ai_model.analyze_image("mock_image_data")
        
        return jsonify({
            'spoilage_detected': random.choice([True, False]),
            'confidence': result['confidence'],
            'expiry_date': result['expiry_date'],
            'quality_score': random.uniform(0.6, 0.95),
            'recommendations': [
                "Store in refrigerator",
                "Use within recommended timeframe",
                "Check for visible spoilage signs"
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze text logs for sentiment and spoilage indicators"""
    try:
        data = request.json
        text = data.get('text', '')
        
        result = ai_model.analyze_text(text)
        
        return jsonify({
            'sentiment': result['sentiment'],
            'confidence': result['confidence'],
            'spoilage_indicators': result['spoilage_indicators'],
            'keywords': result['keywords'],
            'recommendations': [
                "Monitor food quality regularly",
                "Record observations consistently",
                "Take action on negative indicators"
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Predict for multiple items at once"""
    try:
        data = request.json
        items = data.get('items', [])
        
        predictions = []
        for item in items:
            prediction = ai_model.predict_expiry(
                item.get('name', 'Unknown'),
                item.get('category', 'other'),
                item.get('quantity', 1),
                item.get('storage_conditions', {})
            )
            predictions.append({
                'item_name': item.get('name'),
                'prediction': prediction
            })
        
        return jsonify({
            'predictions': predictions,
            'total_items': len(items),
            'average_confidence': sum(p['prediction']['confidence'] for p in predictions) / len(predictions) if predictions else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🤖 AI Model Server Starting...")
    print("📍 Server will run on http://localhost:5001")
    print("🔧 Available endpoints:")
    print("   - GET  /health")
    print("   - POST /predict")
    print("   - POST /analyze-image")
    print("   - POST /analyze-text")
    print("   - POST /batch-predict")
    print()
    app.run(host='0.0.0.0', port=5001, debug=True) 