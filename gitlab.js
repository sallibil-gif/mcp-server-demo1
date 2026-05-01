import axios from "axios";

export async function fetchPipelines(projectId) {
  try {
    const response = await axios.get(
      `${process.env.GITLAB_BASE_URL}/projects/${projectId}/pipelines`,
      {
        headers: {
          "PRIVATE-TOKEN": process.env.GITLAB_TOKEN,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("❌ STATUS:", err.response?.status);
    console.error("❌ DETAILS:", err.response?.data);
    throw err;
  }
}