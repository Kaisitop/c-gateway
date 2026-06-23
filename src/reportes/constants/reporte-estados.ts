/** Debe mantenerse alineado con ms-core/src/reportes/constants/reporte-estados.ts */
export const REPORTE_ESTADOS = [
  'PENDIENTE',
  'EN_PROCESO',
  'RESUELTO',
  'FALSO',
] as const;

export const REPORTE_ESTADOS_OPERADOR = [
  'EN_PROCESO',
  'RESUELTO',
  'FALSO',
] as const;

export type ReporteEstado = (typeof REPORTE_ESTADOS)[number];
