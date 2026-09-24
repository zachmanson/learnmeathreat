// `npm test`: builds the site with fixture posts included (into dist-test/),
// then runs the node:test suite against that output. Setting the env var
// here instead of inline in package.json keeps it working on Windows
// without a cross-env dependency.

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const env = { ...process.env, LMAT_TEST_FIXTURES: '1' };

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npx', ['astro', 'build']);

const testFiles = readdirSync('tests')
  .filter((file) => file.endsWith('.test.mjs'))
  .map((file) => `tests/${file}`);
run('node', ['--test', ...testFiles]);
