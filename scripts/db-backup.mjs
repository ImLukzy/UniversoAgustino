import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertBackupHost, backupFilesToRemove, backupName, maskDatabaseUrl, resolveBackupDir } from './lib/db-tools.mjs';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const option = (name, fallback = '') => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1] ?? '';
};
let pendingFile = '';

try {
  const databaseUrl = process.env.DIRECT_DATABASE_URL;
  if (!databaseUrl) throw new Error('Define DIRECT_DATABASE_URL.');
  assertBackupHost(databaseUrl);
  const directory = resolveBackupDir(process.env.BACKUP_DIR, root);
  const keep = Number(option('--keep', '10'));
  if (!Number.isInteger(keep) || keep < 1) throw new Error('--keep debe ser un entero positivo.');
  const label = option('--label');
  const filename = backupName(new Date(), label);
  await fs.promises.mkdir(directory, { recursive: true, mode: 0o700 });
  const realDirectory = await fs.promises.realpath(directory);
  resolveBackupDir(realDirectory, root);
  const file = path.join(realDirectory, filename);
  pendingFile = file;
  const uid = process.getuid?.() ?? 1000;
  const gid = process.getgid?.() ?? 1000;
  const run = (command, runArgs, options = {}) => {
    const result = spawnSync(command, runArgs, { encoding: 'utf8', ...options });
    if (result.error || result.status !== 0) throw new Error(`${command} falló${result.status === null ? '' : ` (código ${result.status})`}.`);
    return result.stdout ?? '';
  };
  const docker = (argsForDocker, options) => run('docker', argsForDocker, options);
  const network = process.platform === 'linux' ? ['--network', 'host'] : [];
  const envArgs = ['-e', 'DATABASE_URL'];
  const version = docker(['run', '--rm', ...network, ...envArgs, 'postgres:18', 'sh', '-c', 'psql "$DATABASE_URL" -Atc "SHOW server_version"'], { env: { ...process.env, DATABASE_URL: databaseUrl } }).trim();
  const serverMajor = Number(version.match(/^\d+/)?.[0]);
  const dumpVersion = docker(['run', '--rm', 'postgres:18', 'pg_dump', '--version']);
  const dumpMajor = Number(dumpVersion.match(/\b(\d+)\./)?.[1]);
  if (!serverMajor || !dumpMajor || dumpMajor < serverMajor) throw new Error('pg_dump no es compatible con la versión del servidor.');
  const fd = fs.openSync(file, 'wx', 0o600);
  try {
    docker(['run', '--rm', ...network, '-u', `${uid}:${gid}`, ...envArgs, 'postgres:18', 'sh', '-c', 'pg_dump -Fc --no-owner --no-privileges "$DATABASE_URL"'], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: ['ignore', fd, 'pipe'] });
  } finally {
    fs.closeSync(fd);
  }
  await fs.promises.chmod(file, 0o600);
  const listing = docker(['run', '--rm', '-v', `${file}:/backup.dump:ro`, 'postgres:18', 'pg_restore', '-l', '/backup.dump']);
  if (!listing.includes('TABLE DATA') || !listing.includes('_prisma_migrations')) throw new Error('La copia no contiene datos y migraciones verificables.');
  const entries = (await fs.promises.readdir(realDirectory, { withFileTypes: true })).map(async (entry) => ({
    name: entry.name,
    isFile: () => entry.isFile(),
    mtimeMs: (await fs.promises.stat(path.join(realDirectory, entry.name))).mtimeMs,
  }));
  const removals = backupFilesToRemove(await Promise.all(entries), keep);
  await Promise.all(removals.map((name) => fs.promises.unlink(path.join(realDirectory, name))));
  console.log(`Copia verificada: ${file} (permisos 600).`);
} catch (error) {
  if (pendingFile) await fs.promises.rm(pendingFile, { force: true }).catch(() => {});
  const target = process.env.DIRECT_DATABASE_URL ? ` (${maskDatabaseUrl(process.env.DIRECT_DATABASE_URL)})` : '';
  console.error(`db:backup: ${error.message}${target}`);
  process.exitCode = 1;
}
