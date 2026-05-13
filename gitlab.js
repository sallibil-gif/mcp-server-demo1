import axios from "axios";

export async function fetchPipelines(projectId) {
  try {
    console.log(`📍 Fetching pipelines for project: ${projectId}`);
    console.log(`📍 GitLab API URL: ${process.env.GITLAB_BASE_URL}`);
    
    const response = await axios.get(
      `${process.env.GITLAB_BASE_URL}/projects/${projectId}/pipelines`,
      {
        headers: {
          "PRIVATE-TOKEN": process.env.GITLAB_TOKEN,
        },
      }
    );

    console.log(`✅ Pipelines fetched successfully: ${response.data.length} found`);
    return response.data;
    
  } catch (err) {
    console.error("❌ ERROR fetching pipelines:");
    console.error("❌ STATUS:", err.response?.status);
    console.error("❌ MESSAGE:", err.response?.statusText);
    console.error("❌ DETAILS:", err.response?.data);
    console.error("❌ ERROR:", err.message);
    
    // Return empty array instead of throwing
    // This way the server can handle it gracefully
    if (err.response?.status === 401) {
      console.error("❌ Authentication failed - check GITLAB_TOKEN");
    } else if (err.response?.status === 404) {
      console.error("❌ Project not found - check projectId");
    }
    
    throw err;
  }
}
