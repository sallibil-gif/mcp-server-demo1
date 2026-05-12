# Security Best Practices

This guide covers security hardening, secret management, and production deployment.

---

## 🔐 Secrets Management

### DO's ✅

1. **Use `.env` for secrets** — Never commit `.env` to git
   ```bash
   cp .env.example .env
   # Edit .env with real values
   # .env is automatically gitignored
   ```

2. **Rotate credentials regularly** — Change your GitLab PAT every 90 days
   - GitLab → User Settings → Access Tokens
   - Delete old token, create new one
   - Update `.env` and restart

3. **Use least privilege scopes** — Only grant necessary permissions
   ```
   PAT Scopes:
   ✅ read_api (minimum for pipelines)
   ❌ api (too broad)
   ❌ write_repository (unnecessary)
   ```

4. **Enable token expiration** — Set GitLab PAT to expire in 90 days
   - Gitlab.com → User Settings → Access Tokens
   - Check "Set expiration date"
   - Set to 90 days
   - Add calendar reminder to rotate

5. **Use secrets manager in production**
   - **GitHub Actions**: Use [Secrets](https://docs.github.com/actions/security-guides/encrypted-secrets)
   - **Kubernetes**: Use [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
   - **Docker**: Use [Secrets](https://docs.docker.com/engine/reference/commandline/secret_create/)
   - **AWS**: Use [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
   - **HashiCorp**: Use [Vault](https://www.vaultproject.io/)

### DON'T's ❌

1. **Never commit secrets to git**
   ```bash
   # ❌ DON'T DO THIS
   git add .env && git commit -m "Add token"
   
   # ✅ Instead, only commit .env.example
   git add .env.example
   ```

2. **Never paste credentials in issues, PRs, or chat**
   ```
   ❌ GITLAB_TOKEN=glpat-abc123xyz in issue
   ❌ screenshot with token visible
   ❌ email with credentials
   
   If exposed, rotate immediately!
   ```

3. **Never log sensitive headers**
   ```javascript
   // ❌ BAD
   console.log("Token:", req.headers["private-token"]);
   
   // ✅ GOOD
   logger.info("API request", { status: 200 }); // No token
   ```

4. **Never use one PAT for multiple people**
   ```
   ❌ Shared PAT across team
   ❌ Hardcoded token in shared code
   
   ✅ Per-user tokens
   ✅ Service accounts with unique tokens
   ```

---

## 🛡️ Network & Access Control

### In Development

```bash
# ✅ Only on localhost
npm start  # http://localhost:3000

# ❌ Don't expose to the internet
# Unless explicitly hardened
```

### In Production

1. **Use HTTPS/TLS** — Never expose over HTTP
   ```
   ✅ https://api.example.com/tools/get-pipelines
   ❌ http://api.example.com/tools/get-pipelines
   ```

2. **Add authentication** — Optional but recommended
   ```javascript
   // Example: Bearer token requirement
   const AUTH_TOKEN = process.env.AUTH_TOKEN;
   
   app.use("/tools", (req, res, next) => {
     const token = req.headers.authorization?.split(" ")[1];
     if (token !== AUTH_TOKEN) {
       return res.status(401).json({ error: "Unauthorized" });
     }
     next();
   });
   ```

3. **Enable CORS properly** — Don't use `*` in production
   ```javascript
   // ❌ BAD (allows any origin)
   app.use(cors());
   
   // ✅ GOOD (restrict to known origins)
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
     credentials: true
   }));
   ```

4. **Use rate limiting** — Built-in, configured in `.env`
   ```
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100  # Max 100 requests per window
   ```

---

## 📝 Logging & Audit Trail

### Enable Structured Logging

```bash
# Set log level in .env
LOG_LEVEL=info  # error, warn, info, debug
```

Logs are written to `logs/server-YYYY-MM-DD.log` in JSON format:

```json
{
  "timestamp": "2026-05-12T12:34:56.789Z",
  "level": "info",
  "message": "GET /tools/get-pipelines",
  "status": 200,
  "duration": "45ms",
  "ip": "192.168.1.100",
  "pid": 12345,
  "environment": "production"
}
```

### Security Events to Log

✅ **Log these**:
- API requests with status codes
- Failed authentications (401s)
- Rate limit violations
- Configuration validation
- Token expiration warnings
- Server start/stop events

❌ **Don't log these**:
- API tokens or credentials
- Full request bodies
- Password/secret values
- Sensitive user data

### Monitoring in Production

```bash
# Watch logs in real-time
tail -f logs/server-*.log | jq '.'

# Filter by severity
tail -f logs/server-*.log | jq 'select(.level=="error")'

# Count requests per hour
tail -f logs/server-*.log | jq '.timestamp' | cut -d'T' -f2 | cut -d: -f1 | sort | uniq -c
```

---

## 🔍 Dependency Security

### Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update all dependencies
npm update
```

### Review Security Advisories

```bash
# See detailed vulnerability info
npm audit --detailed
```

### GitHub Dependabot

Enable in your repo:
1. Go to **Settings → Code security and analysis**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**
4. Dependabot will automatically create PRs for vulnerable deps

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] ✅ `.env` is gitignored and never committed
- [ ] ✅ GitLab PAT has **only `read_api` scope**
- [ ] ✅ PAT set to expire in 90 days
- [ ] ✅ `NODE_ENV=production` set
- [ ] ✅ HTTPS/TLS enabled
- [ ] ✅ Rate limiting enabled
- [ ] ✅ Security headers enabled (Helmet)
- [ ] ✅ CORS properly restricted
- [ ] ✅ Logging configured
- [ ] ✅ Authentication enabled (if needed)
- [ ] ✅ Health checks working (`/health`, `/ready`)
- [ ] ✅ Dependencies audited (`npm audit`)
- [ ] ✅ Secrets managed securely (no `.env` in container)
- [ ] ✅ Running as non-root user (Dockerfile)
- [ ] ✅ Resource limits set (memory, CPU)
- [ ] ✅ Log rotation configured
- [ ] ✅ Monitoring/alerting set up
- [ ] ✅ Incident response plan in place

---

## 🚨 Incident Response

### If Credentials Are Exposed

1. **Immediately rotate the token**
   ```bash
   # 1. Delete old token in GitLab
   GitLab → User Settings → Access Tokens → Revoke
   
   # 2. Generate new token
   GitLab → User Settings → Access Tokens → Add new
   
   # 3. Update .env and restart
   ```

2. **Check access logs**
   ```bash
   # Review logs for unauthorized access
   tail -f logs/server-*.log | jq 'select(.status >= 400)'
   ```

3. **Notify team members**
   - Alert: "GitLab PAT was exposed, rotated token"
   - New token details (via secure channel)

4. **Update documentation**
   - Document what happened
   - How you fixed it
   - Preventive measures

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [GitLab Security Docs](https://docs.gitlab.com/ee/security/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)

---

## Questions?

- 📖 See [`SETUP.md`](./SETUP.md) for installation help
- 🐛 Check [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) for common issues
- 💬 Open an [issue](https://github.com/sallibil-gif/mcp-server-demo1/issues)
