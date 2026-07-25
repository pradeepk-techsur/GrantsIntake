import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { authRouter } from './routes/auth';
import { programsRouter } from './routes/programs';
import { opportunityTemplatesRouter } from './routes/opportunityTemplates';

const app = express();

// Security headers (but allow iframe preview - don't set X-Frame-Options: DENY)
app.use(
  helmet({
    frameguard: false, // Allow iframe embedding for Pivota preview
    contentSecurityPolicy: false, // Disable CSP that would block iframe
  }),
);

// Parse JSON bodies
app.use(express.json());

// Global rate limiting: 100 req/min per IP (relaxed in test mode)
const globalRateLimitMax = env.NODE_ENV === 'test' ? 10000 : 100;
const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: globalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
});
app.use(globalRateLimit);

// Mount auth routes
app.use('/api/v1/auth', authRouter);

// Mount opportunity domain routes
app.use('/api/v1/programs', programsRouter);
app.use('/api/v1/opportunity-templates', opportunityTemplatesRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Additional routes can be registered before finalizing (for testing)
// The 404 handler is registered last via finalizeApp()
let appFinalized = false;

export function finalizeApp() {
  if (!appFinalized) {
    appFinalized = true;
    // 404 handler (must be last)
    app.use((_req, res) => {
      res.status(404).json({ error: 'NOT_FOUND' });
    });
  }
}

// Start server
function startServer() {
  finalizeApp(); // Register 404 handler last
  const port = env.PORT;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`GrantsIntake API running on http://0.0.0.0:${port}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
  return server;
}

export { app };

// Only start if running directly (not imported for testing)
if (require.main === module) {
  startServer();
}
