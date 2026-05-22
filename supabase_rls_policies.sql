-- ============================================================
-- AuditBoard: Row Level Security Policies
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
-- Lógica de permisos (igual que la app):
--   - Área CALIDAD: acceso total (INSERT, UPDATE, DELETE)
--   - Otras áreas: solo lectura + UPDATE limitado a estado/progreso/fechas/comentarios
--   - Tabla actualizaciones: INSERT para todos los autenticados (log inmutable)
-- ============================================================
-- Seguridad adicional (Supabase Linter):
--   - Funciones SECURITY DEFINER usan SET search_path = '' para evitar schema shadowing
--   - observaciones_update restringida por área (no USING true)
--   - Leaked password protection: habilitado en Auth > Settings del dashboard
-- ============================================================

-- Función auxiliar: verifica si el usuario actual pertenece al área CALIDAD
CREATE OR REPLACE FUNCTION public.es_calidad()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles p
    JOIN public.areas a ON a.id = p.area_id
    WHERE p.id = auth.uid()
      AND a.codigo = 'CALIDAD'
  );
$$;

-- ============================================================
-- TABLA: areas
-- Datos de referencia. Todos los autenticados pueden leer.
-- Solo CALIDAD puede modificar (gestionado vía dashboard Supabase).
-- ============================================================
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_select" ON public.areas;
CREATE POLICY "areas_select"
  ON public.areas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "areas_insert" ON public.areas;
CREATE POLICY "areas_insert"
  ON public.areas FOR INSERT
  TO authenticated
  WITH CHECK (public.es_calidad());

DROP POLICY IF EXISTS "areas_update" ON public.areas;
CREATE POLICY "areas_update"
  ON public.areas FOR UPDATE
  TO authenticated
  USING (public.es_calidad());

DROP POLICY IF EXISTS "areas_delete" ON public.areas;
CREATE POLICY "areas_delete"
  ON public.areas FOR DELETE
  TO authenticated
  USING (public.es_calidad());

-- ============================================================
-- TABLA: subareas
-- Datos de referencia. Lectura para todos los autenticados.
-- ============================================================
ALTER TABLE public.subareas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subareas_select" ON public.subareas;
CREATE POLICY "subareas_select"
  ON public.subareas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "subareas_insert" ON public.subareas;
CREATE POLICY "subareas_insert"
  ON public.subareas FOR INSERT
  TO authenticated
  WITH CHECK (public.es_calidad());

DROP POLICY IF EXISTS "subareas_update" ON public.subareas;
CREATE POLICY "subareas_update"
  ON public.subareas FOR UPDATE
  TO authenticated
  USING (public.es_calidad());

DROP POLICY IF EXISTS "subareas_delete" ON public.subareas;
CREATE POLICY "subareas_delete"
  ON public.subareas FOR DELETE
  TO authenticated
  USING (public.es_calidad());

-- ============================================================
-- TABLA: auditorias
-- Solo lectura para todos los autenticados.
-- Gestión de auditorías vía dashboard de Supabase.
-- ============================================================
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditorias_select" ON public.auditorias;
CREATE POLICY "auditorias_select"
  ON public.auditorias FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auditorias_insert" ON public.auditorias;
CREATE POLICY "auditorias_insert"
  ON public.auditorias FOR INSERT
  TO authenticated
  WITH CHECK (public.es_calidad());

DROP POLICY IF EXISTS "auditorias_update" ON public.auditorias;
CREATE POLICY "auditorias_update"
  ON public.auditorias FOR UPDATE
  TO authenticated
  USING (public.es_calidad());

DROP POLICY IF EXISTS "auditorias_delete" ON public.auditorias;
CREATE POLICY "auditorias_delete"
  ON public.auditorias FOR DELETE
  TO authenticated
  USING (public.es_calidad());

-- ============================================================
-- TABLA: perfiles
-- Cada usuario ve su propio perfil.
-- También necesita ver todos para los dropdowns de responsable.
-- ============================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_select" ON public.perfiles;
CREATE POLICY "perfiles_select"
  ON public.perfiles FOR SELECT
  TO authenticated
  USING (true);

-- Solo el propio usuario puede actualizar su perfil (o CALIDAD)
DROP POLICY IF EXISTS "perfiles_update" ON public.perfiles;
CREATE POLICY "perfiles_update"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.es_calidad());

-- Inserción de perfiles gestionada por trigger de auth (o CALIDAD)
DROP POLICY IF EXISTS "perfiles_insert" ON public.perfiles;
CREATE POLICY "perfiles_insert"
  ON public.perfiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.es_calidad());

DROP POLICY IF EXISTS "perfiles_delete" ON public.perfiles;
CREATE POLICY "perfiles_delete"
  ON public.perfiles FOR DELETE
  TO authenticated
  USING (public.es_calidad());

-- ============================================================
-- TABLA: observaciones
-- SELECT: todos los autenticados (Tablero y Dashboard los necesitan)
-- INSERT: solo CALIDAD
-- UPDATE: todos los autenticados (la app limita qué campos)
-- DELETE: solo CALIDAD
-- ============================================================
ALTER TABLE public.observaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "observaciones_select" ON public.observaciones;
CREATE POLICY "observaciones_select"
  ON public.observaciones FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "observaciones_insert" ON public.observaciones;
CREATE POLICY "observaciones_insert"
  ON public.observaciones FOR INSERT
  TO authenticated
  WITH CHECK (public.es_calidad());

DROP POLICY IF EXISTS "observaciones_update" ON public.observaciones;
CREATE POLICY "observaciones_update"
  ON public.observaciones FOR UPDATE
  TO authenticated
  USING (
    public.es_calidad()
    OR area_responsable_id = (
      SELECT area_id FROM public.perfiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "observaciones_delete" ON public.observaciones;
CREATE POLICY "observaciones_delete"
  ON public.observaciones FOR DELETE
  TO authenticated
  USING (public.es_calidad());

-- ============================================================
-- TABLA: actualizaciones
-- Log inmutable: INSERT para todos los autenticados.
-- SELECT para todos. UPDATE/DELETE para nadie.
-- ============================================================
ALTER TABLE public.actualizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actualizaciones_select" ON public.actualizaciones;
CREATE POLICY "actualizaciones_select"
  ON public.actualizaciones FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "actualizaciones_insert" ON public.actualizaciones;
CREATE POLICY "actualizaciones_insert"
  ON public.actualizaciones FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- No hay política UPDATE ni DELETE → nadie puede modificar el log

-- ============================================================
-- FUNCIÓN: generar_codigo_observacion()
-- Devuelve el siguiente código atómico OBS-YYYY-NNN para el año actual.
-- Usa una secuencia por año para evitar race conditions.
-- ============================================================
CREATE OR REPLACE FUNCTION public.generar_codigo_observacion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM NOW())::int;
  v_max integer;
  v_next integer;
  v_prefix text;
BEGIN
  v_prefix := 'OBS-' || v_year::text || '-';

  -- Advisory lock serializa generadores concurrentes (mismo año)
  PERFORM pg_advisory_xact_lock(hashtext('obs_codigo_' || v_year::text));

  SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '^OBS-\d{4}-', ''), '')::int), 0)
    INTO v_max
    FROM public.observaciones
   WHERE codigo LIKE v_prefix || '%';

  v_next := v_max + 1;
  RETURN v_prefix || LPAD(v_next::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generar_codigo_observacion() TO authenticated;

-- ============================================================
-- FUNCIÓN: actualizar_timestamp (trigger BEFORE UPDATE → updated_at)
-- Fix: search_path fijo para evitar schema shadowing (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.actualizar_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Verificación: lista tablas con RLS habilitado
-- ============================================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('areas','subareas','auditorias','perfiles','observaciones','actualizaciones')
ORDER BY tablename;
