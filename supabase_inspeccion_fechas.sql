-- ============================================================
-- INSPECCIÓN: ¿Las columnas zombies fecha_inicio / fecha_cierre tienen datos?
-- Ejecutar en SQL Editor de Supabase ANTES de la migración.
-- ============================================================

-- 1. Conteo global: cuántas filas tienen datos en cada columna
SELECT
  COUNT(*)                                       AS total_obs,
  COUNT(fecha_inicio)                             AS con_fecha_inicio_corta,
  COUNT(fecha_cierre)                             AS con_fecha_cierre_corta,
  COUNT(fecha_inicio_comprometida)                AS con_fecha_inicio_larga,
  COUNT(fecha_cierre_estimada)                    AS con_fecha_cierre_larga
FROM public.observaciones;

-- 2. Filas donde la columna CORTA tiene dato pero la LARGA está vacía
--    (estos son los datos que se perderían si solo hacemos DROP sin migrar)
SELECT
  COUNT(*) AS filas_solo_en_columnas_cortas
FROM public.observaciones
WHERE (fecha_inicio IS NOT NULL AND fecha_inicio_comprometida IS NULL)
   OR (fecha_cierre IS NOT NULL AND fecha_cierre_estimada     IS NULL);

-- 3. Muestra de hasta 10 filas con conflicto (cortas y largas con valores distintos)
SELECT id, codigo,
       fecha_inicio,              fecha_inicio_comprometida,
       fecha_cierre,              fecha_cierre_estimada
FROM public.observaciones
WHERE (fecha_inicio              IS NOT NULL AND fecha_inicio_comprometida IS NOT NULL
       AND fecha_inicio              <> fecha_inicio_comprometida)
   OR (fecha_cierre              IS NOT NULL AND fecha_cierre_estimada     IS NOT NULL
       AND fecha_cierre              <> fecha_cierre_estimada)
LIMIT 10;
