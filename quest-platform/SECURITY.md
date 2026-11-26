# Security Documentation for Quest Platform

This document outlines all security measures implemented in the Quest Platform, including authentication, authorization, input validation, and other protective measures.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation](#input-validation)
4. [Rate Limiting](#rate-limiting)
5. [Security Headers](#security-headers)
6. [Database Security](#database-security)
7. [API Security](#api-security)
8. [Payment Security](#payment-security)
9. [Production Security Checklist](#production-security-checklist)
10. [Security Commands](#security-commands)

---

## Security Architecture

The Quest Platform follows a defense-in-depth approach with multiple security layers:

```
Internet -> Reverse Proxy (nginx) -> HTTPS/TLS -> Rate Limiting -> 
Security Headers -> Input Validation -> Authentication -> Authorization -> 
Database Layer -> Application Logic
```

### Key Security Components

- **JWT Authentication**: Token-based stateless authentication
- **Password Hashing**: bcrypt with 12 rounds (salted)
- **Role-Based Access Control**: User vs Admin roles
- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: Prevents brute force and DoS attacks
- **Security Headers**: Helmet.js + custom headers

---

## Authentication & Authorization

### JWT Implementation

```typescript
// Token payload structure
{
  id: userId,
  email: userEmail,
  role: 'user' | 'admin'
}

// Token expiration: 7 days (configurable via JWT_EXPIRES_IN env var)
```

### Password Policy

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Maximum 128 characters

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 12 (increased from 10 for enhanced security)
- Never stored in plain text

### Authorization Guards

| Route | Middleware | Accessible By |
|-------|------------|---------------|
| `/api/auth/*` | None (public) | All users (register/login) |
| `/api/quests/*` | `authenticateToken` | Authenticated users |
| `/api/questions/*` | `authenticateToken` | Authenticated users |
| `/api/submissions/*` | `authenticateToken` | Authenticated users |
| `/api/payments/*` | `authenticateToken` | Authenticated users |
| `/api/admin/*` | `authenticateToken`, `requireAdmin` | Admin users only |

---

## Input Validation

### Validation Middleware Located In: `src/middleware/validation.ts`

#### Auth Validation (`validateAuth`)

| Field | Rules |
|-------|-------|
| email | Required, valid email format, max 254 chars |
| password | Required, 8-128 chars, uppercase+lowercase+number |
| name | Optional, max 100 chars, alphanumeric only |

#### Quest Validation (`validateQuest`)

| Field | Rules |
|-------|-------|
| title | Required, 3-200 chars |
| description | Required, max 5000 chars |
| price | Non-negative, max 9,99,999 INR |
| is_paid | Boolean |
| duration_minutes | 1-1440 minutes |

#### Question Validation (`validateQuestion`)

| Field | Rules |
|-------|-------|
| question_text | Required, max 2000 chars |
| options | Array of 2-10 strings, each max 500 chars |
| correct_option_index | Must be valid index in options array |
| question_order | Non-negative, max 1000 |

#### Submission Validation (`validateSubmission`)

| Field | Rules |
|-------|-------|
| quest_id | Positive integer |
| answers | Object mapping question IDs to option indices |

### Input Sanitization

Located in: `src/middleware/security.ts`

Sanitization removes:
- HTML tags
- Null bytes
- Extra whitespace
- Dangerous characters

---

## Rate Limiting

### Configuration (`src/middleware/security.ts`)

| Endpoint | Window | Max Requests | Message |
|----------|--------|--------------|---------|
| `/api/auth/*` | 15 min | 5 | Too many auth attempts |
| `/api/payments/*` | 1 hour | 10 | Too many payment requests |
| `/api/*` (general) | 15 min | 100 | Rate limit exceeded |

### Rate Limit Headers

All responses include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests left in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730548800
```

---

## Security Headers

Implemented via helmet.js and custom middleware in `src/middleware/security.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | DENY | Prevents clickjacking |
| `X-Content-Type-Options` | nosniff | Prevents MIME sniffing |
| `X-XSS-Protection` | 1; mode=block | XSS filter (legacy browsers) |
| `Referrer-Policy` | strict-origin-when-cross-origin | Controls referrer info |
| `Content-Security-Policy` | Custom policy | Prevents XSS, injection |
| `Permissions-Policy` | Restricted | Disables unused features |
| `Strict-Transport-Security` | max-age=31536000 | Forces HTTPS (production) |

### Content Security Policy (CSP)

```http
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self';
  frame-src https://checkout.razorpay.com;
```

---

## Database Security

### Parameterized Queries

All database queries use parameterized statements to prevent SQL injection:

```typescript
// SAFE - Parameterized
await pool.query('SELECT * FROM users WHERE email = ?', [email]);

// NEVER DO THIS - String concatenation
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Database Schema Security

Tables use:
- Auto-increment primary keys (never user IDs)
- Hashed passwords (bcrypt)
- Timestamps for audit
- Foreign key constraints

### Environment Variables for DB

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=quest_app_user      # Dedicated user, not root
DB_PASSWORD=strong_password # Complex password
DB_NAME=quest_platform
```

---

## API Security

### Request Size Limits

- Maximum body size: 1MB
- Maximum content-length: Verified before parsing

### Error Handling

**Production Mode:**
- Generic error messages exposed to clients
- Detailed errors logged server-side only

```json
// Production error response
{
  "message": "Internal server error"
}

// Development error response includes stack trace
{
  "message": "Internal server error",
  "error": "Error message",
  "stack": "Stack trace..."
}
```

### CORS Configuration

```typescript
{
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-*'],
  maxAge: 86400
}
```

---

## Payment Security

### Razorpay Integration

1. **Order Creation**: Amount calculated server-side from quest price
2. **Signature Verification**: HMAC-SHA256 verification
3. **Status Updates**: Payment status tracked in database

### Payment Flow Security

```
1. User requests access to paid quest
2. Server verifies authentication + quest existence
3. Server checks if user has existing access
4. Server creates Razorpay order (amount from DB, not client)
5. Client completes payment on Razorpay
6. Server verifies Razorpay signature
7. Server grants access (database transaction)
```

### Security Measures

- Amount verified against database (never trust client)
- Signature verification prevents tampering
- Duplicate access prevention
- Payment status tracked (pending → completed/failed)

---

## Production Security Checklist

### Environment Configuration

- [ ] Generate strong JWT secret (64+ random characters)
- [ ] Use production Razorpay API keys
- [ ] Create dedicated database user (not root)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set correct CORS origins
- [ ] Set `NODE_ENV=production`

### Database Security

- [ ] Enable MySQL SSL connections
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Use connection pooling

### Server Security

- [ ] Set up nginx reverse proxy
- [ ] Configure rate limiting at server level
- [ ] Enable HSTS preload submission
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation

### Application Security

- [ ] Run `npm audit --production` regularly
- [ ] Update dependencies for security patches
- [ ] Set up security.txt (`/.well-known/security.txt`)
- [ ] Implement CSP reporting endpoint
- [ ] Configure CORS for specific origins only

### Monitoring & Logging

- [ ] Set up application logging (no sensitive data)
- [ ] Configure request logging
- [ ] Set up alerting for repeated auth failures
- [ ] Monitor payment verification failures

---

## Security Commands

### Install Dependencies

```bash
cd backend
npm install
```

### Security Audit

```bash
# Check for vulnerabilities
npm audit

# Production-only audit (no dev dependencies)
npm audit --production

# Fix vulnerabilities
npm audit fix
```

### Environment Setup

```bash
# Copy example environment
cp backend/.env.example backend/.env

# Edit with your credentials:
# - Strong JWT_SECRET (at least 64 chars)
# - MySQL root password
# - Razorpay keys from dashboard
```

### Generate Strong Secrets

```bash
# Linux/Mac (in terminal)
openssl rand -hex 32  # 64 char JWT secret

# Windows PowerShell
[bitconverter]::ToString((New-Object byte[] 32 | ForEach-Object { Get-Random -Maximum 256 })) -replace '-',''
```

### Database Setup (Secure)

```sql
-- Create dedicated user with limited privileges
CREATE USER 'quest_app'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON quest_platform.* TO 'quest_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## Security Testing

### Manual Testing Steps

1. **Authentication Tests**
   - Try registering with invalid email formats
   - Try passwords that don't meet complexity requirements
   - Test rate limiting on login (5 attempts per 15 min)

2. **Authorization Tests**
   - Try accessing admin routes as regular user
   - Try using another user's JWT token
   - Test token expiration

3. **Input Validation Tests**
   - Submit extremely long strings
   - Try SQL injection payloads
   - Try XSS payloads in text fields

4. **Payment Tests**
   - Try paying with modified amounts
   - Test duplicate payment prevention
   - Test payment signature verification

### Automated Security Tools

For production, consider adding:
- **OWASP ZAP** or **Burp Suite** for penetration testing
- **ESLint** with security plugins
- **Snyk** for dependency scanning

---

## Security Contact

For security issues or vulnerabilities:
- Report to: security@questplatform.com
- PGP Key: Available upon request

> **Responsible Disclosure**: Please report vulnerabilities privately before public disclosure.

---

*Last updated: November 2026*
*Version: 1.0*