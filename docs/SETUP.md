# Setup Guide — MCP GitLab Pipeline Server

This guide walks through installation, configuration, and deployment options.

---

## 📋 Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** 9+ (included with Node.js)
- **GitLab** account (free at gitlab.com)
- **Git** (for cloning the repo)

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/sallibil-gif/mcp-server-demo1.git
cd mcp-server-demo1
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create `.env` Configuration

```bash
cp .env.example .env
```

Edit `.env` and add your GitLab credentials:

```dotenv
GITLAB_BASE_URL=https://gitlab.com/api/v4
GITLAB_TOKEN=glpat-xxxxxxxx...
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
```

### Step 4: Create GitLab Personal Access Token (PAT)

1. Go to **GitLab.com** → **User Settings** → **Access Tokens**
2. Click **Add new token**
3. Fill in:
   - **Token name**: `mcp-server-read`
   - **Scopes**: `read_api` (minimum required)
   - **Expiration**: Set to 90 days for rotation
4. Click **Create personal access token**
5. **Copy the token immediately** (you won't see it again)
6. Paste into `.env` as `GITLAB_TOKEN=glpat-...`

### Step 5: Start the Server

```bash
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
```

---

## ✅ Verify Installation

### Health Check

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T12:34:56.789Z"
}
```

### Readiness Check

```bash
curl http://localhost:3000/ready
```

**Expected response:**
```json
{
  "ready": true,
  "gitlab_api": "connected",
  "timestamp": "2026-05-12T12:34:56.789Z"
}
```

### Test Get Pipelines

```bash
curl "http://localhost:3000/tools/get-pipelines?projectId=12345"
```

Replace `12345` with your actual GitLab project ID.

**Expected response (with pipelines):**
```json
{
  "success": true,
  "count": 3,
  "pipelines": [
    {
      "id": 789,
      "status": "success",
      "created_at": "2026-05-12T10:30:00Z"
    }
  ],
  "timestamp": "2026-05-12T12:34:56.789Z"
}
```

---

## 🐳 Docker Setup

### Option A: Docker Compose (Recommended)

```bash
docker-compose up -d
```

Check logs:
```bash
docker-compose logs -f mcp-gitlab-server
```

Stop:
```bash
docker-compose down
```

### Option B: Manual Docker Build

```bash
docker build -t mcp-gitlab-server .
docker run -p 3000:3000 --env-file .env mcp-gitlab-server
```

---

## ☸️ Kubernetes Deployment

### Create a secret for credentials

```bash
kubectl create secret generic gitlab-credentials \
  --from-literal=GITLAB_TOKEN=glpat-... \
  --from-literal=GITLAB_BASE_URL=https://gitlab.com/api/v4
```

### Deploy using manifest

```bash
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-gitlab-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-gitlab-server
  template:
    metadata:
      labels:
        app: mcp-gitlab-server
    spec:
      containers:
      - name: server
        image: ghcr.io/sallibil-gif/mcp-server-demo1:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: gitlab-credentials
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-gitlab-server
spec:
  selector:
    app: mcp-gitlab-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
EOF
```

Check deployment:
```bash
kubectl get pods -l app=mcp-gitlab-server
kubectl logs -l app=mcp-gitlab-server
```

---

## 🔧 Configuration Options

All configuration is done via environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `GITLAB_BASE_URL` | — | GitLab API base URL |
| `GITLAB_TOKEN` | — | Personal Access Token (required) |
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `LOG_LEVEL` | info | Log verbosity (error, warn, info, debug) |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window in ms (default: 15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

---

## 🧪 Development Mode

For active development with auto-reload:

```bash
npm run dev
```

This uses `node --watch` to restart on file changes.

---

## 📊 Monitoring Logs

Logs are written to `logs/server-YYYY-MM-DD.log` with JSON formatting:

```bash
# View today's logs
tail -f logs/server-$(date +%Y-%m-%d).log

# Pretty-print logs
tail -f logs/server-*.log | jq '.'
```

---

## 🚨 Common Issues

### Issue: `401 Unauthorized`

**Cause**: Invalid or expired GitLab token

**Fix**:
1. Generate new token: **GitLab → User Settings → Access Tokens**
2. Update `.env` with new token
3. Restart server: `npm start`

### Issue: `404 Not Found`

**Cause**: Wrong project ID format or project not visible

**Fix**:
- Use numeric project ID (e.g., `12345`), not path (`namespace/project`)
- Verify project is visible to your GitLab user
- Check PAT scope includes `read_api`

### Issue: Server won't start

**Cause**: Missing environment variables

**Fix**:
```bash
cp .env.example .env
# Edit .env with your credentials
npm start
```

See [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) for more help.

---

## Next Steps

- 📖 Read [`SECURITY.md`](./SECURITY.md) for production hardening
- 🔍 Check [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) for common issues
- 📝 Review [`gitlab-mcp-demo-overview.md`](./gitlab-mcp-demo-overview.md) for architecture details
- 🚀 Deploy to your infrastructure using Docker or Kubernetes

---

## Support

- 💬 Open an [issue](https://github.com/sallibil-gif/mcp-server-demo1/issues)
- 📧 Check GitHub [discussions](https://github.com/sallibil-gif/mcp-server-demo1/discussions)
