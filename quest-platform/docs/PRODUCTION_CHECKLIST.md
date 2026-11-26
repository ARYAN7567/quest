# Production Deployment Checklist

This checklist ensures the Quest Platform is properly secured and configured for production deployment.

---

## 🔒 Environment Configuration

### 1. Environment Variables

- [ ] Generate strong JWT secret (64+ characters)
  ```bash
  openssl rand -hex 32
  ```

- [ ] Set production Razorpay keys
  - Key ID (starts with `rzp_live_`)
  - Key Secret

- [ ] Configure database credentials
  - Create dedicated MySQL user (not root)
  - Use strong password (16+ chars)
  - Enable SSL connections

- [ ] Update CORS origins
  ```env
  FRONTEND_URL=https://yourdomain.com
  ADMIN_URL=https://admin.yourdomain.com
  ```

- [ ] Set production environment
  ```env
  NODE_ENV=production
  ```

### 2. Create .env File

```bash
cd backend
cp .env.example .env
# Edit with production values
```

---

## 🗄️ Database Setup

### 1. Create Dedicated User

```sql
-- Connect to MySQL as root
CREATE DATABASE quest_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'quest_app'@'localhost' IDENTIFIED BY 'strong_password_here';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX
ON quest_platform.* TO 'quest_app'@'localhost';

FLUSH PRIVILEGES;
```

### 2. Run Migrations

```bash
npm run db:migrate
```

### 3. Create Admin User

```sql
USE quest_platform;

-- Update admin email/password directly in DB
UPDATE users SET role = 'admin' WHERE email = 'admin@quest.com';
```

### 4. Enable SSL (MySQL 8.0+)

Add to my.cnf:
```ini
[mysqld]
require_secure_transport = ON
ssl-ca = /path/to/ca.pem
ssl-cert = /path/to/server-cert.pem
ssl-key = /path/to/server-key.pem
```

---

## 🌐 Reverse Proxy Setup (nginx)

### 1. Install and Configure nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files for frontend
    location /static/ {
        alias /path/to/frontend/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🚀 Application Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Start Backend Server

Using PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start backend/dist/index.js --name "quest-backend"

# Save PM2 configuration
pm2 startup
pm2 save

# View logs
pm2 logs quest-backend
```

PM2 ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'quest-backend',
    script: './backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G'
  }]
};
```

### 3. Serve Frontend

Build and serve static files:

```bash
cd frontend
npm run build
# Copy to serving directory or configure nginx
```

---

## 🔥 Firewall Configuration

### UFW (Ubuntu)

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow from 127.0.0.1 to any port 5000
```

### MySQL Firewall

Only allow connections from localhost or application server.

---

## 📊 Monitoring Setup

### 1. Process Monitoring

```bash
# PM2 monitoring
pm2 monit

# Or use a services file
sudo tee /etc/systemd/system/quest-backend.service << EOF
[Unit]
Description=Quest Platform Backend
After=network.target

[Service]
Type=simple
User=questuser
WorkingDirectory=/path/to/quest-platform
ExecStart=/usr/bin/node /path/to/quest-platform/backend/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable quest-backend
sudo systemctl start quest-backend
```

### 2. Log Rotation

```bash
sudo tee /etc/logrotate.d/quest-platform << EOF
/var/log/quest-platform/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 questuser questuser
}
EOF
```

### 3. Security Monitoring

- Monitor failed login attempts
- Alert on rate limit triggers
- Monitor payment verification failures

---

## 🧹 Cleanup Commands

### Stop and Clean

```bash
# Stop PM2 processes
pm2 stop all
pm2 delete all

# Stop systemd service
sudo systemctl stop quest-backend
sudo systemctl disable quest-backend

# Clean build
npm run clean
```

---

## ✅ Final Production Verification

### 1. HTTPS Check
```bash
curl -I https://yourdomain.com/api/health
# Should show: Strict-Transport-Security header
```

### 2. Security Headers Check
```bash
curl -I https://yourdomain.com/api/health | grep X-Frame-Options
curl -I https://yourdomain.com/api/health | grep X-Content-Type-Options
```

### 3. SSL Certificate Check
```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 4. Database Connection Test
```bash
mysql -h your-host -u quest_app -p quest_platform -e "SELECT 1;"
```

### 5. API Health Check
```bash
curl -I https://yourdomain.com/api/health
# Expected: 200 OK, status: ok
```

---

## 🚨 Emergency Procedures

### Stop Application
```bash
# PM2
pm2 stop quest-backend

# Systemd
sudo systemctl stop quest-backend
```

### Rollback Deployment
```bash
# If using git tags
git checkout <previous-good-version>
npm run build
pm2 restart quest-backend
```

### Database Backup & Restore
```bash
# Backup
mysqldump -u quest_app -p --single-transaction quest_platform > backup.sql

# Restore
mysql -u quest_app -p quest_platform < backup.sql
```

---

## 📋 Post-Deployment Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall rules configured
- [ ] Rate limiting active
- [ ] Security headers present
- [ ] Database backups scheduled
- [ ] Monitoring active
- [ ] Admin created and tested
- [ ] Payment flow tested (test mode)
- [ ] User registration tested
- [ ] Quest creation tested (as admin)
- [ ] Quiz submission tested
- [ ] Results calculation verified

---

## 📞 Support Contacts

- **JWT/Authentication Issues**: Check token expiration and secret
- **Payment Issues**: Verify Razorpay keys and webhook URL
- **Database Issues**: Check connection pool and SSL settings
- **Rate Limits**: Adjust limits in `security.ts` if needed

---

*Last updated: November 2026*
*Version: 1.0*