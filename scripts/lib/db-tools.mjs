import path from 'node:path';

export function maskDatabaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.username) url.username = '***';
    if (url.password) url.password = '***';
    for (const key of url.searchParams.keys()) {
      if (/pass(word)?/i.test(key)) url.searchParams.set(key, '***');
    }
    return url.toString();
  } catch {
    return '[URL inválida]';
  }
}

export function parseDatabaseUrl(value) {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

export function assertBackupHost(value) {
  const url = parseDatabaseUrl(value);
  const production = url?.hostname.startsWith('ep-hidden-dew') && url.hostname.endsWith('.neon.tech');
  if (!url || (!production && !['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('DIRECT_DATABASE_URL debe apuntar a producción o a una BD local segura.');
  }
  return url;
}

export function assertEnsayoUrl(value) {
  const url = parseDatabaseUrl(value);
  if (!url || url.hostname.includes('ep-hidden-dew') || !url.hostname.endsWith('.neon.tech')) {
    throw new Error('La URL de ensayo no apunta a una rama segura de Neon.');
  }
  return url;
}

export function resolveBackupDir(value, repoRoot) {
  if (!value) throw new Error('Define BACKUP_DIR fuera del repositorio.');
  const target = path.resolve(repoRoot, value);
  const relative = path.relative(path.resolve(repoRoot), target);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new Error('BACKUP_DIR debe estar fuera del repositorio.');
  }
  return target;
}

export function backupName(date = new Date(), label = '') {
  if (label && !/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error('Etiqueta inválida.');
  const stamp = date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  return `prod-${stamp}${label ? `-${label}` : ''}.dump`;
}

export function ensayoBranchName(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  return `ensayo-${stamp}`;
}

export function backupFilesToRemove(entries, keep) {
  const dumps = entries.filter((entry) => entry.isFile() && /^prod-.*\.dump$/.test(entry.name));
  dumps.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return dumps.slice(Math.max(0, keep)).map((entry) => entry.name);
}
