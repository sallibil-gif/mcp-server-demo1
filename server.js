import express from "express";
import dotenv from "dotenv";
import { fetchPipelines } from "./gitlab.js";

dotenv.config({ override: true });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// ✅ Root route
app.get("/", (req, res) => {
  res.send("MCP Server Running 🚀");
});

// ✅ Health Check (for load balancers, monitoring)
app.get("/health", (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: "healthy",
    uptime: uptime,
    timestamp: new Date().toISOString(),
  });
});

// ✅ Readiness Check (for Kubernetes, Docker)
app.get("/ready", (req, res) => {
  // Check if GITLAB_TOKEN is set
  if (!process.env.GITLAB_TOKEN) {
    return res.status(503).json({
      ready: false,
      message: "GITLAB_TOKEN not configured",
    });
  }

  res.json({
    ready: true,
    gitlab_configured: !!process.env.GITLAB_BASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// ✅ MCP Tool: Get Pipelines
app.get("/tools/get-pipelines", async (req, res) => {
  console.log("✅ Route /tools/get-pipelines HIT");

  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "projectId is required",
      });
    }

    const data = await fetchPipelines(projectId);

    // ✅ Handle empty pipelines properly
    if (!data || data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: "No pipelines found",
        pipelines: [],
      });
    }

    // ✅ Success response
    return res.json({
      success: true,
      count: data.length,
      pipelines: data.slice(0, 5), // latest 5
    });

  } catch (err) {
    console.error("❌ STATUS:", err.response?.status);
    console.error("❌ DETAILS:", err.response?.data);
    console.error("❌ MESSAGE:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pipelines",
    });
  }
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    path: req.path,
    method: req.method,
    available_endpoints: [
      "GET /",
      "GET /health",
      "GET /ready",
      "GET /tools/get-pipelines?projectId=<id>",
    ],
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Available endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/ready`);
  console.log(`   - GET  http://localhost:${PORT}/tools/get-pipelines?projectId=<id>`);
});
