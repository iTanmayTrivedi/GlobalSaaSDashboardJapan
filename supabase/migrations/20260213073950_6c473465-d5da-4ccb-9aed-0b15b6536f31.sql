-- Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'member');

-- Plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization members (links users to orgs with roles)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Audit log
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Add organization_id to profiles
ALTER TABLE public.profiles ADD COLUMN current_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add soft delete to profiles
ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMPTZ;

-- Timestamp trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function: check if user is member of org
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  );
$$;

-- Security definer function: check user role in org
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = _role
  );
$$;

-- Security definer function: check if super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- RLS: organizations - members can view their orgs, super admins see all
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(auth.uid(), id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.has_org_role(auth.uid(), id, 'org_admin') OR public.is_super_admin(auth.uid()));

-- RLS: organization_members
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.has_org_role(auth.uid(), organization_id, 'org_admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can update members"
  ON public.organization_members FOR UPDATE
  USING (public.has_org_role(auth.uid(), organization_id, 'org_admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can remove members"
  ON public.organization_members FOR DELETE
  USING (public.has_org_role(auth.uid(), organization_id, 'org_admin') OR public.is_super_admin(auth.uid()));

-- Self-insert policy: creator becomes org_admin
CREATE POLICY "Users can add themselves as org creator"
  ON public.organization_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'org_admin');

-- RLS: audit_logs
CREATE POLICY "Org members can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_org_member(auth.uid(), organization_id));

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _org_id UUID,
  _action TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (_org_id, auth.uid(), _action, _entity_type, _entity_id, _metadata)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;