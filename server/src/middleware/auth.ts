import type { NextFunction, Request, Response } from 'express';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseAdmin, supabaseForToken } from '../config/supabase';
import { ApiError } from './errors';

export type Role = 'owner' | 'admin' | 'analyst' | 'viewer';

declare global {
  namespace Express {
    interface Request {
      user: User;
      db: SupabaseClient;
      accessToken: string;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'missing_token', 'Authentication is required.'));

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return next(new ApiError(401, 'invalid_token', 'Your session is no longer valid.'));
  if (!data.user.email_confirmed_at) return next(new ApiError(403, 'email_unverified', 'Verify your email before accessing TrustDesk.'));

  req.user = data.user;
  req.accessToken = token;
  req.db = supabaseForToken(token);
  return next();
}

export async function requireOrgRole(req: Request, orgId: string, roles: Role[]) {
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error || !data) throw new ApiError(403, 'forbidden', 'You do not have access to this workspace.');
  if (!roles.includes(data.role as Role)) throw new ApiError(403, 'insufficient_role', 'Your role cannot perform this action.');
  return data.role as Role;
}
