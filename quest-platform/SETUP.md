# Setup Instructions for Quest Platform

## Prerequisites Installation

### 1. Install Node.js (Required)
Download and install from: https://nodejs.org/
- Choose **LTS version** (v20+)
- Verify installation:
```powershell
node --version
npm --version
```

### 2. Install MySQL (Required)
Download and install from: https://dev.mysql.com/downloads/installer/
- Choose **MySQL 8.0+**
- During setup, set root password (remember it!)
- Verify:
```powershell
mysql --version
```

### 3. Create Database
```powershell
mysql -u root -p
```
Then in MySQL shell:
```sql
CREATE DATABASE quest_platform;
EXIT;
```

### 4. Get Razorpay Keys (For Payments)
1. Sign up at https://dashboard.razorpay.com/
2. Go to Settings > API Keys
3. Generate Test Keys
4. Copy Key ID and Key Secret

---

## Configuration

### 1. Backend Environment
```powershell
cd C:\Users\user\quest-platform\backend
copy .env.example .env
```

Edit `backend/.env` with your credentials:
```env
# Server
PORT=5000
NODE_ENV=development

# Database - UPDATE THESE
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=quest_platform

# JWT - CHANGE IN PRODUCTION
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Razorpay - GET FROM DASHBOARD
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx

# Frontend URLs
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

### 2. Install Dependencies
```powershell
# From project root
cd C:\Users\user\quest-platform
npm run install:all
```

### 3. Run Migrations & Seed
```powershell
npm run db:migrate
npm run db:seed
```

### 4. Start Development
```powershell
# Terminal 1: Backend + User Frontend
npm run dev

# Terminal 2: Admin Panel (separate terminal)
cd frontend && npm run admin
```

---

## Access URLs
- **User App**: http://localhost:5173
- **Admin Panel**: http://localhost:5174
- **API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## Default Admin Login
- Email: `admin@quest.com`
- Password: `admin123`

---

## Production Security Checklist

### Environment Variables
- [ ] Generate strong JWT_SECRET (64+ chars)
- [ ] Use production Razorpay keys
- [ ] Set NODE_ENV=production
- [ ] Use strong DB password
- [ ] Configure proper CORS origins

### Database
- [ ] Create dedicated DB user (not root)
- [ ] Enable SSL connections
- [ ] Regular backups

### Server
- [ ] Use PM2 or similar process manager
- [ ] Set up reverse proxy (nginx)
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall

### Application
- [ ] Rate limiting on auth endpoints
- [ ] Input validation/sanitization
- [ ] Secure headers (helmet.js)
- [ ] Error logging (no stack traces in production)
- [ ] Monitor with APM

---

## Testing Checklist

### Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to login
- [ ] Admin routes blocked for regular users

### Quests
- [ ] View quest list
- [ ] Free quest accessible without payment
- [ ] Paid quest shows payment prompt
- [ ] Payment flow works (Razorpay test mode)
- [ ] Quest access granted after payment

### Quiz Taking
- [ ] Navigate between questions
- [ ] Select answers
- [ ] Submit quiz
- [ ] View results with score

### Admin Panel
- [ ] Login as admin
- [ ] View dashboard stats
- [ ] Create/edit/delete quests
- [ ] Add/edit/delete questions
- [ ] View user list
- [ ] View submission analytics

### Averages
- [ ] Submit multiple attempts (different users)
- [ ] Check /api/submissions/averages/:questId
- [ ] Verify correct percentage calculations