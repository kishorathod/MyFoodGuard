# MyFoodGuard

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/kishorathod/MyFoodGuard)](https://github.com/kishorathod/MyFoodGuard/commits/master)
[![Issues](https://img.shields.io/github/issues/kishorathod/MyFoodGuard)](https://github.com/kishorathod/MyFoodGuard/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/kishorathod/MyFoodGuard)](https://github.com/kishorathod/MyFoodGuard/pulls)

## Screenshots

![Dashboard Screenshot](frontend/src/assets/carousel/saveFoodImage.jpg)

---

## Folder Structure

```
MyFoodGuard/
  backend/      # Node.js/Express API
  frontend/     # React + Vite frontend
  ai-model/     # Python Flask AI/ML services
```

---

## API Endpoints

### Backend
- `POST /api/food/add` — Add a food item
- `GET /api/food/list` — List all food items
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration

### AI Model
- `POST /predict` — Predict spoilage and recommendations
- `POST /analyze-image` — Analyze food image for spoilage
- `POST /analyze-text` — Analyze text logs for waste sentiment
- `GET /health` — Health check

---

## FAQ

**Q: How do I run all services together?**  
A: Use the provided `start-all.bat` (Windows) or `start.sh` (Linux/Mac) script in the project root.

**Q: Where do I put my environment variables?**  
A: Create a `.env` file in the `backend` and `ai-model` directories as needed. These files are ignored by git.

**Q: How do I contribute?**  
A: Fork the repo, create a feature branch, and submit a pull request!

---

# Project Overview
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
