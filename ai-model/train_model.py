
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier
from sklearn.metrics import classification_report
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Load the enhanced dataset
df = pd.read_csv("food_data_advanced.csv")

# Feature engineering
df['days_until_expiry'] = (pd.to_datetime(df['expiry_date']) - pd.Timestamp.now()).dt.days
df.drop(columns=['expiry_date'], inplace=True)

# Define input features and target
X = df.drop(columns=['will_spoil'])
y = df['will_spoil']

# Define preprocessing
categorical_features = ['item', 'packaging', 'storage']
numerical_features = ['quantity', 'temperature', 'humidity', 'days_since_added', 'days_until_expiry']

preprocessor = ColumnTransformer([
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
], remainder='passthrough')

# Create model pipeline
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', XGBClassifier(n_estimators=100, use_label_encoder=False, eval_metric='logloss'))
])

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
print("Classification Report:")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "model.pkl")

# Save the feature names for reference (useful during prediction)
joblib.dump(X.columns.tolist(), "features.pkl")

print("✅ Advanced model and features saved successfully!")
