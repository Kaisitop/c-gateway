/** Debe mantenerse alineado con ms-core/src/reportes/constants/reporte-tipos.ts */
export const REPORTE_TIPOS = [
  'PANICO',
  'HOMICIDIO_SICARIATO',
  'SECUESTRO',
  'ROBO',
  'EXTORSION',
  'PERSONA_SOSPECHOSA',
  'VEHICULO_SOSPECHOSO',
] as const;

export type ReporteTipo = (typeof REPORTE_TIPOS)[number];
