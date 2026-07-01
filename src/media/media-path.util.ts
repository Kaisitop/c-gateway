import { randomBytes } from 'crypto';

export type MediaUploadKind = 'reporte' | 'evidencia';

/** America/Guayaquil — fecha/hora de emisión en Ecuador. */
function getEmittedAtParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${pick('hour')}${pick('minute')}${pick('second')}`,
  };
}

export function buildCloudinaryUploadPath(
  rootFolder: string,
  kind: MediaUploadKind,
  userId: string,
) {
  const { date, time } = getEmittedAtParts();
  const scope = kind === 'evidencia' ? 'policial' : 'ciudadano';
  const suffix = randomBytes(4).toString('hex');
  const shortUser = userId.replace(/-/g, '').slice(0, 8);

  const folder = `${rootFolder}/${scope}/${date}`;
  const publicId = `${date}_${time}_${shortUser}_${suffix}`;

  return {
    folder,
    publicId,
    scope,
    emittedDate: date,
    tags: ['centinela', scope, date, userId],
    context: {
      kind,
      scope,
      emitted_date: date,
      emitted_at: `${date}T${time}`,
      uploaded_by: userId,
    },
  };
}
