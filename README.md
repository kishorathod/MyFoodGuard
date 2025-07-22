# MyFoodGuard

## Project Overview
MyFoodGuard is an intelligent food management platform that helps users track, analyze, and optimize their food inventory to reduce waste and improve sustainability. It leverages AI for spoilage detection, smart recommendations, and insightful analytics, making food management easy for households and organizations.

## Features
- Food inventory tracking with expiry alerts
- AI-powered spoilage detection (image and text analysis)
- Smart usage and purchase recommendations
- Gamification and analytics dashboard
- Recipe suggestions based on inventory
- User authentication and profile management
- Downloadable waste reports

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS, React Router
- **Backend:** Node.js, Express, MongoDB, JWT Auth
- **AI Model:** Python, Flask, TensorFlow/Keras, scikit-learn, NLTK, TextBlob, OpenCV

## Basic Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- Python 3.8+
- MongoDB (local or cloud)

### 1. Clone the repository
```bash
git clone https://github.com/kishorathod/MyFoodGuard.git
cd MyFoodGuard
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with your environment variables (see .env.example if available)
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

### 4. AI Model Setup
```bash
cd ../ai-model
pip install -r requirements.txt
python app.py
```

### 5. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Model API: http://localhost:5001

## Contribution
Contributions are welcome! Please open issues or submit pull requests for new features, bug fixes, or improvements.

## License
[MIT](LICENSE) © 2024 MyFoodGuard Team
