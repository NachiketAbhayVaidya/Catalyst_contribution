const required = [
  "PORT",
  "MONGO_URI",
  "CORS_ORIGIN",
  "ACCESS_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRY",
];

function readEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    port: process.env.PORT,
    mongoUri: process.env.MONGO_URI,
    corsOrigin: process.env.CORS_ORIGIN,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    ai: {
      provider: process.env.AI_PROVIDER || "gemini",
      geminiApiKey: process.env.GEMINI_API_KEY,
      geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    },
    google: {
      // Must match the frontend's VITE_GOOGLE_CLIENT_ID exactly — it's the
      // "audience" the ID token is checked against.
      clientId: process.env.GOOGLE_CLIENT_ID || null,
    },
    // Shared secret gating self-service admin signup (spec: admin isn't
    // public, but a known code lets invited people register directly).
    // Unset = admin self-signup disabled entirely, not "any code works".
    adminSignupCode: process.env.ADMIN_SIGNUP_CODE || null,
  };
}

export const env = readEnv();
