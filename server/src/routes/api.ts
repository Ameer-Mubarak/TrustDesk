import { Router } from 'express';
import { asyncHandler } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import { assessmentSchema, createAssessment, listAssessments, listTasks, taskSchema, upsertTask } from '../services/assessmentService';
import { createOrgSchema, createOrganization, inviteMember, inviteSchema, listMembers, listOrganizations } from '../services/organizationService';
import { getDashboard } from '../services/reportService';
import { createVendor, deleteVendor, listVendors, updateVendor, vendorSchema } from '../services/vendorService';

export const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true, service: 'trustdesk-api' }));
api.use(requireAuth);

api.get('/organizations', asyncHandler(async (req, res) => res.json(await listOrganizations(req))));
api.post('/organizations', asyncHandler(async (req, res) => res.status(201).json(await createOrganization(req, createOrgSchema.parse(req.body)))));
api.get('/organizations/:orgId/members', asyncHandler(async (req, res) => res.json(await listMembers(req, req.params.orgId))));
api.post('/organizations/:orgId/invites', asyncHandler(async (req, res) => res.status(201).json(await inviteMember(req, req.params.orgId, inviteSchema.parse(req.body)))));

api.get('/organizations/:orgId/dashboard', asyncHandler(async (req, res) => res.json(await getDashboard(req, req.params.orgId))));

api.get('/organizations/:orgId/vendors', asyncHandler(async (req, res) => res.json(await listVendors(req, req.params.orgId))));
api.post('/organizations/:orgId/vendors', asyncHandler(async (req, res) => res.status(201).json(await createVendor(req, req.params.orgId, vendorSchema.parse(req.body)))));
api.put('/organizations/:orgId/vendors/:vendorId', asyncHandler(async (req, res) => res.json(await updateVendor(req, req.params.orgId, req.params.vendorId, vendorSchema.parse(req.body)))));
api.delete('/organizations/:orgId/vendors/:vendorId', asyncHandler(async (req, res) => {
  await deleteVendor(req, req.params.orgId, req.params.vendorId);
  res.status(204).send();
}));

api.get('/organizations/:orgId/assessments', asyncHandler(async (req, res) => res.json(await listAssessments(req, req.params.orgId))));
api.post('/organizations/:orgId/assessments', asyncHandler(async (req, res) => res.status(201).json(await createAssessment(req, req.params.orgId, assessmentSchema.parse(req.body)))));
api.get('/organizations/:orgId/tasks', asyncHandler(async (req, res) => res.json(await listTasks(req, req.params.orgId))));
api.post('/organizations/:orgId/tasks', asyncHandler(async (req, res) => res.status(201).json(await upsertTask(req, req.params.orgId, taskSchema.parse(req.body)))));
api.put('/organizations/:orgId/tasks/:taskId', asyncHandler(async (req, res) => res.json(await upsertTask(req, req.params.orgId, taskSchema.parse(req.body), req.params.taskId))));
