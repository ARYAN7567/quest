# Quest Platform - Full Stack Web Application

## Overview
A quest platform where users pay a specific amount in INR to access quests, admins can create quests with questions, and the system calculates average user answers.

## Tech Stack
- **Backend:** Node.js + Express (TypeScript)
- **Database:** MySQL 8.x
- **Authentication:** JWT + bcrypt
- **Payments:** Razorpay (INR)
- **Frontend:** React + Vite
- **Admin Panel:** React + Router

## Project Structure
```
quest-platform/
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # DB, JWT, Razorpay config
│   │   ├── middleware/# Auth, error handling
│   │   ├── models/    # MySQL models
│   │   ├── routes/    # API routes
│   │   └── utils/     # Helpers
│   └── package.json
└── frontend/          # React client + Admin
    ├── user/          # User-facing app
    ├── admin/         # Admin panel
    └── package.json
```

## Key Features
1. **User Flow:** Register → Login → Pay → Take Quest → View Results
2. **Admin Flow:** Login → Create Quest → Add Questions → Manage Users
3. **Answer Averaging:** Calculate and display average scores per question

## API Endpoints (Backend)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User/Admin login (JWT)
- `GET /api/quests` - List available quests
- `GET /api/quests/:id` - Get single quest with questions
- `POST /api/orders` - Create Razorpay order
- `POST /api/submissions` - Submit quiz answers
- `GET /api/results/:questId` - Calculate averages
- `POST /api/admin/quests` - Admin: Create quest
- `POST /api/admin/questions` - Admin: Add questions

## Database Schema (MySQL)
- users: id, email, password, role (user/admin), created_at
- quests: id, title, description, price, is_paid, created_at
- questions: id, quest_id, question_text, options (json), correct_answer
- submissions: id, user_id, quest_id, answers (json), score, submitted_at