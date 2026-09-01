// Runs before any test file is loaded (jest.config.js `setupFiles`).

// Pins the mongodb-memory-server binary version to what's already cached
// locally (downloaded during `npm install`'s postinstall step) so test runs
// never depend on a network call to resolve "latest" at runtime.
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || "7.0.24";

// src/config/env.js validates these are present at import time. Every test
// file transitively imports models -> config/env.js, so these must be set
// before any test file's own imports run.
process.env.PORT = process.env.PORT || "8000";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test_access_secret";
process.env.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1d";
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test_refresh_secret";
process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "10d";
// Tests connect directly via mongoose.connect() to an in-memory replica set,
// never through src/db/index.js, so this only needs to satisfy env validation.
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder";
