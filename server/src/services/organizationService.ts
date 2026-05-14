import type { Request } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errors';
import { requireOrgRole } from '../middleware/auth';
import { audit } from './auditService';

export const createOrgSchema = z.object({
  name: z.string().min(2).max(140),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/),
  domain: z.string().max(120).default('')
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'analyst', 'viewer'])
});

export async function listOrganizations(req: Request) {
  const { data, error } = await req.db
    .from('organization_members')
    .select('role, organizations(*, subscriptions(*))')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true });
  if (error) throw new ApiError(400, 'organizations_failed', error.message);
  return data ?? [];
}

export async function createOrganization(req: Request, input: z.infer<typeof createOrgSchema>) {
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .insert({ ...input, created_by: req.user.id })
    .select('*')
    .single();
  if (error) throw new ApiError(400, 'organization_create_failed', error.message);

  await supabaseAdmin.from('organization_members').insert({ organization_id: org.id, user_id: req.user.id, role: 'owner' });
  await supabaseAdmin.from('subscriptions').insert({ organization_id: org.id, plan: 'growth', status: 'trialing', seats: 8 });
  await audit({ organizationId: org.id, actorId: req.user.id, entityType: 'organization', entityId: org.id, action: 'created' });
  return org;
}

export async function inviteMember(req: Request, organizationId: string, input: z.infer<typeof inviteSchema>) {
  await requireOrgRole(req, organizationId, ['owner', 'admin']);
  const { data, error } = await supabaseAdmin
    .from('organization_invites')
    .upsert({ organization_id: organizationId, email: input.email.toLowerCase(), role: input.role, invited_by: req.user.id }, { onConflict: 'organization_id,email' })
    .select('*')
    .single();
  if (error) throw new ApiError(400, 'invite_failed', error.message);
  await audit({ organizationId, actorId: req.user.id, entityType: 'member', entityId: data.id, action: 'invited', metadata: { email: input.email, role: input.role } });
  return data;
}

export async function listMembers(req: Request, organizationId: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst', 'viewer']);
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .select('user_id, role, created_at, profiles(full_name, title)')
    .eq('organization_id', organizationId)
    .order('created_at');
  if (error) throw new ApiError(400, 'members_failed', error.message);
  return data ?? [];
}
