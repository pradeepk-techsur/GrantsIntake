import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { blockGrantorOnWorkspace } from '../middleware/blockGrantorOnWorkspace';
import { workspaceService } from '../services/workspace/workspaceService';
import { readinessService } from '../services/workspace/readinessService';
import { formFieldService } from '../services/workspace/formFieldService';
import { pool } from '../db/client';

export const workspacesRouter = Router();

// UUID regex for format guard — prevents Postgres UUID parse errors on malformed params
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Router-level middleware ───────────────────────────────────────────────────
//
// authenticate runs before every route in this router.
// blockGrantorOnWorkspace applies PRD-INTAKE-036 blanket grantor block at the
// middleware layer — ALL workspace routes return 403 WORKSPACE_GRANTEE_PRIVATE
// for any grantor role. This supersedes the per-route blockGrantors() check on
// comments (which is now removed — blockGrantorOnWorkspace covers it uniformly).
workspacesRouter.use(authenticate);
workspacesRouter.use(blockGrantorOnWorkspace);

// ─── Validation schemas ────────────────────────────────────────────────────────

const createWorkspaceSchema = z.object({
  opportunity_id: z.string().uuid(),
  track_id: z.string().uuid().optional(),
});

const assignSectionSchema = z.object({
  owner_id: z.string().uuid().optional(),
  internal_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const createTaskSchema = z.object({
  section_id: z.string().uuid().optional(),
  task_title: z.string().min(1).max(500),
  assignee_id: z.string().uuid(),
  task_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  task_notes: z.string().optional(),
});

const updateTaskSchema = z.object({
  task_title: z.string().min(1).max(500).optional(),
  status: z.enum(['open', 'complete']).optional(),
  task_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  task_notes: z.string().optional(),
});

const createCommentSchema = z.object({
  section_id: z.string().uuid().optional(),
  comment_text: z.string().min(1).max(5000),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendError(res: Response, status: number, error: string, message?: string) {
  res.status(status).json({ error, message });
}

/**
 * Two-step IDOR guard (T-04-02):
 * 1. Check workspace EXISTS → 404 if not (prevents information disclosure via 403)
 * 2. Check user is org member → 403 if not
 */
async function workspaceIodGuard(
  req: Request,
  res: Response,
  next: () => void,
  workspaceId: string,
) {
  const workspace = await workspaceService.getWorkspace(workspaceId);
  if (!workspace) {
    sendError(res, 404, 'NOT_FOUND', 'Workspace not found');
    return;
  }

  const userId = req.user!.user_id;
  const isMember = await workspaceService.verifyWorkspaceMember(workspaceId, userId);
  if (!isMember) {
    sendError(res, 403, 'FORBIDDEN', 'You are not a member of this workspace\'s organization');
    return;
  }

  next();
}

// ─── POST /api/v1/workspaces — create workspace ───────────────────────────────

workspacesRouter.post('/workspaces', async (req: Request, res: Response) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.message);
  }

  try {
    const result = await workspaceService.createWorkspace(req.user!.user_id, parsed.data);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'USER_HAS_NO_ORG') {
      return sendError(res, 422, 'USER_HAS_NO_ORG', 'User does not belong to an organization');
    }
    if (e.code === 'DUPLICATE_WORKSPACE') {
      return sendError(res, 409, 'DUPLICATE_WORKSPACE', 'A workspace already exists for this organization and opportunity');
    }
    console.error('POST /workspaces error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR');
  }
});

// ─── GET /api/v1/workspaces — list workspaces for current user's org ──────────

workspacesRouter.get('/workspaces', async (req: Request, res: Response) => {
  try {
    const workspaces = await workspaceService.listWorkspacesForOrg(req.user!.user_id);
    return res.json(workspaces);
  } catch (err) {
    console.error('GET /workspaces error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR');
  }
});

// ─── GET /api/v1/workspaces/:id — get workspace by ID ────────────────────────

workspacesRouter.get('/workspaces/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    try {
      const workspace = await workspaceService.getWorkspace(id);
      return res.json(workspace);
    } catch (err) {
      console.error('GET /workspaces/:id error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── GET /api/v1/workspaces/:id/sections — list sections ─────────────────────

workspacesRouter.get('/workspaces/:id/sections', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    try {
      const sections = await workspaceService.listSections(id);
      // Filter to visible sections
      const visible = sections.filter((s) => s.is_visible);
      return res.json(visible);
    } catch (err) {
      console.error('GET /workspaces/:id/sections error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── GET /api/v1/workspaces/:id/sections/:sectionId — get section ─────────────

workspacesRouter.get('/workspaces/:id/sections/:sectionId', async (req: Request, res: Response) => {
  const { id, sectionId } = req.params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(sectionId)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    try {
      const section = await workspaceService.getSection(id, sectionId);
      if (!section) return sendError(res, 404, 'NOT_FOUND', 'Section not found');
      return res.json(section);
    } catch (err) {
      console.error('GET /workspaces/:id/sections/:sectionId error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── PUT /api/v1/workspaces/:id/sections/:sectionId/assignment ───────────────

workspacesRouter.put(
  '/workspaces/:id/sections/:sectionId/assignment',
  async (req: Request, res: Response) => {
    const { id, sectionId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(sectionId)) return sendError(res, 404, 'NOT_FOUND');

    await workspaceIodGuard(req, res, async () => {
      // Require proposal_lead or org_admin role (T-04-04)
      // Check via DB org_roles (org roles not in JWT) — mirrors T-03-22 pattern
      const userId = req.user!.user_id;
      const roleCheck = await pool.query<{ has_role: boolean }>(
        `SELECT EXISTS(
           SELECT 1 FROM org_roles orr
           JOIN application_workspaces aw ON aw.org_id = orr.org_id
           WHERE aw.workspace_id = $1
             AND orr.user_id = $2
             AND orr.revoked_at IS NULL
             AND (orr.roles @> '["proposal_lead"]'::jsonb OR orr.roles @> '["org_admin"]'::jsonb)
         ) AS has_role`,
        [id, userId],
      );
      const canAssign = roleCheck.rows[0]?.has_role ?? false;
      if (!canAssign) {
        return sendError(res, 403, 'FORBIDDEN', 'Only proposal_lead or org_admin may assign sections');
      }

      const parsed = assignSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.message);
      }

      try {
        const section = await workspaceService.assignSection(id, sectionId, parsed.data);
        return res.json(section);
      } catch (err) {
        console.error('PUT /workspaces/:id/sections/:sectionId/assignment error:', err);
        return sendError(res, 500, 'INTERNAL_ERROR');
      }
    }, id);
  },
);

// ─── GET /api/v1/workspaces/:id/tasks — list tasks ───────────────────────────

workspacesRouter.get('/workspaces/:id/tasks', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    try {
      const tasks = await workspaceService.listTasks(id);
      return res.json(tasks);
    } catch (err) {
      console.error('GET /workspaces/:id/tasks error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── POST /api/v1/workspaces/:id/tasks — create task ─────────────────────────

workspacesRouter.post('/workspaces/:id/tasks', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    try {
      const task = await workspaceService.createTask(id, parsed.data, req.user!.user_id);
      return res.status(201).json(task);
    } catch (err) {
      console.error('POST /workspaces/:id/tasks error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── PUT /api/v1/workspaces/:id/tasks/:taskId — update task ──────────────────

workspacesRouter.put('/workspaces/:id/tasks/:taskId', async (req: Request, res: Response) => {
  const { id, taskId } = req.params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(taskId)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    try {
      const task = await workspaceService.updateTask(taskId, parsed.data);
      if (!task) return sendError(res, 404, 'NOT_FOUND', 'Task not found');
      return res.json(task);
    } catch (err) {
      console.error('PUT /workspaces/:id/tasks/:taskId error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── DELETE /api/v1/workspaces/:id/tasks/:taskId — delete task ───────────────

workspacesRouter.delete('/workspaces/:id/tasks/:taskId', async (req: Request, res: Response) => {
  const { id, taskId } = req.params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(taskId)) return sendError(res, 404, 'NOT_FOUND');

  await workspaceIodGuard(req, res, async () => {
    try {
      const deleted = await workspaceService.deleteTask(taskId);
      if (!deleted) return sendError(res, 404, 'NOT_FOUND', 'Task not found');
      return res.status(204).send();
    } catch (err) {
      console.error('DELETE /workspaces/:id/tasks/:taskId error:', err);
      return sendError(res, 500, 'INTERNAL_ERROR');
    }
  }, id);
});

// ─── GET /api/v1/workspaces/:id/comments — list comments (applicant only) ─────
//
// Note: blockGrantorOnWorkspace at router level now handles the grantor block
// for comments uniformly — the per-route blockGrantors() check is no longer needed.

workspacesRouter.get(
  '/workspaces/:id/comments',
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return sendError(res, 404, 'NOT_FOUND');

    await workspaceIodGuard(req, res, async () => {
      try {
        const comments = await workspaceService.listComments(id);
        return res.json(comments);
      } catch (err) {
        console.error('GET /workspaces/:id/comments error:', err);
        return sendError(res, 500, 'INTERNAL_ERROR');
      }
    }, id);
  },
);

// ─── POST /api/v1/workspaces/:id/comments — add comment (applicant only) ──────
//
// Note: blockGrantorOnWorkspace at router level handles the grantor block uniformly.

workspacesRouter.post(
  '/workspaces/:id/comments',
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return sendError(res, 404, 'NOT_FOUND');

    await workspaceIodGuard(req, res, async () => {
      const parsed = createCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.message);
      }

      try {
        const comment = await workspaceService.addComment(id, parsed.data, req.user!.user_id);
        return res.status(201).json(comment);
      } catch (err) {
        console.error('POST /workspaces/:id/comments error:', err);
        return sendError(res, 500, 'INTERNAL_ERROR');
      }
    }, id);
  },
);

// ─── GET /api/v1/workspaces/:id/readiness — readiness summary (F34) ──────────
//
// Returns ReadinessSummary: overall_completion_pct, is_ready_to_submit,
// authorized_rep_assigned, blocking_errors[], warnings[], attachment_status[]
// T-04-08: two-step IDOR guard (EXISTS → 404, then membership → 403).

workspacesRouter.get('/workspaces/:id/readiness', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });

  const workspace = await workspaceService.getWorkspace(id);
  if (!workspace) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });

  const isMember = await workspaceService.verifyWorkspaceMember(id, req.user!.user_id);
  if (!isMember) return res.status(403).json({ error: 'PERMISSION_DENIED' });

  try {
    const readiness = await readinessService.computeReadiness(id);
    return res.status(200).json(readiness);
  } catch (err) {
    console.error('GET /workspaces/:id/readiness error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/v1/workspaces/:id/sections/:sectionId/fields ───────────────────
// Returns field definitions joined with current_response for this workspace.
// T-04-12: Two-step IDOR guard (EXISTS → 404, then membership → 403).

workspacesRouter.get('/workspaces/:id/sections/:sectionId/fields', authenticate, async (req, res) => {
  const { id, sectionId } = req.params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(sectionId)) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const workspace = await workspaceService.getWorkspace(id);
  if (!workspace) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
  const isMember = await workspaceService.verifyWorkspaceMember(id, req.user!.user_id);
  if (!isMember) return res.status(403).json({ error: 'PERMISSION_DENIED' });

  const fields = await formFieldService.getFieldsForSection(sectionId, id);
  return res.status(200).json(fields);
});

// ─── PUT /api/v1/workspaces/:id/sections/:sectionId/fields/:fieldId ──────────
// Save field response (upsert via ON CONFLICT).
// T-04-11: UUID_REGEX guard on fieldId; FK violation (23503) → 404 FIELD_NOT_FOUND.
// T-04-13: Zod max(100_000) on response_value limits payload size.

const saveFieldResponseSchema = z.object({
  response_value: z.string().max(100_000).optional(),
  response_json: z.unknown().optional(),
});

workspacesRouter.put('/workspaces/:id/sections/:sectionId/fields/:fieldId', authenticate, async (req, res) => {
  const { id, sectionId, fieldId } = req.params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(sectionId) || !UUID_REGEX.test(fieldId)) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const workspace = await workspaceService.getWorkspace(id);
  if (!workspace) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
  if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });
  const isMember = await workspaceService.verifyWorkspaceMember(id, req.user!.user_id);
  if (!isMember) return res.status(403).json({ error: 'PERMISSION_DENIED' });

  const parsed = saveFieldResponseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });

  try {
    const response = await formFieldService.saveFieldResponse(id, sectionId, fieldId, parsed.data, req.user!.user_id);
    return res.status(200).json(response);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23503') {
      // FK violation: fieldId doesn't exist in form_field_definitions
      return res.status(404).json({ error: 'FIELD_NOT_FOUND' });
    }
    throw err;
  }
});

// ─── POST /api/v1/workspaces/:id/sections/:sectionId/validate ────────────────
// Trigger server-side section validation. Updates section.validation_errors and status.
// T-04-15: verifyWorkspaceMember check before any DB write.

workspacesRouter.post('/workspaces/:id/sections/:sectionId/validate', authenticate, async (req, res) => {
  const { id, sectionId } = req.params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(sectionId)) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const workspace = await workspaceService.getWorkspace(id);
  if (!workspace) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
  const isMember = await workspaceService.verifyWorkspaceMember(id, req.user!.user_id);
  if (!isMember) return res.status(403).json({ error: 'PERMISSION_DENIED' });

  const result = await formFieldService.validateSection(id, sectionId);
  return res.status(200).json(result);
});
