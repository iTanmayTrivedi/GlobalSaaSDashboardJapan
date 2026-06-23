
-- Atomic org creation function
CREATE OR REPLACE FUNCTION public.create_org_with_member(
  _name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check duplicate name
  IF EXISTS (SELECT 1 FROM organizations WHERE name = _name) THEN
    RAISE EXCEPTION 'Organization name already exists';
  END IF;

  -- Create org
  INSERT INTO organizations (name)
  VALUES (_name)
  RETURNING id INTO _org_id;

  -- Add creator as org_admin
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (_org_id, _user_id, 'org_admin');

  -- Set as current org in profile
  UPDATE profiles
  SET current_organization_id = _org_id
  WHERE user_id = _user_id;

  -- Log audit event
  INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id)
  VALUES (_org_id, _user_id, 'organization.created', 'organization', _org_id);

  RETURN _org_id;
END;
$$;

-- Add unique constraint on org names
ALTER TABLE organizations ADD CONSTRAINT organizations_name_unique UNIQUE (name);
