# Troubleshooting Guide

Common issues and their solutions.

---

## 🚀 Server Won't Start

### Issue: `Error: Missing required environment variables`

**Cause**: Missing `.env` file or required variables

**Solution**:
```bash
cp .env.example .env
# Edit .env with your GitLab credentials
npm start
```

**Required variables**:
- `GITLAB_BASE_URL` — e.g., `https://gitlab.com/api/v4`
- `GITLAB_TOKEN` — Your GitLab PAT

---

### Issue: `Address already in use :::3000`

**Cause**: Port 3000 is already in use

**Solution 1 — Use different port**:
```bash
PORT=3001 npm start
```

**Solution 2 — Kill existing process**:
```bash
# Find process on port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Start server
npm start
```

**Solution 3 — Check what's using the port**:
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

---

## 🔐 Authentication Issues

### Issue: `401 Unauthorized`

**Cause**: Invalid or missing GitLab token

**Checklist**:
1. ✅ Token exists: `grep GITLAB_TOKEN .env`
2. ✅ Token format: Starts with `glpat-`
3. ✅ Token scope: Has **`read_api`** permission
4. ✅ Token not expired: Check GitLab → User Settings → Access Tokens

**Fix**:
```bash
# Generate new token in GitLab
# Settings → Access Tokens → Add new token
# Scopes: read_api
# Expiration: 90 days

# Update .env
nano .env  # or your editor

# Restart server
npm start
```

### Issue: `403 Forbidden`

**Cause**: Token lacks required permissions

**Solution**:
1. Go to **GitLab → User Settings → Access Tokens**
2. Find your token
3. Check **Scopes** include `read_api`
4. If not, create new token with correct scopes

---

## 🔍 API Request Issues

### Issue: `404 Not Found` on `/tools/get-pipelines`

**Cause 1**: Wrong project ID format
```bash
# ❌ WRONG (path format)
curl "http://localhost:3000/tools/get-pipelines?projectId=namespace/project"

# ✅ CORRECT (numeric ID)
curl "http://localhost:3000/tools/get-pipelines?projectId=12345"
```

**Find numeric project ID**:
1. Go to your GitLab project
2. Look at URL: `https://gitlab.com/namespace/project-name`
3. Go to **Project Settings → General → Project ID**
4. Copy the numeric ID

**Cause 2**: Project not visible to token user
```bash
# Verify token can access project
curl -H "PRIVATE-TOKEN: glpat-..." \
  https://gitlab.com/api/v4/projects/12345

# If 404, project is not visible
# Check: Project visibility, user permissions
```

### Issue: `400 Bad Request - projectId is required`

**Cause**: Missing `projectId` query parameter

**Solution**:
```bash
# ❌ WRONG (no projectId)
curl "http://localhost:3000/tools/get-pipelines"

# ✅ CORRECT (with projectId)
curl "http://localhost:3000/tools/get-pipelines?projectId=12345"
```

### Issue: Empty pipelines list

**Cause**: Project has no pipelines yet

**Solution**:
1. Go to your GitLab project
2. Check **CI/CD → Pipelines** — Are there any pipelines?
3. If not, push a commit with `.gitlab-ci.yml` to trigger a pipeline
4. Wait for pipeline to start
5. Try the API again

---

## 🌐 Network Issues

### Issue: `ECONNREFUSED` or `connect ECONNREFUSED 127.0.0.1:3000`

**Cause**: Server is not running

**Solution**:
```bash
# Start the server
npm start

# You should see:
# 🚀 Server running on http://localhost:3000
```

### Issue: `ENOTFOUND` or `getaddrinfo ENOTFOUND gitlab.com`

**Cause**: Network connectivity issue

**Solution**:
```bash
# Test internet connectivity
ping gitlab.com

# Test GitLab API directly
curl https://gitlab.com/api/v4/user \
  -H "PRIVATE-TOKEN: glpat-..."

# If fails, check:
# 1. Internet connection
# 2. GitLab.com status (status.gitlab.com)
# 3. Firewall rules
# 4. Proxy settings
```

### Issue: `TIMEOUT` or request taking too long

**Cause**: GitLab API is slow or unreachable

**Solution**:
1. Check GitLab status: https://status.gitlab.com
2. Try the API directly:
   ```bash
   curl -I https://gitlab.com/api/v4/projects/12345/pipelines \
     -H "PRIVATE-TOKEN: glpat-..."
   ```
3. Increase timeout (if needed):
   ```javascript
   // In gitlab.js, adjust axios timeout
   timeout: 30000  // 30 seconds
   ```

---

## 🐳 Docker Issues

### Issue: `docker: command not found`

**Solution**: Install Docker
- **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: `sudo apt-get install docker.io`

### Issue: `Cannot connect to Docker daemon`

**Solution**:
```bash
# Start Docker daemon
# macOS: Open Docker app
# Linux: sudo systemctl start docker

# Test Docker
docker ps
```

### Issue: Container exits immediately

**Check logs**:
```bash
docker-compose logs mcp-gitlab-server
```

**Common causes**:
- Missing `.env` file
- Invalid environment variables
- Port 3000 already in use

**Fix**:
```bash
# Verify .env exists
ls -la .env

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📝 Logs & Debugging

### View Server Logs

```bash
# Real-time logs
tail -f logs/server-$(date +%Y-%m-%d).log

# Pretty-print JSON logs
tail -f logs/server-*.log | jq '.'

# Filter by log level
tail -f logs/server-*.log | jq 'select(.level=="error")'

# Filter by request
tail -f logs/server-*.log | jq 'select(.message | contains("get-pipelines"))'
```

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug npm start

# This will show:
# - All API requests/responses
# - GitLab API calls
# - Configuration details
```

### Check Environment Variables

```bash
# View all env vars
npm run env | grep -i gitlab

# Or in Node.js
node -e "console.log(process.env)"
```

---

## 🧪 Testing the API

### Manual Testing

```bash
# Health check
curl http://localhost:3000/health

# Server info
curl http://localhost:3000/

# Get pipelines
curl "http://localhost:3000/tools/get-pipelines?projectId=12345"

# With authentication (if enabled)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/tools/get-pipelines?projectId=12345"

# Verbose output
curl -v "http://localhost:3000/tools/get-pipelines?projectId=12345"
```

### Using httpie (prettier output)

```bash
# Install httpie
pip install httpie

# Make requests
http http://localhost:3000/
http "http://localhost:3000/tools/get-pipelines?projectId=12345"

# With headers
http http://localhost:3000/ "Authorization: Bearer token"
```

### Test GitLab API directly

```bash
# Verify your token works
curl https://gitlab.com/api/v4/user \
  -H "PRIVATE-TOKEN: glpat-..."

# Check specific project
curl https://gitlab.com/api/v4/projects/12345 \
  -H "PRIVATE-TOKEN: glpat-..."

# Check project pipelines
curl https://gitlab.com/api/v4/projects/12345/pipelines \
  -H "PRIVATE-TOKEN: glpat-..."
```

---

## 💪 Performance Issues

### Issue: Server is slow

**Check**:
1. CPU usage: `top` or `Activity Monitor`
2. Memory usage: `free -h` or `Activity Monitor`
3. Disk space: `df -h`
4. Network: `ping gitlab.com`

**Solutions**:
```bash
# Monitor resource usage
node --max-old-space-size=512 server.js

# Restart server
npm start

# Check for memory leaks
npm run dev  # Uses memory-watch
```

### Issue: High request latency

**Cause**: GitLab API is slow

**Check GitLab status**:
```bash
curl https://status.gitlab.com/api/v1/components.json
```

**Solutions**:
1. Add caching (if needed)
2. Increase timeout
3. Use read replicas (enterprise)
4. Contact GitLab support

---

## 🆘 Still Having Issues?

1. **Check existing issues**: [GitHub Issues](https://github.com/sallibil-gif/mcp-server-demo1/issues)
2. **Create an issue** with:
   - Error message (full output)
   - Steps to reproduce
   - Environment (OS, Node version, Docker, etc.)
   - Relevant logs
3. **Start a discussion**: [GitHub Discussions](https://github.com/sallibil-gif/mcp-server-demo1/discussions)

---

## 📚 References

- [Express.js Debugging](https://expressjs.com/en/guide/debugging.html)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [GitLab API Troubleshooting](https://docs.gitlab.com/ee/api/troubleshooting.html)
- [Docker Troubleshooting](https://docs.docker.com/config/containers/logging/)
