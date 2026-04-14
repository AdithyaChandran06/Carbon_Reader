# Scope Zero: Advanced Carbon Accounting Platform 🌍🍃

Scope Zero is a comprehensive, full-stack Carbon Accounting web application designed to help businesses ingest data, calculate carbon emissions, identify high-impact hotspots, generate actionable machine-learning insights, and calculate optimized, low-emission travel logistics.

The application leverages a robust three-tier microservice architecture: a dynamic React frontend, a scalable Node.js backend acting as the primary gateway, and a specialized Python FastAPI machine learning service. 

---

## 🏗️ System Architecture & Workflow

How do the components integrate and work together?

1. **The Client (Frontend)**: The React single-page application is served via Vite. It connects directly to the Node.js backend through protected API endpoints using JWT authentication. It handles rich visualizations utilizing Recharts and coordinates geographic route logic using Leaflet & OSRM for mapping.
2. **The Gateway (Backend)**: The Express.js server handles all core business logic, user auth, and interacts with the MongoDB database (via Mongoose) to persist state. When live emissions data is requested, it securely fetches factors from third-party services (Climatiq, Carbon Interface). 
3. **The ML Microservice**: When the frontend demands "ML Insights" (anomaly detection, emission forecasting), the Node.js backend acts as a reverse proxy, forwarding the heavy data payload to the isolated Python FastAPI service. The ML microservice processes the data through Scikit-Learn models and returns the calculated predictions back to the Node backend.

---

## 💻 Tech Stack & Key Packages Used

### 1. Frontend (React + TypeScript)
Located in `/frontend`. Powered by Vite for lightning-fast HMR and building.
- **UI Frameworks**: `react` (v18), `react-router-dom` for client-side routing.
- **Styling**: `tailwindcss`, `lucide-react` (icons), `shadcn/ui` (accessible Radix primitives).
- **State Management & Fetching**: `@tanstack/react-query` for server state caching.
- **Map & Routing**: `leaflet`, `react-leaflet`, `leaflet-routing-machine` (interacts with the Open Source Routing Machine to estimate map travel distance & transport emissions).
- **Data Visualization**: `recharts` for composing complex dashboard metrics.

### 2. Primary Backend (Node.js)
Located in `/backend`.
- **Server Framework**: `express`
- **Database**: `mongoose` (Object Data Modeling for MongoDB)
- **Security & Auth**: `bcryptjs` (password hashing), `jsonwebtoken` (stateless auth security), `cors`.
- **File Handling**: `multer` (for CSV data ingestion).
- **External Integration**: Node.js natively handles HTTP calls to live API providers.

### 3. ML Microservice (Python)
Located in `/ml_service`.
- **Web Framework**: `fastapi`, served via `uvicorn`.
- **Data Engineering**: `pandas` and `numpy` for data matrix manipulation.
- **Machine Learning**: `scikit-learn` for running anomaly detection and predictive algorithms on carbon emission datasets.
- **Data Validation**: `pydantic` heavily used in API endpoints to ensure strict data-type enforcement.

---

## ✨ Core Features

* **🛡️ Secure Authentication**: Stunning glassmorphic Login and Registration split-screen interfaces with rigorous validation.
* **📊 Dashboard & Data Ingestion**: Clean drag-and-drop interfaces to upload and parse thousands of rows of emission data.
* **🔥 Hotspot Analysis**: Graphically aggregates which facilities or operational sectors are producing the most Scope 1, 2, or 3 emissions.
* **🌐 Live APIs Integration**: Programmatic connections to external carbon databases (Climatiq, Electricity Maps) to keep factors accurate.
* **🤖 ML Insights**: Employs Scikit-Learn to forecast future emissions trends based on historical data.
* **🗺️ Route Optimization**: A Leaflet geographic map allowing fleet operators to pinpoint Start/End routes, comparing real-time simulated emissions based on vehicle type (Diesel vs EV).

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v20+)
- Python (v3.10+)
- MongoDB (Running locally on port 27017)

### Step 1: Start the Backend (Port 5000)
```bash
cd backend
npm install
# Ensure you have a .env file with MONGODB_URI and JWT_SECRET
npm run dev
# or: node server.js
```

### Step 2: Start the ML Microservice (Port 8001)
```bash
cd ml_service
# Create and activate a Virtual Environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### Step 3: Start the Frontend (Port 8080 or 5173 depending on config)
```bash
cd frontend
npm install
# Ensure .env defines VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
```

Visit the provided `localhost` link in your browser to experience **Scope Zero**!
