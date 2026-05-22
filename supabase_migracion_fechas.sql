-- ============================================================
-- MIGRACIÓN: eliminar columnas zombies fecha_inicio / fecha_cierre
-- Ejecutar en SQL Editor de Supabase DESPUÉS de revisar la inspección.
--
-- Lógica:
--   1. Copia fecha_inicio  → fecha_inicio_comprometida  donde la larga esté NULL
--   2. Copia fecha_cierre  → fecha_cierre_estimada      donde la larga esté NULL
--   3. DROP de las columnas cortas
--
-- Si la columna larga ya tiene valor, se preserva (no se pisa).
-- Si la columna corta es NULL, no hace nada.
-- ============================================================

BEGIN;

-- Paso 1: respaldar valores históricos en las columnas vivas
UPDATE public.observaciones
   SET fecha_inicio_comprometida = fecha_inicio
 WHERE fecha_inicio              IS NOT NULL
   AND fecha_inicio_comprometida IS NULL;

UPDATE public.observaciones
   SET fecha_cierre_estimada = fecha_cierre
 WHERE fecha_cierre              IS NOT NULL
   AND fecha_cierre_estimada IS NULL;

-- Paso 2: verificar que ya no queden datos exclusivos en las cortas
DO $$
DECLARE
  v_huerfanas integer;
BEGIN
  SELECT COUNT(*) INTO v_huerfanas
    FROM public.observaciones
   WHERE (fecha_inicio IS NOT NULL AND fecha_inicio_comprometida IS NULL)
      OR (fecha_cierre IS NOT NULL AND fecha_cierre_estimada     IS NULL);

  IF v_huerfanas > 0 THEN
    RAISE EXCEPTION 'Quedan % filas con datos solo en columnas cortas. Abortar.', v_huerfanas;
  END IF;
END $$;

-- Paso 3: eliminar las columnas zombies
ALTER TABLE public.observaciones DROP COLUMN fecha_inicio;
ALTER TABLE public.observaciones DROP COLUMN fecha_cierre;

COMMIT;

-- Verificación: lista columnas restantes
SELECT column_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'observaciones'
 ORDER BY ordinal_position;
