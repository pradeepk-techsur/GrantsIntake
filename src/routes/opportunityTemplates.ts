import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as templateService from '../services/opportunity/opportunityTemplateService';
import * as programService from '../services/program/programService';

export const opportunityTemplatesRouter = Router();

/**
 * GET /api/v1/opportunity-templates
 * List opportunity templates accessible to the authenticated user.
 * Returns system templates + org-owned templates for caller's org.
 * Optional ?type= filter for template_type.
 * T-02-03 mitigation: service filters to caller's org; parameterized query.
 */
opportunityTemplatesRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const templateType = typeof req.query.type === 'string' ? req.query.type : undefined;

    // Try to get caller's org for filtering org-private templates (if any)
    let callerOrgId: string | undefined;
    try {
      callerOrgId = await programService.getGrantorOrgIdForUser(req.user!.user_id);
    } catch {
      // User has no grantor org — they still get system templates
      callerOrgId = undefined;
    }

    const templates = await templateService.list({
      template_type: templateType,
      callerOrgId,
    });

    res.status(200).json(templates);
  } catch (err) {
    console.error('GET /opportunity-templates error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch templates' });
  }
});
