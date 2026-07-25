import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { authRouter } from './routes/auth';
import { programsRouter } from './routes/programs';
import { opportunityTemplatesRouter } from './routes/opportunityTemplates';
import { opportunitiesRouter } from './routes/opportunities';
import { guidanceRouter } from './routes/guidance';
import { eligibilityRouter } from './routes/eligibility';
import { prescreeningRouter } from './routes/prescreening';
import { sectionConditionsRouter } from './routes/sectionConditions';
import { attachmentRequirementsRouter } from './routes/attachmentRequirements';
import { screeningCriteriaRouter } from './routes/screeningCriteria';

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

// Mount opportunities and guidance routes (plan 01-03)
// Note: opportunitiesRouter handles both /programs/:id/opportunities and /opportunities/:id patterns
app.use('/api/v1', opportunitiesRouter);
app.use('/api/v1/guidance-prompts', guidanceRouter);

// Mount eligibility and prescreening routes (plan 02-01)
app.use('/api/v1', eligibilityRouter);
app.use('/api/v1', prescreeningRouter);

// Mount intake configuration routes (plan 02-02)
app.use('/api/v1', sectionConditionsRouter);
app.use('/api/v1', attachmentRequirementsRouter);
app.use('/api/v1', screeningCriteriaRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React client build (for production and e2e tests)
// The client build output is at ./client/dist
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Additional routes can be registered before finalizing (for testing)
// The 404 handler is registered last via finalizeApp()
let appFinalized = false;

export function finalizeApp() {
  if (!appFinalized) {
    appFinalized = true;
    // For non-API routes, serve the React SPA (client-side routing)
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      // Serve React app for all non-API routes (SPA routing)
      const indexPath = path.join(clientDistPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          // If client build doesn't exist (dev mode), return 404
          res.status(404).json({ error: 'NOT_FOUND' });
        }
      });
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
