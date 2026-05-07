import type { Observacion, Area, Subarea, Perfil, Actualizacion } from '../types'

// ─── IDs de referencia ───────────────────────────────────────────────────────
const AID_CAL = 'demo-area-calidad'
const AID_PRO = 'demo-area-produccion'
const AID_LOG = 'demo-area-logistica'
const AID_MAN = 'demo-area-mantenimiento'

// ─── Áreas ───────────────────────────────────────────────────────────────────
export const DEMO_AREAS: Area[] = [
  { id: AID_CAL, nombre: 'Calidad',              codigo: 'CALIDAD',           color: '#c0392b' },
  { id: AID_PRO, nombre: 'Producción',           codigo: 'PRODUCCION',        color: '#1a6fb5' },
  { id: AID_LOG, nombre: 'Logística y Almacén',  codigo: 'LOGISTICA Y ALMACEN', color: '#d97706' },
  { id: AID_MAN, nombre: 'Mantenimiento',        codigo: 'MANTENIMIENTO',     color: '#16a34a' },
]

// ─── Subáreas ─────────────────────────────────────────────────────────────────
export const DEMO_SUBAREAS: Subarea[] = [
  { id: 'sub-cal-lab', nombre: 'Laboratorio',        area_id: AID_CAL },
  { id: 'sub-cal-doc', nombre: 'Documentación',      area_id: AID_CAL },
  { id: 'sub-cal-bpm', nombre: 'BPM',                area_id: AID_CAL },
  { id: 'sub-pro-l1',  nombre: 'Línea 1',            area_id: AID_PRO },
  { id: 'sub-pro-l2',  nombre: 'Línea 2',            area_id: AID_PRO },
  { id: 'sub-pro-apt', nombre: 'Almacén PT',         area_id: AID_PRO },
  { id: 'sub-log-rec', nombre: 'Recepción',          area_id: AID_LOG },
  { id: 'sub-log-des', nombre: 'Despacho',           area_id: AID_LOG },
  { id: 'sub-log-fri', nombre: 'Almacén Frío',       area_id: AID_LOG },
  { id: 'sub-man-mec', nombre: 'Mecánico',           area_id: AID_MAN },
  { id: 'sub-man-ele', nombre: 'Eléctrico',          area_id: AID_MAN },
  { id: 'sub-man-civ', nombre: 'Civil',              area_id: AID_MAN },
]

// ─── Usuario demo (área CALIDAD = acceso completo) ────────────────────────────
export const DEMO_PERFIL: Perfil = {
  id:             'demo-user-id',
  nombre_completo:'Usuario Demo',
  area_id:        AID_CAL,
  rol:            'auditor',
  area:           DEMO_AREAS[0],
}

export const DEMO_AUDITORIA_ID = 'demo-auditoria-2026'
export const DEMO_AUDITORIA    = { id: DEMO_AUDITORIA_ID, activa: true }

// ─── Alias cortos ─────────────────────────────────────────────────────────────
const [CAL, PRO, LOG, MAN] = DEMO_AREAS
const [sCalLab, sCalDoc, sCalBpm, sProL1, sProL2, sProApt, sLogRec, sLogDes, sLogFri, sManMec, sManEle, sManCiv] = DEMO_SUBAREAS

// ─── Helper para construir observaciones ─────────────────────────────────────
function o(
  n: number,
  area: Area,
  sub: Subarea,
  estado: Observacion['estado'],
  sev: Observacion['severidad'],
  tipo: Observacion['tipo'],
  titulo: string,
  pct: number,
  mes: number,
  dia: number,
  desc?: string,
  accion?: string,
): Observacion {
  const mm  = String(mes).padStart(2, '0')
  const dd  = String(dia).padStart(2, '0')
  const cod = `OBS-2026-${String(n).padStart(3, '0')}`

  const tieneFecha  = ['fecha_comprometida','en_ejecucion','en_verificacion','levantada'].includes(estado)
  const tieneCierre = ['en_ejecucion','en_verificacion','levantada'].includes(estado)
  const diaStart    = Math.min(dia + 7, 28)
  const mesClose    = Math.min(mes + 2, 12)

  return {
    id:                        `demo-obs-${n}`,
    codigo:                    cod,
    auditoria_id:              DEMO_AUDITORIA_ID,
    tipo,
    severidad:                 sev,
    titulo,
    descripcion:               desc  ?? `Observación ${cod} identificada en auditoría interna del trimestre.`,
    accion_requerida:          accion ?? 'Implementar acción correctiva documentada con evidencia de cierre.',
    ubicacion:                 sub.nombre,
    area_responsable_id:       area.id,
    subarea_id:                sub.id,
    creado_por:                DEMO_PERFIL.id,
    estado,
    fecha_inicio_comprometida: tieneFecha  ? `2026-${mm}-${String(diaStart).padStart(2,'0')}` : undefined,
    fecha_cierre_estimada:     tieneCierre ? `2026-${String(mesClose).padStart(2,'0')}-28`     : undefined,
    fecha_cierre_real:         estado === 'levantada' ? `2026-${String(Math.min(mes+1,12)).padStart(2,'0')}-15` : undefined,
    porcentaje_avance:         pct,
    created_at:                `2026-${mm}-${dd}T08:00:00.000Z`,
    updated_at:                `2026-${mm}-${dd}T08:00:00.000Z`,
    area_responsable:          area,
    subarea:                   sub,
  }
}

// ─── 30 Observaciones ────────────────────────────────────────────────────────
// Distribución:
//  Estado:    sin_fecha(4) fecha_comprometida(6) en_ejecucion(8) en_verificacion(7) levantada(5)
//  Severidad: critica(7)  mayor(14)             menor(9)
//  Áreas:     ~7-8 por área
//  Meses:     enero(8) febrero(7) marzo(8) abril(7) — año 2026

export const DEMO_OBSERVACIONES: Observacion[] = [
  // ── ENERO (8) ──
  o(1,  LOG, sLogFri, 'en_ejecucion',      'mayor',  'producto',      'Temperatura de almacén frío fuera de rango permitido',                  45, 1, 8,
    'Se detectaron temperaturas superiores a 4°C durante turno noche, comprometiendo la cadena de frío.',
    'Revisar y calibrar termómetros, verificar el sistema de refrigeración y establecer registros horarios.'),
  o(2,  PRO, sProL1,  'levantada',          'mayor',  'seguridad',     'Falta de señalización de seguridad en Línea 1',                        100, 1, 10,
    'Ausencia de señalética de EPP en los accesos a la Línea 1.',
    'Instalar señalética reglamentaria en todos los accesos y puntos críticos.'),
  o(3,  CAL, sCalDoc, 'en_verificacion',    'mayor',  'documentacion', 'Procedimientos de trazabilidad desactualizados',                        85, 1, 12,
    'Los procedimientos SOP-CAL-003 y SOP-CAL-007 no han sido revisados desde 2024.',
    'Actualizar procedimientos y gestionar aprobación por la Jefatura de Calidad.'),
  o(4,  MAN, sManMec, 'fecha_comprometida', 'menor',  'maquinaria',    'Plan de mantenimiento preventivo desactualizado',                       10, 1, 15,
    'El plan de mantenimiento de equipos críticos tiene más de 6 meses sin actualización.',
    'Revisar y actualizar el plan incluyendo los nuevos equipos adquiridos en Q4 2025.'),
  o(5,  LOG, sLogRec, 'sin_fecha',          'critica','documentacion', 'Ausencia de registros de inspección en recepción',                       0, 1, 18,
    'No se encuentran registros de inspección de las últimas 3 semanas.',
    'Restablecer inmediatamente el registro de inspección e ingreso y capacitar al personal.'),
  o(6,  PRO, sProL2,  'en_ejecucion',       'mayor',  'producto',      'Contaminación cruzada detectada en Línea 2',                            60, 1, 20,
    'Se hallaron residuos del producto anterior sin el protocolo de limpieza entre corridas.',
    'Reforzar el procedimiento de limpieza e implementar check de verificación visual.'),
  o(7,  CAL, sCalBpm, 'en_verificacion',    'menor',  'limpieza',      'Incumplimiento de programa BPM en zona de pesado',                     90, 1, 22,
    'Personal de zona de pesado no cumple uso de cofia y mascarilla según manual BPM.',
    'Capacitar al personal y establecer control diario de cumplimiento con registro firmado.'),
  o(8,  MAN, sManEle, 'en_ejecucion',       'mayor',  'maquinaria',    'Tablero eléctrico principal sin protección adecuada',                   40, 1, 25,
    'El tablero eléctrico presenta puerta sin seguro y cables expuestos en área de producción.',
    'Instalar seguro en la puerta del tablero y canalizar cables según norma técnica.'),

  // ── FEBRERO (7) ──
  o(9,  PRO, sProL1,  'fecha_comprometida', 'critica','estructura',    'Grieta estructural en techo sobre Línea 1',                             20, 2, 3,
    'Grieta de ~15 cm en techo de concreto sobre la Línea 1 con riesgo de caída de material.',
    'Evaluar con ingeniero civil, encapsular temporalmente y reparar según informe técnico.'),
  o(10, LOG, sLogDes, 'en_verificacion',    'menor',  'documentacion', 'Guías de remisión sin correlativo correcto',                            85, 2, 5,
    'Se hallaron 12 guías de remisión con numeración no correlativa, incumpliendo reglamento SUNAT.',
    'Regularizar las guías con el área contable y establecer control de emisión correlativa.'),
  o(11, CAL, sCalLab, 'levantada',          'mayor',  'maquinaria',    'Balanza analítica sin certificado de calibración vigente',             100, 2, 8,
    'La balanza analítica tiene certificado de calibración vencido desde noviembre 2025.',
    'Coordinar calibración con proveedor certificado y obtener nuevo certificado.'),
  o(12, MAN, sManCiv, 'sin_fecha',          'menor',  'estructura',    'Piso deteriorado en pasillo de acceso al almacén',                      0, 2, 10,
    'El pasillo principal presenta grietas y levantamientos que constituyen riesgo de caída.',
    'Reparar el piso deteriorado e instalar señalética preventiva durante la obra.'),
  o(13, PRO, sProApt, 'en_verificacion',    'mayor',  'documentacion', 'Registros de inventario PT con diferencias no justificadas',            80, 2, 14,
    'Diferencias superiores al 2% entre inventario físico y sistema en 3 de los últimos 5 cierres.',
    'Realizar inventario de conciliación e implementar procedimiento de ajustes documentados.'),
  o(14, LOG, sLogFri, 'fecha_comprometida', 'critica','maquinaria',    'Compresor del almacén frío con ruido anormal',                          15, 2, 18,
    'El compresor principal genera ruido metálico inusual que podría indicar desgaste interno.',
    'Solicitar inspección técnica con proveedor autorizado y evaluar necesidad de reemplazo.'),
  o(15, CAL, sCalDoc, 'en_ejecucion',       'mayor',  'documentacion', 'Matriz de riesgos no actualizada para el año 2026',                    50, 2, 22,
    'La matriz de riesgos de inocuidad no ha sido revisada conforme al análisis de peligros del nuevo año.',
    'Actualizar la matriz con el equipo HACCP incluyendo nuevos proveedores y materias primas.'),

  // ── MARZO (8) ──
  o(16, MAN, sManMec, 'fecha_comprometida', 'menor',  'maquinaria',    'Lubricación de equipos fuera de cronograma',                            5, 3, 3,
    'Cuatro equipos de la línea de producción con más de 30 días de retraso en lubricación.',
    'Ejecutar lubricación pendiente y ajustar el cronograma de mantenimiento preventivo.'),
  o(17, PRO, sProL2,  'levantada',          'mayor',  'seguridad',     'EPP incompleto en operadores de Línea 2',                             100, 3, 5,
    'El 40% de los operadores de Línea 2 no utilizaba protectores auditivos durante el turno.',
    'Proveer EPP completo, capacitar y establecer control de uso obligatorio con registro diario.'),
  o(18, LOG, sLogRec, 'en_ejecucion',       'menor',  'documentacion', 'Proveedores sin evaluación anual actualizada',                          35, 3, 8,
    'El 60% de los proveedores de materias primas sin evaluación de desempeño anual actualizada.',
    'Completar evaluación según cronograma del procedimiento PRO-COM-002 y archivar evidencias.'),
  o(19, CAL, sCalLab, 'en_verificacion',    'critica','producto',      'Resultado fuera de especificación no gestionado',                       95, 3, 10,
    'Resultado microbiológico fuera de especificación del 05/03 sin reporte de no conformidad ni disposición del producto.',
    'Bloquear lote afectado, emitir reporte NC, investigar causa raíz y definir disposición.'),
  o(20, MAN, sManEle, 'en_ejecucion',       'mayor',  'maquinaria',    'Instalaciones eléctricas sin esquema actualizado',                      55, 3, 12,
    'Los esquemas eléctricos no reflejan las modificaciones realizadas en la ampliación de 2025.',
    'Actualizar los esquemas con electricista certificado y archivarlos en mantenimiento.'),
  o(21, PRO, sProL1,  'sin_fecha',          'menor',  'limpieza',      'Limpieza de fajas transportadoras deficiente',                          0, 3, 15,
    'Las fajas transportadoras de Línea 1 presentan acumulación de residuos en zonas de retorno.',
    'Diseñar procedimiento específico de limpieza para zonas de difícil acceso e incorporarlo al programa.'),
  o(22, LOG, sLogDes, 'en_verificacion',    'mayor',  'documentacion', 'Discrepancias en despacho por falta de verificación doble',             88, 3, 18,
    'Tres despachos con cantidades incorrectas atribuidos a falta de control de doble verificación.',
    'Implementar doble verificación en despacho y registrar conformidad del picking en el sistema ERP.'),
  o(23, CAL, sCalBpm, 'fecha_comprometida', 'critica','documentacion', 'Manual BPM sin revisión desde 2023',                                   25, 3, 22,
    'El Manual de BPM no incorpora los cambios de layout de planta ni los nuevos productos lanzados.',
    'Revisar y actualizar el Manual BPM completo con validación del equipo de calidad y Gerencia.'),

  // ── ABRIL (7) ──
  o(24, MAN, sManCiv, 'en_ejecucion',       'mayor',  'estructura',    'Techo de almacén con infiltraciones de agua',                          30, 4, 2,
    'Manchas de humedad en el techo del almacén de materias primas que comprometen la inocuidad.',
    'Evaluar con especialista, impermeabilizar la zona afectada y revisar materiales expuestos.'),
  o(25, PRO, sProApt, 'fecha_comprometida', 'menor',  'documentacion', 'Kardex de producto terminado con registros incompletos',                10, 4, 5,
    'Los kardex físicos de PT presentan registros sin fecha ni firma en el 30% de los movimientos de marzo.',
    'Completar registros pendientes y capacitar al personal en el correcto llenado de documentos.'),
  o(26, LOG, sLogFri, 'levantada',          'critica','maquinaria',    'Falla en sistema de monitoreo de temperatura en almacén frío',         100, 4, 7,
    'El sistema de alarma no emitió alerta cuando la temperatura superó el límite crítico por 4 horas.',
    'Reparar el sistema de alarma, validar funcionamiento y establecer protocolo de verificación diaria.'),
  o(27, CAL, sCalLab, 'en_ejecucion',       'mayor',  'maquinaria',    'Microscopio del laboratorio sin mantenimiento preventivo',              65, 4, 8,
    'El microscopio no tiene registro de mantenimiento en los últimos 12 meses.',
    'Realizar mantenimiento preventivo con técnico especializado y establecer frecuencia anual.'),
  o(28, MAN, sManMec, 'sin_fecha',          'critica','maquinaria',    'Fuga de vapor en tubería principal de producción',                      0, 4, 10,
    'Fuga de vapor en la tubería principal de pasteurización con riesgo de quemaduras y pérdida de eficiencia.',
    'Detener y reparar la fuga de inmediato, inspeccionar el tramo completo y documentar la reparación.'),
  o(29, PRO, sProL2,  'en_verificacion',    'mayor',  'producto',      'Merma de producción superior al límite permitido',                      78, 4, 12,
    'La merma de Línea 2 supera el 8% cuando el límite es 5%, sin análisis de causa raíz documentado.',
    'Realizar análisis de causa raíz, implementar mejoras y monitorear la merma semanalmente.'),
  o(30, LOG, sLogRec, 'levantada',          'menor',  'documentacion', 'Formato de recepción sin campo de temperatura para cadena de frío',    100, 4, 14,
    'El formato de recepción de MP no incluye el campo de temperatura de ingreso para materiales fríos.',
    'Actualizar el formato incluyendo el campo de temperatura con rango aceptable y distribuir.'),
]

// ─── Historial de actualizaciones ────────────────────────────────────────────
// Perfiles secundarios para el historial
const u_demo = DEMO_PERFIL
const u_log: Perfil  = { id: 'u-log',  nombre_completo: 'Luis Torres',   area_id: AID_LOG, rol: 'supervisor', area: DEMO_AREAS[2] }
const u_pro: Perfil  = { id: 'u-pro',  nombre_completo: 'Marco Quispe',   area_id: AID_PRO, rol: 'tecnico',    area: DEMO_AREAS[1] }
const u_cal: Perfil  = { id: 'u-cal',  nombre_completo: 'Ana Ramos',      area_id: AID_CAL, rol: 'tecnico',    area: DEMO_AREAS[0] }
const u_man: Perfil  = { id: 'u-man',  nombre_completo: 'Pedro Vargas',   area_id: AID_MAN, rol: 'tecnico',    area: DEMO_AREAS[3] }

function act(
  id: string, obsN: number, user: Perfil,
  tipo: Actualizacion['tipo'],
  eaAnterior: string | undefined, eaNuevo: string | undefined,
  pctAnterior: number, pctNuevo: number,
  contenido: string,
  fecha: string,
): Actualizacion {
  return {
    id, observacion_id: `demo-obs-${obsN}`, usuario_id: user.id,
    tipo, estado_anterior: eaAnterior, estado_nuevo: eaNuevo,
    porcentaje_anterior: pctAnterior, porcentaje_nuevo: pctNuevo,
    contenido, created_at: fecha, usuario: user,
  }
}

export const DEMO_ACTUALIZACIONES: Actualizacion[] = [
  // OBS-1 (en_ejecucion: LOG Almacén Frío)
  act('a1-1',  1, u_demo, 'cambio_estado', 'sin_fecha','fecha_comprometida',  0,  0, 'Se programó revisión con técnico especializado de refrigeración.',                  '2026-01-10T09:30:00.000Z'),
  act('a1-2',  1, u_log,  'cambio_estado', 'fecha_comprometida','en_ejecucion', 0, 45, 'Diagnóstico realizado: falla en termostato. Reemplazo en proceso.',               '2026-01-15T14:20:00.000Z'),

  // OBS-2 (levantada: PRO Línea 1)
  act('a2-1',  2, u_pro,  'cambio_estado', 'sin_fecha','fecha_comprometida',   0,  0, 'Cotización de señalética solicitada al área de Seguridad.',                        '2026-01-11T10:00:00.000Z'),
  act('a2-2',  2, u_pro,  'cambio_estado', 'fecha_comprometida','en_ejecucion', 0, 60, 'Señalética adquirida. Instalación en progreso.',                                  '2026-01-16T11:30:00.000Z'),
  act('a2-3',  2, u_pro,  'cambio_estado', 'en_ejecucion','en_verificacion',  60, 95, 'Toda la señalética instalada. Pendiente verificación de Calidad.',                 '2026-01-20T16:00:00.000Z'),
  act('a2-4',  2, u_demo, 'cierre',        'en_verificacion','levantada',     95,100, 'Señalética verificada conforme. Observación levantada.',                           '2026-01-22T09:00:00.000Z'),

  // OBS-3 (en_verificacion: CAL Documentación)
  act('a3-1',  3, u_demo, 'cambio_estado', 'sin_fecha','fecha_comprometida',   0,  0, 'Asignado a responsable de Documentación para revisión.',                           '2026-01-13T08:00:00.000Z'),
  act('a3-2',  3, u_cal,  'cambio_estado', 'fecha_comprometida','en_ejecucion', 0, 50, 'Procedimientos SOP-CAL-003 y SOP-CAL-007 en revisión. Avance 50%.',               '2026-01-20T10:30:00.000Z'),
  act('a3-3',  3, u_cal,  'avance',        'en_ejecucion','en_verificacion',  50, 85, 'Procedimientos actualizados y enviados a Jefatura para aprobación.',               '2026-01-28T15:00:00.000Z'),

  // OBS-6 (en_ejecucion: PRO Línea 2)
  act('a6-1',  6, u_demo, 'cambio_estado', 'sin_fecha','fecha_comprometida',   0,  0, 'Jefe de producción notificado. Protocolo a reforzar en 7 días.',                   '2026-01-21T09:00:00.000Z'),
  act('a6-2',  6, u_pro,  'cambio_estado', 'fecha_comprometida','en_ejecucion', 0, 60, 'Protocolo de limpieza actualizado. Check list implementado y capacitación lista.', '2026-01-27T14:00:00.000Z'),

  // OBS-7 (en_verificacion: CAL BPM)
  act('a7-1',  7, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 60, 'Capacitación BPM realizada. Control diario implementado.',                         '2026-01-24T10:00:00.000Z'),
  act('a7-2',  7, u_cal,  'avance',        'en_ejecucion','en_verificacion',  60, 90, 'Registro de cumplimiento al 100% durante 2 semanas. Listo para verificación.',     '2026-02-05T09:00:00.000Z'),

  // OBS-8 (en_ejecucion: MAN Eléctrico)
  act('a8-1',  8, u_demo, 'cambio_estado', 'sin_fecha','fecha_comprometida',   0,  0, 'Riesgo eléctrico identificado. Plazo 10 días para corrección.',                    '2026-01-26T08:00:00.000Z'),
  act('a8-2',  8, u_man,  'cambio_estado', 'fecha_comprometida','en_ejecucion', 0, 40, 'Seguro de puerta instalado. Canalización de cables en progreso.',                 '2026-02-02T11:00:00.000Z'),

  // OBS-11 (levantada: CAL Laboratorio)
  act('a11-1',11, u_cal,  'cambio_estado', 'sin_fecha','en_ejecucion',         0, 50, 'Calibración programada con Mettler Toledo para el 12/02.',                        '2026-02-10T08:00:00.000Z'),
  act('a11-2',11, u_cal,  'avance',        'en_ejecucion','en_verificacion',  50, 90, 'Calibración realizada. Certificado recibido. Pendiente archivo.',                  '2026-02-13T16:00:00.000Z'),
  act('a11-3',11, u_demo, 'cierre',        'en_verificacion','levantada',     90,100, 'Certificado verificado y archivado. Observación levantada.',                       '2026-02-15T10:00:00.000Z'),

  // OBS-13 (en_verificacion: PRO Almacén PT)
  act('a13-1',13, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 40, 'Inventario de conciliación iniciado. Equipo de almacén asignado.',                 '2026-02-16T09:00:00.000Z'),
  act('a13-2',13, u_pro,  'avance',        'en_ejecucion','en_verificacion',  40, 80, 'Conciliación completada. Procedimiento de ajustes implementado. Enviado a CAL.',   '2026-02-24T15:00:00.000Z'),

  // OBS-15 (en_ejecucion: CAL Documentación)
  act('a15-1',15, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 50, 'Reunión HACCP realizada. Análisis de peligros iniciado con equipo de calidad.',    '2026-02-24T10:00:00.000Z'),

  // OBS-17 (levantada: PRO Línea 2)
  act('a17-1',17, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 70, 'EPP adquirido y distribuido. Capacitación y registro diario iniciados.',            '2026-03-07T09:00:00.000Z'),
  act('a17-2',17, u_pro,  'avance',        'en_ejecucion','en_verificacion',  70, 95, 'Cumplimiento 100% por 2 semanas consecutivas. Evidencias archivadas.',              '2026-03-20T14:00:00.000Z'),
  act('a17-3',17, u_demo, 'cierre',        'en_verificacion','levantada',     95,100, 'Uso de EPP verificado conforme. Observación levantada.',                           '2026-03-25T10:00:00.000Z'),

  // OBS-18 (en_ejecucion: LOG Recepción)
  act('a18-1',18, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 35, 'Lista de proveedores a evaluar definida. Proceso iniciado con el área de Compras.', '2026-03-10T09:00:00.000Z'),

  // OBS-19 (en_verificacion: CAL Laboratorio)
  act('a19-1',19, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 70, 'Lote bloqueado. NC-2026-003 emitida. Descarte de lote aprobado por Gerencia.',      '2026-03-11T10:00:00.000Z'),
  act('a19-2',19, u_cal,  'avance',        'en_ejecucion','en_verificacion',  70, 95, 'Acciones correctivas implementadas. Procedimiento de muestreo actualizado.',       '2026-03-18T14:00:00.000Z'),

  // OBS-20 (en_ejecucion: MAN Eléctrico)
  act('a20-1',20, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 55, 'Electricista asignado. Levantamiento de instalaciones en proceso.',                '2026-03-14T09:00:00.000Z'),

  // OBS-22 (en_verificacion: LOG Despacho)
  act('a22-1',22, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 60, 'Procedimiento de doble verificación implementado. Personal capacitado.',            '2026-03-20T09:00:00.000Z'),
  act('a22-2',22, u_log,  'avance',        'en_ejecucion','en_verificacion',  60, 88, 'Sin errores de despacho en 2 semanas. Registro en ERP implementado.',              '2026-03-28T15:00:00.000Z'),

  // OBS-24 (en_ejecucion: MAN Civil)
  act('a24-1',24, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 30, 'Ingeniero civil evaluó el techo. Presupuesto aprobado. Materiales adquiridos.',    '2026-04-04T10:00:00.000Z'),

  // OBS-26 (levantada: LOG Almacén Frío)
  act('a26-1',26, u_log,  'cambio_estado', 'sin_fecha','en_ejecucion',         0, 60, 'Sensor de temperatura defectuoso reemplazado. Sistema de alarma reparado.',        '2026-04-09T11:00:00.000Z'),
  act('a26-2',26, u_log,  'avance',        'en_ejecucion','en_verificacion',  60, 95, 'Sistema probado con simulación de falla. Alarma activa correctamente.',            '2026-04-11T14:00:00.000Z'),
  act('a26-3',26, u_demo, 'cierre',        'en_verificacion','levantada',     95,100, 'Sistema de alarma verificado conforme. Protocolo diario en ejecución.',            '2026-04-14T09:00:00.000Z'),

  // OBS-27 (en_ejecucion: CAL Laboratorio)
  act('a27-1',27, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 65, 'Mantenimiento preventivo realizado por técnico Olympus. Óptica y alineación OK.',  '2026-04-10T10:00:00.000Z'),

  // OBS-29 (en_verificacion: PRO Línea 2)
  act('a29-1',29, u_demo, 'cambio_estado', 'sin_fecha','en_ejecucion',         0, 50, 'Causa raíz: falla en regulación de velocidad de faja. Acción en implementación.',  '2026-04-14T09:00:00.000Z'),
  act('a29-2',29, u_pro,  'avance',        'en_ejecucion','en_verificacion',  50, 78, 'Regulador calibrado. Merma en 5.8% esta semana (tendencia descendente).',           '2026-04-15T16:00:00.000Z'),

  // OBS-30 (levantada: LOG Recepción)
  act('a30-1',30, u_log,  'cambio_estado', 'sin_fecha','en_ejecucion',         0, 70, 'Formato actualizado con campo de temperatura. Distribuido a responsables.',        '2026-04-15T10:00:00.000Z'),
  act('a30-2',30, u_log,  'avance',        'en_ejecucion','en_verificacion',  70, 95, 'Formato en uso durante 1 semana sin observaciones. Registros completos.',          '2026-04-16T09:00:00.000Z'),
  act('a30-3',30, u_demo, 'cierre',        'en_verificacion','levantada',     95,100, 'Formato verificado conforme. Registros de temperatura correctos. Levantada.',      '2026-04-17T10:00:00.000Z'),
]
