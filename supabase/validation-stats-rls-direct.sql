-- RLS Policies for validation_stats View
-- Copy and paste THIS ENTIRE FILE into Supabase SQL Editor
-- DO NOT copy TypeScript code - only copy SQL

DROP VIEW IF EXISTS validation_stats CASCADE;

CREATE OR REPLACE FUNCTION get_validation_stats(
  p_company_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  validation_date DATE,
  company_id UUID,
  total_validations BIGINT,
  unique_operators BIGINT,
  avg_validation_time_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_user_company_id UUID;
BEGIN
  SELECT role, company_id INTO v_user_role, v_user_company_id
  FROM users
  WHERE id = auth.uid();

  IF v_user_role = 'platform_admin' THEN
    RETURN QUERY
    SELECT 
      DATE(t.used_at) as validation_date,
      t.company_id,
      COUNT(*) as total_validations,
      COUNT(DISTINCT t.validated_by) as unique_operators,
      AVG(EXTRACT(EPOCH FROM (t.used_at - t.created_at))) as avg_validation_time_seconds
    FROM tickets t
    WHERE t.status = 'used'
      AND t.used_at IS NOT NULL
      AND (p_company_id IS NULL OR t.company_id = p_company_id)
      AND (p_start_date IS NULL OR DATE(t.used_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(t.used_at) <= p_end_date)
    GROUP BY DATE(t.used_at), t.company_id
    ORDER BY validation_date DESC, t.company_id;
  
  ELSIF v_user_role = 'company_admin' AND v_user_company_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      DATE(t.used_at) as validation_date,
      t.company_id,
      COUNT(*) as total_validations,
      COUNT(DISTINCT t.validated_by) as unique_operators,
      AVG(EXTRACT(EPOCH FROM (t.used_at - t.created_at))) as avg_validation_time_seconds
    FROM tickets t
    WHERE t.status = 'used'
      AND t.used_at IS NOT NULL
      AND t.company_id = v_user_company_id
      AND (p_start_date IS NULL OR DATE(t.used_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(t.used_at) <= p_end_date)
    GROUP BY DATE(t.used_at), t.company_id
    ORDER BY validation_date DESC, t.company_id;
  
  ELSIF v_user_role = 'park_operator' THEN
    SELECT po.company_id INTO v_user_company_id
    FROM park_operators po
    WHERE po.user_id = auth.uid()
      AND po.status = 'active'
    LIMIT 1;
    
    IF v_user_company_id IS NOT NULL THEN
      RETURN QUERY
      SELECT 
        DATE(t.used_at) as validation_date,
        t.company_id,
        COUNT(*) as total_validations,
        COUNT(DISTINCT t.validated_by) as unique_operators,
        AVG(EXTRACT(EPOCH FROM (t.used_at - t.created_at))) as avg_validation_time_seconds
      FROM tickets t
      WHERE t.status = 'used'
        AND t.used_at IS NOT NULL
        AND t.company_id = v_user_company_id
        AND (p_start_date IS NULL OR DATE(t.used_at) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(t.used_at) <= p_end_date)
      GROUP BY DATE(t.used_at), t.company_id
      ORDER BY validation_date DESC, t.company_id;
    END IF;
  END IF;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_validation_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_validation_stats(UUID, DATE, DATE) TO service_role;

CREATE OR REPLACE VIEW validation_stats AS
SELECT 
  DATE(used_at) as validation_date,
  company_id,
  COUNT(*) as total_validations,
  COUNT(DISTINCT validated_by) as unique_operators,
  AVG(EXTRACT(EPOCH FROM (used_at - created_at))) as avg_validation_time_seconds
FROM tickets
WHERE status = 'used'
  AND used_at IS NOT NULL
GROUP BY DATE(used_at), company_id;

GRANT SELECT ON validation_stats TO authenticated;
GRANT SELECT ON validation_stats TO service_role;

CREATE OR REPLACE FUNCTION get_validation_stats_today(
  p_company_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_validations BIGINT,
  unique_operators BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_user_company_id UUID;
BEGIN
  SELECT role, company_id INTO v_user_role, v_user_company_id
  FROM users
  WHERE id = auth.uid();

  IF v_user_role = 'platform_admin' THEN
    RETURN QUERY
    SELECT 
      COUNT(*) as total_validations,
      COUNT(DISTINCT t.validated_by) as unique_operators
    FROM tickets t
    WHERE t.status = 'used'
      AND t.used_at IS NOT NULL
      AND DATE(t.used_at) = CURRENT_DATE
      AND (p_company_id IS NULL OR t.company_id = p_company_id);
  
  ELSIF v_user_role IN ('company_admin', 'park_operator') THEN
    IF v_user_role = 'park_operator' THEN
      SELECT po.company_id INTO v_user_company_id
      FROM park_operators po
      WHERE po.user_id = auth.uid()
        AND po.status = 'active'
      LIMIT 1;
    END IF;
    
    IF v_user_company_id IS NOT NULL THEN
      RETURN QUERY
      SELECT 
        COUNT(*) as total_validations,
        COUNT(DISTINCT t.validated_by) as unique_operators
      FROM tickets t
      WHERE t.status = 'used'
        AND t.used_at IS NOT NULL
        AND DATE(t.used_at) = CURRENT_DATE
        AND t.company_id = v_user_company_id;
    END IF;
  END IF;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_validation_stats_today(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_validation_stats_today(UUID) TO service_role;

CREATE INDEX IF NOT EXISTS idx_operators_user_company_status 
ON park_operators(user_id, company_id, status) 
WHERE status = 'active';

