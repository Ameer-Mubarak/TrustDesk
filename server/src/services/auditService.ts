import { supabaseAdmin } from '../config/supabase';

type AuditInput = {
  organizationId: string;
  actorId: string;
  entityType: 'organization' | 'vendor' | 'assessment' | 'task' | 'member' | 'subscription';
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput) {
  await supabaseAdmin.from('activity_events').insert({
    organization_id: input.organizationId,
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    metadata: input.metadata ?? {}
  });
}
