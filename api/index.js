const app = require("../SEVER/src/app");
const connectDB = require("../SEVER/src/config/db");

module.exports = async (request, response) => {
  const oidcToken = request.headers["x-vercel-oidc-token"];
  if (oidcToken) {
    process.env.VERCEL_OIDC_TOKEN = Array.isArray(oidcToken)
      ? oidcToken[0]
      : oidcToken;
  }

  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return response.status(503).json({ message: "Database unavailable" });
  }

  return app(request, response);
};
