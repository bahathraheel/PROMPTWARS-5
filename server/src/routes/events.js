import express from 'express';
export const eventsRouter = express.Router();

/**
 * GET /api/events/ping
 * Simple route to verify events API is reachable.
 * Full CRUD is handled client-side via Firebase Firestore SDK
 * with server-side Firestore Security Rules enforcing access control.
 */
eventsRouter.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Events API is available. CRUD operations are handled via Firestore client SDK with security rules.',
  });
});
