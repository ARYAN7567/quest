# Quest Platform

A full-stack web application where users pay to access quests (quizzes), and admins can create quests with questions. The platform calculates and displays average user answers.

## 🔒 Security Features

This application implements comprehensive security measures:

- **JWT Authentication** with 7-day token expiration
- **bcrypt Password Hashing** with 12 salt rounds
- **Password Complexity Requirements**: 8+ chars, uppercase, lowercase, number
- **Role-Based Access Control**: User vs Admin authorization
- **Rate Limiting**: Prevents brute force (5 auth attempts/15min, 100 API reqs/15min)
- **Security Headers**: Helmet.js + CSP, HSTS, X-Frame-Options, etc.
- **Input Validation & Sanitization**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries throughout
- **Payment Security**: Razorpay signature verification, server-side amount validation

See [SECURITY.md](SECURITY.md) for detailed security documentation.

---

## Features

### User Features
- **Authentication**: Register/Login with JWT tokens
- **Quest Browsing**: View available quests with pricing
- **Secure Payments**: Razorpay integration for INR payments
- **Quiz Taking**: Interactive question-by-question interface
- **Results & Analytics**: View scores, correct answers, and average percentages
- **Payment History**: Track all purchases

### Admin Features
- **Dashboard**: Overview stats (users, quests, questions, revenue)
- **Quest Management**: Create, edit, delete quests with pricing
- **Question Management**: Add questions with multiple options, set correct answers
- **User Management**: View all registered users
- **Submission Analytics**: View per-question correctness averages

---

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL 8.x
- **Authentication**: JWT + bcrypt
- **Payments**: Razorpay (INR)
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Pure CSS (no framework dependencies)

---

## Project Structure

```
quest-platform/
├── backend/                 # Express API Server
│   ├── src/
│   │   ├── config/         # DB, JWT, Razorpay config
│   │   ├── controllers/    # Route handlers
│   │   ├── db/             # Migrations & seeding
│   │   ├── middleware/     # Auth, security, validation
│   │   └── routes/         # API routes
│   └── package.json
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Shared components
│   │   ├── context/        # React Context (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   │   └── admin/      # Admin panel pages
│   │   └── api/            # Axios instance
│   └── package.json
└── package.json            # Root scripts
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.x
- Razorpay account (for payments)

### 1. Database Setup
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE quest_platform;"
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials and Razorpay keys

# Run migrations
npm run db:migrate

# Seed sample data (admin user + sample quest)
npm run db:seed

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start user frontend (port 5173)
npm run dev

# Start admin frontend (port 5174) - in separate terminal
npm run admin
```

### 4. Access the Application
- **User App**: http://localhost:5173
- **Admin Panel**: http://localhost:5174
- **API**: http://localhost:5000

### Default Admin Credentials
- Email: `admin@quest.com`
- Password: `admin123`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user/admin |
| GET | `/api/auth/profile` | Get current user profile |

### Quests (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quests` | List all quests |
| GET | `/api/quests/:id` | Get quest with questions |

### Quests (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quests` | Create quest |
| GET | `/api/quests/admin/all` | List quests with stats |
| PUT | `/api/quests/:id` | Update quest |
| DELETE | `/api/quests/:id` | Delete quest |

### Questions (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questions` | Add question |
| GET | `/api/questions/quest/:questId` | Get questions for quest |
| POST | `/api/questions/bulk` | Bulk add questions |
| PUT | `/api/questions/:id` | Update question |
| DELETE | `/api/questions/:id` | Delete question |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions` | Submit quiz answers |
| GET | `/api/submissions/averages/:questId` | Get averages for quest |
| GET | `/api/submissions/my/:questId` | Get user's submission |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment & grant access |
| GET | `/api/payments/history` | User's payment history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/submissions/:questId` | View quest submissions |

---

## Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development  # Change to 'production' in production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=quest_app     # Create dedicated DB user, not root
DB_PASSWORD=your_strong_password_here   # Minimum 16 chars
DB_NAME=quest_platform

# JWT - Generate with: openssl rand -hex 32
JWT_SECRET=your_generate_a_strong_jwt_secret_here_at_least_sixty_four_characters_long
JWT_EXPIRES_IN=7d

# Razorpay (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

---

## Security Testing Checklist

### ✅ Authentication Tests
- [ ] Try registering with invalid email formats
- [ ] Try passwords that don't meet complexity requirements
- [ ] Test rate limiting on login (5 attempts per 15 min)
- [ ] Test JWT token expiration

### ✅ Authorization Tests
- [ ] Try accessing admin routes as regular user
- [ ] Try using another user's JWT token
- [ ] Test protected routes without token

### ✅ Input Validation Tests
- [ ] Submit extremely long strings (> max length)
- [ ] Try SQL injection payloads
- [ ] Try XSS payloads in text fields
- [ ] Try negative/zero quest IDs

### ✅ Payment Tests
- [ ] Try paying with modified amounts
- [ ] Test duplicate payment prevention
- [ ] Test payment signature verification

---

## Production Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Set production environment variables** with:
   - Strong JWT secret (64+ chars)
   - Production Razorpay keys
   - Dedicated database user (not root)

3. **Run HTTPS-enabled reverse proxy** (nginx):
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **Run database migrations on production DB**

5. **Start the backend** with NODE_ENV=production:
```bash
cd backend && npm start
```

6. **Serve frontend build** using nginx or similar

---

## Payment Testing

Use Razorpay test credentials:
- **Key ID**: `rzp_test_...`
- **Key Secret**: Use your test key secret
- **Test Card**: 4111 1111 1111 1111 (any future date, any CVV)

---

## Security Commands

```bash
# Install dependencies
cd backend && npm install

# Security audit
npm audit

# Production audit only
npm run security-check

# Generate strong secrets (Linux/Mac)
openssl rand -hex 32
```

---

## License

MIT