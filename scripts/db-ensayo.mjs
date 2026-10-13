import { spawnSync } from 'node:child_process';
import { ensayoBranchName, assertEnsayoUrl, maskDatabaseUrl } from './lib/db-tools.mjs';

const projectId = process.env.NEON_PROJECT_ID;
// El proyecto de producción tiene más de una base; la de la app es neondb salvo que se indique otra.
const databaseName = process.env.NEON_DATABASE || 'neondb';
const keep = process.argv.includes('--keep');
const branch = ensayoBranchName();
let created = false;
let databaseUrl = '';
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { encoding: 'utf8', env });
  if (result.error) throw new Error(`${command} no está disponible.`);
  return { code: result.status ?? 1, stdout: result.stdout ?? '' };
};
const neon = (...args) => run('npx', ['--yes', 'neonctl@latest', ...args]);
const jsonFrom = (output) => {
  try { return JSON.parse(output); } catch { return output.trim(); }
};
const findConnection = (value) => {
  if (typeof value === 'string' && /^postgres(?:ql)?:\/\//.test(value)) return value;
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) {
      const found = findConnection(child);
      if (found) return found;
    }
  }
  return '';
};

try {
  if (!projectId) throw new Error('Define NEON_PROJECT_ID.');
  if (!/^ensayo-\d{8}-\d{6}$/.test(branch)) throw new Error('Nombre de rama de ensayo inválido.');
  const create = neon('branches', 'create', '--project-id', projectId, '--name', branch, '--parent', 'production', '--no-secrets', '-o', 'json');
  if (create.code !== 0) throw new Error('Neon no pudo crear la rama temporal.');
  created = true;
  const branchData = jsonFrom(create.stdout);
  const branchId = branchData.branch?.id ?? branchData.id ?? branch;
  const response = neon('connection-string', branchId, '--project-id', projectId, '--database-name', databaseName, '-o', 'json');
  if (response.code !== 0) throw new Error('Neon no pudo obtener la conexión de ensayo.');
  databaseUrl = findConnection(jsonFrom(response.stdout));
  if (!databaseUrl) throw new Error('Neon no devolvió una conexión de ensayo.');
  assertEnsayoUrl(databaseUrl);
  const schema = 'apps/api/prisma/schema.prisma';
  const prisma = (command) => run('./node_modules/.bin/prisma', ['migrate', command, '--schema', schema], { ...process.env, DATABASE_URL: databaseUrl });
  const before = prisma('status');
  if (before.code !== 0 && !/not yet been applied|pending migration/i.test(before.stdout)) throw new Error('No se pudo consultar el estado inicial de migraciones.');
  const deploy = prisma('deploy');
  if (deploy.code !== 0) throw new Error('Falló prisma migrate deploy en la rama de ensayo.');
  const after = prisma('status');
  if (after.code !== 0 || !/up to date/i.test(after.stdout)) throw new Error('Las migraciones no quedaron al día.');
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    for (const table of ['User', 'Document', 'Order', '_prisma_migrations']) {
      const result = await client.$queryRawUnsafe(`SELECT count(*)::int AS count FROM "${table}"`);
      console.log(`${table}: ${result[0].count}`);
    }
  } finally {
    await client.$disconnect();
  }
  console.log('Migraciones aplicadas y tablas verificadas.');
} catch (error) {
  const target = databaseUrl ? ` (${maskDatabaseUrl(databaseUrl)})` : '';
  console.error(`db:ensayo: ${error.message}${target}`);
  process.exitCode = 1;
} finally {
  if (created && !keep) {
    const removed = neon('branches', 'delete', branch, '--project-id', projectId, '-f');
    if (removed.code === 0) console.log('Rama temporal eliminada.');
    else {
      console.error('db:ensayo: no se pudo eliminar la rama temporal; revísala en Neon.');
      process.exitCode = 1;
    }
  } else if (created) {
    console.log(`Rama conservada: ${branch} (--keep).`);
  }
}
