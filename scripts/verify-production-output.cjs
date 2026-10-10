const fs = require('node:fs');
const path = require('node:path');

const FORBIDDEN_MARKERS = [
  '_console_ninja',
  'console_ninja',
  'console-ninja',
  'auth.kampusx.test',
  'sb_publishable_test_key',
];

class ProductionOutputError extends Error {}

function verifyProductionOutput(browserDirectory) {
  const directory = path.resolve(browserDirectory);
  const javascriptFiles = [];

  function inspect(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) inspect(entryPath);
      else if (entry.isFile() && /\.js$/i.test(entry.name)) javascriptFiles.push(entryPath);
    }
  }

  try {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
      throw new ProductionOutputError('No production JavaScript files found.');
    }
    inspect(directory);
    if (javascriptFiles.length === 0) {
      throw new ProductionOutputError('No production JavaScript files found.');
    }
    for (const file of javascriptFiles) {
      const source = fs.readFileSync(file, 'utf8').toLowerCase();
      if (FORBIDDEN_MARKERS.some((marker) => source.includes(marker))) {
        const name = path.relative(directory, file).replaceAll(path.sep, '/');
        throw new ProductionOutputError(`Unexpected development runtime or test configuration in ${name}.`);
      }
    }
  } catch (error) {
    if (error instanceof ProductionOutputError) throw error;
    throw new ProductionOutputError('Could not verify production JavaScript files.');
  }

  return { fileCount: javascriptFiles.length };
}

if (require.main === module) {
  try {
    const output = path.resolve(__dirname, '../dist/apps/shell/browser');
    const { fileCount } = verifyProductionOutput(output);
    console.log(`Production output verified: ${fileCount} JavaScript files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { ProductionOutputError, verifyProductionOutput };
