import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Organization, OrganizationMembership } from '../lib/types';
import { useAuth } from './AuthContext';

type WorkspaceContextValue = {
  organizations: OrganizationMembership[];
  currentOrg: Organization | null;
  role: string | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  setCurrentOrgId: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session, verified } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState(localStorage.getItem('trustdesk_org') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!session || !verified) {
      setOrganizations([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rows = await api.organizations() as OrganizationMembership[];
      setOrganizations(rows);
      const firstOrg = rows[0]?.organizations;
      const selected = rows.find((row) => row.organizations.id === currentOrgId)?.organizations ?? firstOrg;
      if (selected) {
        setCurrentOrgId(selected.id);
        localStorage.setItem('trustdesk_org', selected.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workspaces could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [session?.access_token, verified]);

  const currentMembership = organizations.find((row) => row.organizations.id === currentOrgId) ?? organizations[0];

  const value = useMemo<WorkspaceContextValue>(() => ({
    organizations,
    currentOrg: currentMembership?.organizations ?? null,
    role: currentMembership?.role ?? null,
    loading,
    error,
    refresh,
    setCurrentOrgId: (id: string) => {
      localStorage.setItem('trustdesk_org', id);
      setCurrentOrgId(id);
    }
  }), [currentMembership, error, loading, organizations]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider.');
  return context;
}
