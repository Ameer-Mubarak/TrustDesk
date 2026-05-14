import type { Request } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errors';
import { requireOrgRole } from '../middleware/auth';
import { audit } from './auditService';

export const assessmentSchema = z.object({
  vendor_id: z.string().uuid(),
  name: z.string().min(3).max(180),
  status: z.enum(['draft', 'in_review', 'approved', 'rejected']),
  due_date: z.string(),
  score: z.coerce.number().int().min(0).max(100)
});

export const taskSchema = z.object({
  vendor_id: z.string().uuid().nullable().optional(),
  assessment_id: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(180),
  description: z.string().max(2000).default(''),
  status: z.enum(['open', 'in_progress', 'blocked', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string()
});

export async function listAssessments(req: Request, organizationId: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst', 'viewer']);
  const { data, error } = await supabaseAdmin
    .from('assessments')
    .select('*, vendors(name, risk, status)')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false });
  if (error) throw new ApiError(400, 'assessments_failed', error.message);
  return data ?? [];
}

export async function createAssessment(req: Request, organizationId: string, input: z.infer<typeof assessmentSchema>) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst']);
  const { data, error } = await supabaseAdmin
    .from('assessments')
    .insert({ ...input, organization_id: organizationId, created_by: req.user.id, approved_by: input.status === 'approved' ? req.user.id : null })
    .select('*')
    .single();
  if (error) throw new ApiError(400, 'assessment_create_failed', error.message);
  await audit({ organizationId, actorId: req.user.id, entityType: 'assessment', entityId: data.id, action: 'created' });
  return data;
}

export async function listTasks(req: Request, organizationId: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst', 'viewer']);
  const { status = '' } = req.query as Record<string, string>;
  let query = supabaseAdmin.from('tasks').select('*, vendors(name)').eq('organization_id', organizationId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('due_date', { ascending: true });
  if (error) throw new ApiError(400, 'tasks_failed', error.message);
  return data ?? [];
}

export async function upsertTask(req: Request, organizationId: string, input: z.infer<typeof taskSchema>, taskId?: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst']);
  const payload = { ...input, organization_id: organizationId, created_by: req.user.id };
  const query = taskId
    ? supabaseAdmin.from('tasks').update(input).eq('organization_id', organizationId).eq('id', taskId)
    : supabaseAdmin.from('tasks').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw new ApiError(400, 'task_save_failed', error.message);
  await audit({ organizationId, actorId: req.user.id, entityType: 'task', entityId: data.id, action: taskId ? 'updated' : 'created' });
  return data;
}
