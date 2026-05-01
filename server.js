import express from "express";
import dotenv from "dotenv";
import { fetchPipelines } from "./gitlab.js";

dotenv.config({ override: true });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Root route
app.get("/", (req, res) => {
  res.send("MCP Server Running 🚀");
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

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});