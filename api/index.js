// Serverless entrypoint for Vercel.
// This file allows Vercel to host the existing Express backend.
//
// Deploying Express on Vercel is non-trivial; this adapter is the minimal way
// to make `src/index.js` reachable via an `/api/*` path.
//
// NOTE:
// - Your current backend is a standalone server that listens on a port.
// - In Vercel, we do NOT want to call `app.listen()`.
//   So we import the Express app factory from `src/app.js`.
//
// If `src/app.js` does not exist yet, create it as part of the migration.

const { createApp } = require('../src/app');

module.exports = async (req, res) => {
  const app = createApp();
  // Use the Express app as middleware for this request.
  app(req, res);
};

