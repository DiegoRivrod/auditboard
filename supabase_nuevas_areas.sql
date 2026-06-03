-- ================================================================
-- Nuevas áreas y subáreas — AuditBoard
-- Ejecutar en el SQL Editor de Supabase
-- ================================================================

-- 1. Área: Medición de Mejora
DO $$
DECLARE
  v_area_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.areas (id, nombre, codigo, color)
  VALUES (v_area_id, 'Medición de Mejora', 'MEDICION DE MEJORA', '#0891b2');

  INSERT INTO public.subareas (id, nombre, area_id)
  VALUES (gen_random_uuid(), 'Gestión de Calidad', v_area_id);
END $$;

-- 2. Área: Oportunidad de Mejora
DO $$
DECLARE
  v_area_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.areas (id, nombre, codigo, color)
  VALUES (v_area_id, 'Oportunidad de Mejora', 'OPORTUNIDAD DE MEJORA', '#db2777');

  INSERT INTO public.subareas (id, nombre, area_id)
  VALUES (gen_random_uuid(), 'Producción',     v_area_id);

  INSERT INTO public.subareas (id, nombre, area_id)
  VALUES (gen_random_uuid(), 'Calidad',        v_area_id);

  INSERT INTO public.subareas (id, nombre, area_id)
  VALUES (gen_random_uuid(), 'Logística',      v_area_id);

  INSERT INTO public.subareas (id, nombre, area_id)
  VALUES (gen_random_uuid(), 'Almacén de MP',  v_area_id);

  INSERT INTO public.subareas (id, nombre, area_id)
  VALUES (gen_random_uuid(), 'Almacén de PT',  v_area_id);
END $$;
