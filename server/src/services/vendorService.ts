import type { Request } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errors';
import { requireOrgRole } from '../middleware/auth';
import { audit } from './auditService';

export const vendorSchema = z.object({
  name: z.string().min(2).max(180),
  owner_email: z.string().email(),
  category: z.string().min(2).max(80),
  status: z.enum(['prospect', 'reviewing', 'approved', 'restricted', 'offboarded']),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  annual_spend: z.coerce.number().min(0).max(999999999),
  data_access: z.string().min(2).max(240),
  next_review_date: z.string(),
  notes: z.string().max(2000).default('')
});

export async function listVendors(req: Request, organizationId: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst', 'viewer']);
  const { q = '', status = '', risk = '', sort = 'updated_at.desc' } = req.query as Record<string, string>;
  const [column, direction] = sort.split('.');
  const safeColumn = ['name', 'risk', 'status', 'annual_spend', 'next_review_date', 'updated_at'].includes(column) ? column : 'updated_at';

  let query = supabaseAdmin.from('vendors').select('*').eq('organization_id', organizationId);
  if (status) query = query.eq('status', status);
  if (risk) query = query.eq('risk', risk);
  if (q) query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,owner_email.ilike.%${q}%`);
  const { data, error } = await query.order(safeColumn, { ascending: direction === 'asc' });
  if (error) throw new ApiError(400, 'vendors_failed', error.message);
  return data ?? [];
}

export async function createVendor(req: Request, organizationId: string, input: z.infer<typeof vendorSchema>) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst']);
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .insert({ ...input, organization_id: organizationId, created_by: req.user.id })
    .select('*')
    .single();
  if (error) throw new ApiError(400, 'vendor_create_failed', error.message);
  await audit({ organizationId, actorId: req.user.id, entityType: 'vendor', entityId: data.id, action: 'created', metadata: { name: data.name } });
  return data;
}

export async function updateVendor(req: Request, organizationId: string, vendorId: string, input: z.infer<typeof vendorSchema>) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst']);
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update(input)
    .eq('organization_id', organizationId)
    .eq('id', vendorId)
    .select('*')
    .single();
  if (error) throw new ApiError(400, 'vendor_update_failed', error.message);
  await audit({ organizationId, actorId: req.user.id, entityType: 'vendor', entityId: vendorId, action: 'updated' });
  return data;
}

export async function deleteVendor(req: Request, organizationId: string, vendorId: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin']);
  const { error } = await supabaseAdmin.from('vendors').delete().eq('organization_id', organizationId).eq('id', vendorId);
  if (error) throw new ApiError(400, 'vendor_delete_failed', error.message);
  await audit({ organizationId, actorId: req.user.id, entityType: 'vendor', entityId: vendorId, action: 'deleted' });
}
