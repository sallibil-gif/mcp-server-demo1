# 🚀 GitLab Pipeline MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

A lightweight, secure, production-ready HTTP service that exposes GitLab REST API endpoints as MCP-style tools. Built with **Node.js + Express** for easy integration with AI agents, CLI tools, and automation scripts.

---

## ✨ Key Features

- 🔒 **Secure by default** — Environment variables, rate limiting, security headers
- 🚀 **Production-ready** — Docker & Kubernetes support, health checks, graceful shutdown
- 📦 **Easy deployment** — Docker Compose for local dev, ready for production
- 🧪 **Well-tested** — GitHub Actions CI/CD pipeline
- 📚 **Fully documented** — 4 comprehensive guides + troubleshooting
- ⚡ **High performance** — Structured logging, optimized error handling
- 🔄 **Extensible** — Add new GitLab endpoints in minutes
- 🛡️ **OWASP compliant** — Security headers, input validation, proper error handling

---

## 📖 Quick Start

### 🏃 30-Second Setup

```bash
# Clone & setup
git clone https://github.com/sallibil-gif/mcp-server-demo1.git
cd mcp-server-demo1
cp .env.example .env

# Edit .env with your GitLab Personal Access Token
nano .env

# Start with Docker Compose (recommended)
docker-compose up -d

# Or with npm
npm install && npm start
```

**Test it:**
```bash
curl "http://localhost:3000/tools/get-pipelines?projectId=12345"
```

---

## 🎯 Usage Examples

### Get Project Pipelines

```bash
curl "http://localhost:3000/tools/get-pipelines?projectId=12345"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "pipelines": [
    {
      "id": 987,
      "status": "success",
      "ref": "main",
      "created_at": "2026-05-12T10:30:00Z"
    }
  ]
}
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Readiness Check (K8s)

```bash
curl http://localhost:3000/ready
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITLAB_BASE_URL` | — | GitLab API base URL (required) |
| `GITLAB_TOKEN` | — | Personal Access Token (required) |
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `LOG_LEVEL` | info | Log verbosity (error, warn, info, debug) |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

### Getting a GitLab Personal Access Token

1. Go to **https://gitlab.com/user/settings/personal_access_tokens**
2. Click **Add new token**
3. Set scopes to **`read_api`** (minimum required)
4. Set expiration to **90 days** (for rotation)
5. Copy token and add to `.env`: `GITLAB_TOKEN=glpat-xxx`

⚠️ **Never commit `.env` or share tokens!**

---

## 🚀 Deployment Options

### Local Development

```bash
# Start with auto-reload
npm run dev

# Or traditional start
npm start
```

### Docker

```bash
# Build
docker build -t mcp-gitlab-server .

# Run
docker run -p 3000:3000 --env-file .env mcp-gitlab-server
```

### Docker Compose (Recommended)

```bash
# Start (includes health checks, logging, resource limits)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Kubernetes

```bash
# Create secret
kubectl create secret generic gitlab-creds \
  --from-literal=GITLAB_TOKEN=glpat-xxx

# Deploy (see SETUP.md for complete manifest)
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP.md](docs/SETUP.md)** | Installation, Docker, Kubernetes, configuration |
| **[SECURITY.md](docs/SECURITY.md)** | Security best practices, secrets, incident response |
| **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** | Common issues, debugging, solutions |
| **[gitlab-mcp-demo-overview.md](docs/gitlab-mcp-demo-overview.md)** | Architecture, workflow, design decisions |

---

## 🔒 Security

✅ **Built-in security features:**
- Environment-based secret management (no hardcoded tokens)
- Rate limiting (configurable, default 100 req/15 min)
- Security headers via Helmet.js (OWASP compliance)
- Input validation on all endpoints
- Structured logging (sensitive data never logged)
- Non-root Docker container execution
- Graceful error handling

📖 **See [SECURITY.md](docs/SECURITY.md) for:**
- Hardening guidelines
- Secret rotation procedures
- Incident response playbook
- Production checklist

---

## 🛠️ Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Lint & Format

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues
npm run format       # Format code
npm run format:check # Check formatting
```

### Watch Mode

```bash
npm run dev  # Auto-restart on file changes
```

### Security Audit

```bash
npm audit              # Check dependencies
npm audit fix          # Fix vulnerabilities
npm run audit:fix      # Alternative
```

---

## 🔄 Extending with New Endpoints

### Add GitLab API Function

In `gitlab.js`:
```javascript
export async function fetchProjectIssues(projectId) {
  const response = await axios.get(
    `${process.env.GITLAB_BASE_URL}/projects/${projectId}/issues`,
    { headers: { "PRIVATE-TOKEN": process.env.GITLAB_TOKEN } }
  );
  return response.data;
}
```

### Add Express Route

In `server.js`:
```javascript
app.get("/tools/get-issues", async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, error: "projectId required" });
    }
    const data = await fetchProjectIssues(projectId);
    return res.json({ success: true, count: data.length, issues: data.slice(0, 10) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to fetch issues" });
  }
});
```

### Test It

```bash
curl "http://localhost:3000/tools/get-issues?projectId=12345"
```

See [SETUP.md](docs/SETUP.md) for more examples.

---

## 📊 Architecture

```
┌─────────────────┐
│ Client/Agent    │
└────────┬────────┘
         │ HTTP Request
         │ /tools/get-pipelines?projectId=12345
         ▼
┌─────────────────────────────────┐
│ Express Server (server.js)      │ ◄── Rate Limiting
│ ├─ Route Handler               │ ◄── Security Headers
│ └─ Input Validation            │ ◄── Error Handling
└────────┬────────────────────────┘
         │ GitLab Function Call
         ▼
┌─────────────────────────────────┐
│ gitlab.js                       │
│ ├─ fetchPipelines()            │
│ ├─ fetchProjectIssues()        │
│ └─ ... (extend here)           │
└────────┬────────────────────────┘
         │ HTTP Request
         │ GET /api/v4/projects/12345/pipelines
         │ Header: PRIVATE-TOKEN: glpat-xxx
         ▼
┌─────────────────────────────────┐
│ GitLab REST API v4              │
│ (https://gitlab.com/api/v4)    │
└─────────────────────────────────┘
```

---

## 📈 Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ (ES modules) |
| **Framework** | Express.js 5 |
| **HTTP Client** | Axios |
| **Configuration** | dotenv |
| **Security** | Helmet.js, express-rate-limit |
| **Container** | Docker, Docker Compose |
| **Orchestration** | Kubernetes |
| **CI/CD** | GitHub Actions |

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid/expired token | Generate new PAT, update `.env` |
| `404 Not Found` | Wrong project ID format | Use numeric ID (e.g., `12345`) |
| `Port 3000 in use` | Another process using port | Use `PORT=3001 npm start` |
| `Module not found` | Dependencies not installed | Run `npm install` |

### Get Help

- 📖 See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions
- 🐛 Open an [issue](https://github.com/sallibil-gif/mcp-server-demo1/issues)
- 💬 Start a [discussion](https://github.com/sallibil-gif/mcp-server-demo1/discussions)

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test: `npm run lint && npm test`
4. Commit with conventional messages: `git commit -am "feat: Add my feature"`
5. Push and create a PR

---

## 📄 License

MIT © 2026 [sallibil-gif](https://github.com/sallibil-gif)

See [LICENSE](LICENSE) for details.

---

## 🆘 Support & Resources

- 📖 **Full Documentation**: [SETUP.md](docs/SETUP.md), [SECURITY.md](docs/SECURITY.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/sallibil-gif/mcp-server-demo1/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sallibil-gif/mcp-server-demo1/discussions)
- 🔗 **GitLab API**: [docs.gitlab.com](https://docs.gitlab.com/ee/api/)

---

**Built with ❤️ for developers and AI agents**
