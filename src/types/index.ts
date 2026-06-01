export type EstadoObservacion =
  | 'sin_fecha'
  | 'fecha_comprometida'
  | 'en_ejecucion'
  | 'en_verificacion'
  | 'levantada'

export type SeveridadObservacion = 'critica' | 'mayor' | 'menor'

export type TipoObservacion =
  | 'estructura'
  | 'maquinaria'
  | 'producto'
  | 'documentacion'
  | 'seguridad'
  | 'limpieza'

export interface Auditoria {
  id: string
  nombre?: string        // etiqueta para el selector (fallback: fecha o id)
  activa: boolean
  created_at?: string
}

export interface Area {
  id: string
  nombre: string
  codigo: string
  color: string
}

export interface Subarea {
  id: string
  nombre: string
  area_id: string
}

export interface Perfil {
  id: string
  nombre_completo: string
  area_id: string
  rol: 'jefe' | 'supervisor' | 'tecnico' | 'auditor'
  area?: Area
}

export interface Observacion {
  id: string
  codigo: string
  auditoria_id: string
  tipo: TipoObservacion
  severidad: SeveridadObservacion
  titulo: string
  descripcion?: string
  accion_requerida?: string
  ubicacion?: string
  area_responsable_id: string
  subarea_id?: string
  responsable_id?: string
  creado_por: string
  estado: EstadoObservacion
  fecha_inicio_comprometida?: string
  fecha_cierre_estimada?: string
  fecha_cierre_real?: string
  porcentaje_avance: number
  created_at: string
  updated_at: string
  area_responsable?: Area
  subarea?: Subarea
  responsable?: Perfil
}

export interface Actualizacion {
  id: string
  observacion_id: string
  usuario_id: string
  tipo: 'comentario' | 'cambio_estado' | 'fecha_comprometida' | 'avance' | 'cierre'
  contenido?: string
  estado_anterior?: string
  estado_nuevo?: string
  porcentaje_anterior?: number
  porcentaje_nuevo?: number
  created_at: string
  usuario?: Perfil
}