import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { assertBackupHost, assertEnsayoUrl, backupFilesToRemove, backupName, ensayoBranchName, maskDatabaseUrl, resolveBackupDir } from './db-tools.mjs';

test('rechaza directorios de copia dentro del repositorio', () => {
  assert.throws(() => resolveBackupDir('tmp/backups', '/repo'));
  assert.equal(resolveBackupDir('/var/backups/ua', '/repo'), path.resolve('/var/backups/ua'));
});

test('el ensayo no admite el host de producción', () => {
  assert.throws(() => assertEnsayoUrl('postgresql://u:p@ep-hidden-dew.neon.tech/db'));
  assert.equal(assertEnsayoUrl('postgresql://u:p@ep-orange-mountain.neon.tech/db').hostname, 'ep-orange-mountain.neon.tech');
});

test('backup admite producción o Postgres local', () => {
  assert.equal(assertBackupHost('postgresql://u:p@ep-hidden-dew.neon.tech/db').hostname, 'ep-hidden-dew.neon.tech');
  assert.equal(assertBackupHost('postgresql://u:p@localhost:5432/db').hostname, 'localhost');
  assert.throws(() => assertBackupHost('postgresql://u:p@evil.example/db'));
});

test('rotación conserva N y solo selecciona dumps de producción', () => {
  const entries = [
    { name: 'prod-new.dump', mtimeMs: 3, isFile: () => true },
    { name: 'prod-old.dump', mtimeMs: 1, isFile: () => true },
    { name: 'other.dump', mtimeMs: 0, isFile: () => true },
  ];
  assert.deepEqual(backupFilesToRemove(entries, 1), ['prod-old.dump']);
});

test('nombres de copia y rama incluyen fecha UTC y etiqueta segura', () => {
  const date = new Date('2026-10-13T12:34:56.000Z');
  assert.equal(backupName(date, 'pre-migration'), 'prod-20261013-123456-pre-migration.dump');
  assert.equal(ensayoBranchName(date), 'ensayo-20261013-123456');
  assert.throws(() => backupName(date, '../unsafe'));
});

test('el enmascarado no expone la contraseña', () => {
  const safe = maskDatabaseUrl('postgresql://alice:supersecret@ep-hidden-dew.neon.tech/db');
  assert.match(safe, /postgresql:\/\/\*\*\*:\*\*\*@/);
  assert.doesNotMatch(safe, /supersecret/);
  assert.doesNotMatch(maskDatabaseUrl('postgresql://alice@localhost/db?password=supersecret'), /supersecret/);
});
