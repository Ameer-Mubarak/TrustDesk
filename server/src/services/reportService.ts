import type { Request } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errors';
import { requireOrgRole } from '../middleware/auth';

export async function getDashboard(req: Request, organizationId: string) {
  await requireOrgRole(req, organizationId, ['owner', 'admin', 'analyst', 'viewer']);
  const [vendors, assessments, tasks, activity, subscription] = await Promise.all([
    supabaseAdmin.from('vendors').select('id,status,risk,annual_spend,next_review_date').eq('organization_id', organizationId),
    supabaseAdmin.from('assessments').select('id,status,score,due_date').eq('organization_id', organizationId),
    supabaseAdmin.from('tasks').select('id,status,priority,due_date').eq('organization_id', organizationId),
    supabaseAdmin.from('activity_events').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(12),
    supabaseAdmin.from('subscriptions').select('*').eq('organization_id', organizationId).single()
  ]);

  for (const result of [vendors, assessments, tasks, activity, subscription]) {
    if (result.error) throw new ApiError(400, 'dashboard_failed', result.error.message);
  }

  const vendorRows = vendors.data ?? [];
  const taskRows = tasks.data ?? [];
  const assessmentRows = assessments.data ?? [];

  return {
    metrics: {
      vendors: vendorRows.length,
      criticalVendors: vendorRows.filter((v) => v.risk === 'critical').length,
      openTasks: taskRows.filter((t) => t.status !== 'done').length,
      averageScore: assessmentRows.length ? Math.round(assessmentRows.reduce((sum, a) => sum + a.score, 0) / assessmentRows.length) : 0,
      annualSpend: vendorRows.reduce((sum, v) => sum + Number(v.annual_spend), 0)
    },
    riskBreakdown: ['low', 'medium', 'high', 'critical'].map((risk) => ({ risk, count: vendorRows.filter((v) => v.risk === risk).length })),
    activity: activity.data ?? [],
    subscription: subscription.data
  };
}
