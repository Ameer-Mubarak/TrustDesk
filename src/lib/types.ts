export type Risk = 'low' | 'medium' | 'high' | 'critical';
export type VendorStatus = 'prospect' | 'reviewing' | 'approved' | 'restricted' | 'offboarded';
export type AssessmentStatus = 'draft' | 'in_review' | 'approved' | 'rejected';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done';
export type Role = 'owner' | 'admin' | 'analyst' | 'viewer';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  subscriptions?: Subscription[];
};

export type Subscription = {
  organization_id: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  seats: number;
  renewal_date: string;
};

export type OrganizationMembership = {
  role: Role;
  organizations: Organization;
};

export type Vendor = {
  id: string;
  organization_id: string;
  name: string;
  owner_email: string;
  category: string;
  status: VendorStatus;
  risk: Risk;
  annual_spend: number;
  data_access: string;
  next_review_date: string;
  notes: string;
  updated_at: string;
};

export type Assessment = {
  id: string;
  vendor_id: string;
  name: string;
  status: AssessmentStatus;
  due_date: string;
  score: number;
  vendors?: { name: string; risk: Risk; status: VendorStatus };
};

export type Task = {
  id: string;
  vendor_id?: string | null;
  assessment_id?: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Risk;
  assignee_id?: string | null;
  due_date: string;
  vendors?: { name: string };
};

export type ActivityEvent = {
  id: string;
  entity_type: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Dashboard = {
  metrics: {
    vendors: number;
    criticalVendors: number;
    openTasks: number;
    averageScore: number;
    annualSpend: number;
  };
  riskBreakdown: Array<{ risk: Risk; count: number }>;
  activity: ActivityEvent[];
  subscription: Subscription;
};
