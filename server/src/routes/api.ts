import { Router } from 'express';

import { asyncHandler } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';

import {
  assessmentSchema,
  createAssessment,
  listAssessments,
  listTasks,
  taskSchema,
  upsertTask
} from '../services/assessmentService';

import {
  createOrgSchema,
  createOrganization,
  inviteMember,
  inviteSchema,
  listMembers,
  listOrganizations
} from '../services/organizationService';

import { getDashboard } from '../services/reportService';

import {
  createVendor,
  deleteVendor,
  listVendors,
  updateVendor,
  vendorSchema
} from '../services/vendorService';

export const api = Router();

/* =========================
   HEALTH
========================= */
api.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'trustdesk-api' });
});

/* =========================
   OPTIONS / PREFLIGHT
========================= */
api.options('*', (_req, res) => {
  res.sendStatus(204);
});

/* =========================
   AUTH
   Skip OPTIONS explicitly
========================= */
api.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return requireAuth(req, res, next);
});

/* =========================
   ORGANIZATIONS
========================= */
api.get(
  '/organizations',
  asyncHandler(async (req, res) => {
    res.json(await listOrganizations(req));
  })
);

api.post(
  '/organizations',
  asyncHandler(async (req, res) => {
    const data = createOrgSchema.parse(req.body);
    res.status(201).json(await createOrganization(req, data));
  })
);

api.get(
  '/organizations/:orgId/members',
  asyncHandler(async (req, res) => {
    res.json(await listMembers(req, req.params.orgId));
  })
);

api.post(
  '/organizations/:orgId/invites',
  asyncHandler(async (req, res) => {
    const data = inviteSchema.parse(req.body);
    res.status(201).json(await inviteMember(req, req.params.orgId, data));
  })
);

/* =========================
   DASHBOARD
========================= */
api.get(
  '/organizations/:orgId/dashboard',
  asyncHandler(async (req, res) => {
    res.json(await getDashboard(req, req.params.orgId));
  })
);

/* =========================
   VENDORS
========================= */
api.get(
  '/organizations/:orgId/vendors',
  asyncHandler(async (req, res) => {
    res.json(await listVendors(req, req.params.orgId));
  })
);

api.post(
  '/organizations/:orgId/vendors',
  asyncHandler(async (req, res) => {
    const data = vendorSchema.parse(req.body);
    res.status(201).json(await createVendor(req, req.params.orgId, data));
  })
);

api.put(
  '/organizations/:orgId/vendors/:vendorId',
  asyncHandler(async (req, res) => {
    const data = vendorSchema.parse(req.body);
    res.json(await updateVendor(req, req.params.orgId, req.params.vendorId, data));
  })
);

api.delete(
  '/organizations/:orgId/vendors/:vendorId',
  asyncHandler(async (req, res) => {
    await deleteVendor(req, req.params.orgId, req.params.vendorId);
    res.status(204).send();
  })
);

/* =========================
   ASSESSMENTS
========================= */
api.get(
  '/organizations/:orgId/assessments',
  asyncHandler(async (req, res) => {
    res.json(await listAssessments(req, req.params.orgId));
  })
);

api.post(
  '/organizations/:orgId/assessments',
  asyncHandler(async (req, res) => {
    const data = assessmentSchema.parse(req.body);
    res.status(201).json(await createAssessment(req, req.params.orgId, data));
  })
);

/* =========================
   TASKS
========================= */
api.get(
  '/organizations/:orgId/tasks',
  asyncHandler(async (req, res) => {
    res.json(await listTasks(req, req.params.orgId));
  })
);

api.post(
  '/organizations/:orgId/tasks',
  asyncHandler(async (req, res) => {
    const data = taskSchema.parse(req.body);
    res.status(201).json(await upsertTask(req, req.params.orgId, data));
  })
);

api.put(
  '/organizations/:orgId/tasks/:taskId',
  asyncHandler(async (req, res) => {
    const data = taskSchema.parse(req.body);
    res.json(await upsertTask(req, req.params.orgId, data, req.params.taskId));
  })
);
