# Security Testing Guide

This document provides comprehensive security testing instructions for the Quest Platform.

## Pre-Requisites

1. Install Node.js 18+
2. Install MySQL 8.x
3. Set up environment variables in `.env` file
4. Run migrations and seed data

---

## Testing Commands

### 1. Install Dependencies
```bash
cd backend
npm install
cd ..
npm run install:backend   # if using root package.json
```

### 2. Run Security Audit
```bash
cd backend
npm audit
npm run security-check    # Production-only audit
```

### 3. Build Application
```bash
npm run build
```

---

## Manual Security Testing Checklist

### 🔐 Authentication Security

#### Test 1: Password Complexity
**Expected:** Registration should reject weak passwords

```bash
# Test: Short password (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak"}'

# Test: No uppercase (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"lowercase123"}'

# Test: No number (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"NoNumbers"}'

# Test: Valid password (should succeed)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"ValidPass123","name":"Test User"}'
```

#### Test 2: Email Validation
```bash
# Invalid email formats (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"ValidPass123"}'

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"@test.com","password":"ValidPass123"}'

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test","password":"ValidPass123"}'
```

#### Test 3: Rate Limiting - Authentication
```bash
# Make 6 rapid login attempts (should fail on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@quest.com","password":"wrong"}'
done
```

#### Test 4: Duplicate Registration
```bash
# Register same email twice (should fail on 2nd attempt)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quest.com","password":"ValidPass123"}'
```

### 🛡️ Authorization Testing

#### Test 5: Access Protected Routes Without Token
```bash
# Should return 401
curl http://localhost:5000/api/auth/profile

# Should return 401
curl http://localhost:5000/api/quests/1
```

#### Test 6: Admin Route Access as Regular User
```bash
# Register as regular user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"regular@test.com","password":"ValidPass123"}' | jq -r '.token')

# Try to access admin route (should fail)
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/admin/stats
```

### 📥 Input Validation Testing

#### Test 7: SQL Injection Attempts
```bash
# Try SQL injection in quest_id
curl -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quest_id": "1 OR 1=1"}' \
  http://localhost:5000/api/payments/order

# Try SQL injection in email
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quest.com\' OR \'1\'=\'1","password":"anything"}'
```

#### Test 8: XSS Attempts
```bash
# Try XSS in name field
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"xss@test.com","password":"ValidPass123","name":"<script>alert(1)</script>"}'

# Try XSS in quest title
curl -X POST http://localhost:5000/api/quests \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>","description":"Test","price":100,"is_paid":true}'
```

#### Test 9: Large Payload Attack
```bash
# Try sending a very large payload
LARGE_STRING=$(printf 'A%.0s' {1..10000})
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"large@test.com\",\"password\":\"ValidPass123\",\"name\":\"$LARGE_STRING\"}"
```

### 💳 Payment Security Testing

#### Test 10: Unauthorized Payment
```bash
# Try creating payment order without login (should fail)
curl -X POST http://localhost:5000/api/payments/order \
  -H "Content-Type: application/json" \
  -d '{"quest_id": 1}'
```

#### Test 11: Access Control in Payment
```bash
# Regular user trying to access paid quest
# 1. Create a paid quest (as admin)
# 2. Try to submit payment as different user
# 3. Verify access is granted only after payment
```

### 🕸️ Security Header Testing

```bash
# Check security headers
curl -I http://localhost:5000/api/health | grep -E "^(X-|Content-Security|Strict-Transport|Referrer)"

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Content-Security-Policy: ...
# Permissions-Policy: ...
```

### 📊 Rate Limit Testing

```bash
# Test API rate limit (100 requests)
for i in {1..105}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/health
done
```

---

## Automated Security Tests

### Using curl + jq

Create a test script `test-security.sh`:

```bash
#!/bin/bash

API="http://localhost:5000"
TOKEN=""

echo "=== Security Tests ==="

# Test 1: Rate Limiting
echo "Testing rate limiting..."
for i in {1..6}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@quest.com","password":"wrong"}')
  CODE=$(echo "$RESPONSE" | tail -n1)
  if [ "$CODE" = "429" ]; then
    echo "✓ Rate limiting working (got 429)"
    break
  fi
done

# Test 2: SQL Injection
echo "Testing SQL injection protection..."
RESULT=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test'\'' OR 1=1--","password":"anything"}')
if echo "$RESULT" | grep -q "Invalid credentials"; then
  echo "✓ SQL injection blocked"
else
  echo "✗ Potential SQL injection vulnerability"
fi

echo "Security tests completed"
```

### Run OWASP ZAP (if available)

```bash
# Quick scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:5000
```

---

## Security Checklist Summary

| Test | Status | Notes |
|------|--------|-------|
| Password complexity | ✅ | Min 8 chars, uppercase+lowercase+number |
| Email validation | ✅ | Regex validation |
| SQL injection | ✅ | Parameterized queries |
| XSS protection | ✅ | Input sanitization |
| Rate limiting | ✅ | Auth: 5/15min, API: 100/15min |
| Auth bypass | ✅ | JWT required for protected routes |
| Admin access | ✅ | Role-based protection |
| Security headers | ✅ | Helmet.js + custom headers |
| Large payloads | ✅ | 1MB limit |
| Duplicate registration | ✅ | Unique email constraint |

---

## Security Headers Reference

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer |
| Content-Security-Policy | default-src 'self' | Prevents XSS |
| Permissions-Policy | geolocation=(), microphone=() | Restricts browser features |
| Strict-Transport-Security | max-age=31536000 | Forces HTTPS (production) |

---

## Running Tests Without npm

If npm is not available, manually verify:

1. **Check package.json dependencies are installed:**
   - `node_modules/` directory should exist
   - `helmet` package present in node_modules

2. **Check TypeScript compiles:**
   - Run `tsc --noEmit` to check for errors

3. **Manual API testing:**
   - Use Postman or curl to test endpoints
   - Verify all security tests pass

---

## Security Best Practices

### Code Review Checklist

- [ ] No `.env` files in version control
- [ ] All queries use parameterized inputs
- [ ] Passwords are hashed before storage
- [ ] JWT secret is at least 64 characters
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting on authentication endpoints
- [ ] Input validation on all user inputs
- [ ] Authorization checks on protected routes

### Production Hardening

1. **Environment Variables:**
   - Generate strong JWT_SECRET: `openssl rand -hex 32`
   - Use production Razorpay keys
   - Create dedicated DB user

2. **Database:**
   - Enable SSL connections
   - Regular backups
   - Use connection pooling

3. **Server:**
   - HTTPS with valid certificate
   - Reverse proxy (nginx)
   - Firewall configured
   - Rate limiting at server level

4. **Monitoring:**
   - Log security events
   - Alert on repeated auth failures
   - Monitor payment failures