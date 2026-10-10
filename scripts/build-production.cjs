const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { generateEnvironment } = require('./generate-environment.cjs');
const { ProductionOutputError, verifyProductionOutput } = require('./verify-production-output.cjs');

function runProductionBuild() {
  const root = path.resolve(__dirname, '..');
  try {
    generateEnvironment({ root, strict: true });
  } catch {
    console.error('Production build requires valid SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY configuration.');
    return 1;
  }

  let result;
  try {
    const packagePath = require.resolve('nx/package.json');
    const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const binary = path.resolve(path.dirname(packagePath), manifest.bin.nx);
    result = spawnSync(process.execPath, [binary, 'build', 'shell', '--configuration=production'], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'true',
        NODE_ENV: 'production',
        NX_DAEMON: 'false',
        NX_TUI: 'false',
        NX_ISOLATE_PLUGINS: 'false',
      },
    });
  } catch {
    console.error('Could not start the production build.');
    return 1;
  }

  if (result.error || result.status === null) {
    console.error('Production build did not complete successfully.');
    return 1;
  }
  if (result.status !== 0) return result.status;

  try {
    const { fileCount } = verifyProductionOutput(path.join(root, 'dist/apps/shell/browser'));
    console.log(`Production output verified: ${fileCount} JavaScript files.`);
    return 0;
  } catch (error) {
    console.error(
      error instanceof ProductionOutputError
        ? error.message
        : 'Could not verify production JavaScript files.',
    );
    return 1;
  }
}

if (require.main === module) process.exitCode = runProductionBuild();

module.exports = { runProductionBuild };
