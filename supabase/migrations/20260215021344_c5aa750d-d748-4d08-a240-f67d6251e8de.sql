
-- Update RPC to accept optional role parameter
CREATE OR REPLACE FUNCTION public.create_org_with_member(
  _name text,
  _role app_role DEFAULT 'org_admin'
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

  IF EXISTS (SELECT 1 FROM organizations WHERE name = _name) THEN
    RAISE EXCEPTION 'Organization name already exists';
  END IF;

  INSERT INTO organizations (name)
  VALUES (_name)
  RETURNING id INTO _org_id;

  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (_org_id, _user_id, _role);

  UPDATE profiles
  SET current_organization_id = _org_id
  WHERE user_id = _user_id;

  INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id)
  VALUES (_org_id, _user_id, 'organization.created', 'organization', _org_id);

  RETURN _org_id;
END;
$$;
