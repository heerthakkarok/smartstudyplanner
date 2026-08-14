# 🎓 Smart Study Planner

An intelligent, AI-powered web application that helps students create, manage, and optimize personalized study schedules. Powered by **Google Gemini AI**, Smart Study Planner breaks down subjects and exam topics into structured daily tasks, tracks study streaks, generates interactive practice quizzes, and delivers automated performance reports.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Prerequisites](#-prerequisites)
- [Environment Setup](#-environment-setup)
- [Installation & Getting Started](#-installation--getting-started)
- [Database Seeding](#-database-seeding)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## ✨ Features

- 🤖 **AI-Generated Study Schedules**: Automatically builds personalized, balanced study plans based on exam dates, daily study availability, subject difficulty, and user learning preferences using **Google Gemini 2.5 Flash API**.
- 📝 **Interactive AI Quizzes**: Dynamically creates custom practice quizzes for specific subjects or topics with instant scoring and detailed answer feedback.
- 📈 **Analytics & Performance Tracking**: Visualizes study habits, completion rates, weekly progress, and study streaks using interactive charts.
- 📄 **Exportable PDF Reports**: Generates downloadable PDF progress summaries detailing task performance and exam readiness via PDFKit.
- 📧 **Automated Email Reports & Notifications**: Features background cron jobs to send automated monthly performance summaries and updates to users via SMTP.
- 🔐 **Dual Authentication & Security**: Supports traditional Email/Password authentication (with bcrypt hashing and JWT tokens) alongside **Google OAuth 2.0 Single Sign-On (SSO)**.
- 🎯 **Task & Exam Management**: Full CRUD capabilities to manage upcoming exams, subjects, sub-topics, study sessions, and daily task lists.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Authentication**: [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ORM](https://mongoosejs.com/)
- **AI Integration**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini 2.5 Flash)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `google-auth-library`, `express-rate-limit`
- **PDF & Document Generation**: `pdfkit`
- **Background Tasks & Email**: `node-cron`, `nodemailer`
- **Validation**: `zod`

---

## 📁 Project Architecture

```text
smartstudyplanner/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection setup (db.js)
│   │   ├── controllers/     # Route controllers & business logic
│   │   ├── middleware/      # Auth & rate-limiting middleware
│   │   ├── models/          # Mongoose models (User, Exam, Subject, Topic, StudyTask, Quiz, StudySession)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Gemini AI, Email, PDF, and Planner services
│   │   ├── utils/           # Helper functions & validators
│   │   ├── seed.js          # Database seeder script
│   │   └── server.js        # Express application entry point
│   ├── .env.example         # Template for environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (Navbar, Modals, ProtectedRoute)
│   │   ├── context/         # React Context (AuthContext)
│   │   ├── pages/           # Application views (Dashboard, StudyPlan, Tasks, Quiz, Profile, etc.)
│   │   ├── services/        # Frontend API call services
│   │   ├── App.jsx          # Root App component with routing
│   │   └── main.jsx         # Vite React entry point
│   ├── vite.config.js       # Vite configuration & backend proxy setup
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── package.json
│
└── README.md
```

---

## ⚡ Prerequisites

Before running the application, make sure you have the following installed on your machine:

1. **[Node.js](https://nodejs.org/)** (v18.x or higher) & **npm**
2. **[MongoDB](https://www.mongodb.com/)** (Running locally on default port `27017` or a MongoDB Atlas cloud URI)
3. **[Google Gemini API Key](https://aistudio.google.com/)** (Required for AI schedule generation and quiz generation)

---

## ⚙️ Environment Setup

Navigate to the `backend` folder and create a `.env` file based on `.env.example`:

### Backend `.env` Configuration

Create `backend/.env`:

```env
# Server Port
PORT=5000

# Database Connection
MONGO_URI=mongodb://127.0.0.1:27017/smartstudyplanner

# JWT Authentication Secret
JWT_SECRET=your_jwt_secret_key_here

# Google Gemini AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Email Notification Configuration (Nodemailer SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM="Smart Study Planner" <no-reply@smartstudyplanner.com>

# Google OAuth 2.0 Credentials (Optional / Single Sign-On)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL (CORS setting)
CLIENT_URL=http://localhost:3000
```

---

## 🚀 Installation & Getting Started

Follow these step-by-step instructions to get the application up and running locally.

### 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd smaartstudyplanner
```

### 2️⃣ Set Up & Run the Backend Server

Open a terminal window in the root directory:

```bash
# Navigate to the backend folder
cd backend

# Install dependencies
npm install

# (Optional) Seed demo user data into database
npm run seed

# Run backend in development mode (with nodemon)
npm run dev
```

The backend server will start running on **`http://localhost:5000`**.

### 3️⃣ Set Up & Run the Frontend Application

Open a **new** terminal window:

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application will start running on **`http://localhost:3000`** (and automatically proxies `/api` requests to `http://localhost:5000`).

### 4️⃣ Open in Browser

Launch your web browser and navigate to:
```text
http://localhost:3000
```

---

## 🌱 Database Seeding

To quickly test the application without creating a new user manually, you can run the seed script:

```bash
cd backend
npm run seed
```

This populates MongoDB with a test account:
- **Email**: `demo@example.com`
- **Password**: `password123`

---

## 📡 API Endpoints Overview

Below are the primary API routes hosted by the backend server:

| Route Prefix | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **`/api/auth`** | `/register` | `POST` | Register a new user account |
| | `/login` | `POST` | Authenticate user & issue JWT token |
| | `/google` | `POST` | Google OAuth authentication |
| | `/forgot-password` | `POST` | Request password reset OTP |
| | `/reset-password` | `POST` | Reset password using OTP |
| **`/api/profile`** | `/` | `GET / PUT` | Fetch or update user profile & study preferences |
| **`/api/exams`** | `/exams` | `GET / POST` | Retrieve or create exam schedule & subject topics |
| **`/api/tasks`** | `/tasks` | `GET / POST` | Retrieve daily study tasks or add custom tasks |
| | `/tasks/:id` | `PUT / DELETE` | Mark task as completed or update details |
| | `/planner/generate` | `POST` | Trigger AI generation of study plan via Gemini |
| **`/api/analytics`** | `/analytics` | `GET` | Get user study progress, streaks, and subject breakdown |
| | `/analytics/pdf` | `GET` | Download generated PDF progress report |
| **`/api/quiz`** | `/quiz/generate` | `POST` | Generate interactive AI quiz for topic/subject |
| | `/quiz/submit` | `POST` | Submit completed quiz & calculate score |

---

## ❓ Troubleshooting & Common Issues

1. **MongoDB Connection Failed**:
   - Ensure MongoDB service is running locally (`mongod` or via MongoDB Compass).
   - Verify `MONGO_URI` in `backend/.env`.

2. **Gemini AI Plan Generation Error**:
   - Ensure a valid `GEMINI_API_KEY` is provided in `backend/.env`.
   - Check AI API quota and network access.

3. **Port 5000 / Port 3000 Already in Use**:
   - Stop any existing Node processes running on these ports or change `PORT` in `.env` and `vite.config.js`.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
