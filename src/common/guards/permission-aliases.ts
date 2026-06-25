/**
 * Compatibilidad con permisos legacy (español) mientras el JWT no se refresca.
 * Cada clave nueva acepta equivalentes antiguos del mismo rol.
 */
const LEGACY_GRANTS: Record<string, string[]> = {
  'nodos:read': ['nodos:leer', 'nodos:gestionar'],
  'nodos:create': ['nodos:gestionar'],
  'nodos:update': ['nodos:gestionar'],
  'nodos:delete': ['nodos:gestionar'],
  'zonas:read': ['zonas:leer', 'zonas:gestionar'],
  'zonas:create': ['zonas:gestionar'],
  'zonas:update': ['zonas:gestionar'],
  'eventos:read': ['eventos:leer', 'eventos:gestionar'],
  'eventos:read_all': ['eventos:read_all', 'eventos:leer', 'eventos:gestionar'],
  'eventos:create': ['eventos:create', 'eventos:gestionar'],
  'reportes:read_anon': ['reportes:read_anon', 'reportes:ver', 'reportes:read_all'],
  'reportes:read_all': ['reportes:read_all', 'reportes:ver'],
  'reportes:update': ['reportes:update', 'reportes:gestionar'],
  'alertas:read': ['alertas:read', 'alertas:leer', 'alertas:read_all'],
  'alertas:read_all': ['alertas:read_all', 'alertas:leer'],
  'alertas:update_status': ['alertas:update_status', 'alertas:gestionar'],
  'usuarios:update': ['usuarios:update', 'usuarios:actualizar', 'usuarios:eliminar'],
  'usuarios:read': ['usuarios:read', 'usuarios:leer'],
  'usuarios:create': ['usuarios:create', 'usuarios:crear'],
};

export function userHasPermission(
  userPermisos: string[],
  required: string,
): boolean {
  if (userPermisos.includes(required)) return true;

  const legacy = LEGACY_GRANTS[required];
  return legacy?.some((p) => userPermisos.includes(p)) ?? false;
}
