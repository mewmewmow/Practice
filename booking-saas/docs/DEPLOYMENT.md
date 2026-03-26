# Deployment Guide - SmartBook SaaS

## Quick Deploy (5 minutes)

### Option A: Railway (Easiest)

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy Backend**
```bash
# Backend variables
DATABASE_URL=postgresql://...
JWT_SECRET=<generate-random>
STRIPE_SECRET_KEY=sk_test_...
```

3. **Deploy Frontend**
```bash
# Frontend variables
REACT_APP_API_URL=https://smartbook-api.railway.app/api
REACT_APP_STRIPE_KEY=pk_test_...
```

4. **Deploy Admin**
```bash
# Same as frontend
```

### Option B: Docker + Any Host

```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["npm", "start"]
```

Deploy with: `docker build -t smartbook-api . && docker run -p 3001:3001 smartbook-api`

---

## Environment Configuration

### Production Variables (.env)

**Backend:**
```
DATABASE_URL=postgresql://prod-user:pass@prod-host:5432/smartbook
NODE_ENV=production
PORT=3001
JWT_SECRET=<64-char-random-string>
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CORS_ORIGIN=https://app.smartbook.com,https://admin.smartbook.com
```

**Frontend:**
```
REACT_APP_API_URL=https://api.smartbook.com/api
REACT_APP_STRIPE_KEY=pk_live_xxx
```

---

## Database Setup

### PostgreSQL Cloud Options
1. **AWS RDS** - $20/mo starting
2. **Railway Database** - Included in Railway
3. **Heroku Postgres** - $50/mo starting
4. **DigitalOcean Managed DB** - $15/mo

### Initialize Database
```bash
psql $DATABASE_URL < backend/scripts/schema.sql
```

---

## SSL/HTTPS Setup

All production deployments MUST use HTTPS.

**Options:**
- Railway: Auto SSL
- Vercel: Auto SSL
- Heroku: Auto SSL
- Self-hosted: Let's Encrypt (free)

---

## Monitoring & Uptime

```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    database: dbConnected ? 'ok' : 'error'
  });
});

// Monitoring services:
// - Uptimerobot.com (free tier)
// - Pingdom (paid)
// - New Relic (paid)
```

---

## Scaling Strategy

**Stage 1 (0-100 customers):**
- Single server + managed DB
- Cost: ~$50-100/month

**Stage 2 (100-1000 customers):**
- Load balancer + 2-3 API servers
- Separate database server
- Redis cache for sessions
- Cost: ~$200-500/month

**Stage 3 (1000+ customers):**
- Microservices architecture
- CDN for static assets
- Database read replicas
- Cost: ~$1000+/month

---

## Backup & Disaster Recovery

**Database Backups:**
```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20260326.sql
```

**Configure automated backups:**
- All cloud providers have built-in backup features
- Minimum: Daily backups, 30-day retention
- Test restore monthly

---

## Security Checklist

- [ ] HTTPS/SSL enabled
- [ ] Environment variables not in code
- [ ] Database backups encrypted
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Sensitive logs not exposed
- [ ] API keys rotated monthly
- [ ] DDoS protection enabled
- [ ] Security headers set (helmet.js)
- [ ] Input validation on all endpoints

---

## Custom Domain Setup

1. Register domain: namecheap.com, godaddy.com
2. Point DNS to your hosting:
   - Railway: CNAME to your railway.app domain
   - Vercel: Add domain in project settings
3. Enable SSL certificate
4. Set up email (optional): mailgun.com, sendgrid.com

Example DNS Records:
```
api.smartbook.com    CNAME    smartbook-api.railway.app
app.smartbook.com    CNAME    smartbook-app.vercel.app
admin.smartbook.com  CNAME    smartbook-admin.vercel.app
```

---

## Cost Breakdown (Monthly)

| Service | Cost |
|---------|------|
| Database (managed) | $20 |
| Backend hosting | $10 |
| Frontend hosting | Free |
| Admin hosting | Free |
| Domain | $1 |
| Email service | $15 |
| Monitoring | $10 |
| **TOTAL** | **~$56/month** |

*Note: Costs scale with usage. This assumes <100M requests/month*

---

## Continuous Deployment (CI/CD)

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      - uses: actions/github-script@v6
        with:
          script: |
            // Deploy to Railway/Vercel via API
```

---

## Troubleshooting

**Issue:** Backend 500 error
```
Solution: Check logs
- Railway: View logs in dashboard
- Heroku: heroku logs --tail
- Self-hosted: tail -f /var/log/app.log
```

**Issue:** CORS errors on frontend
```
Solution: Update CORS_ORIGIN in backend .env
Add frontend URL: https://app.smartbook.com
```

**Issue:** Database connection refused
```
Solution: Verify DATABASE_URL is correct
- Include username, password, host, port, database
- Test locally: psql $DATABASE_URL
```

---

## Post-Deployment Checklist

- [ ] Test signup/login flow
- [ ] Test payment processing (Stripe test mode)
- [ ] Verify email notifications work
- [ ] Check mobile responsiveness
- [ ] Monitor error rates
- [ ] Set up monitoring alerts
- [ ] Create runbook for incidents
- [ ] Document deployment process
- [ ] Set up analytics tracking
- [ ] Enable automatic backups
