import * as path from 'node:path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run() {

  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: path.join(path.resolve(__dirname, '..', '..', '..'), 'out', 'test', 'reports'),
      reportFilename: 'test-results',
      html: true,
      json: false
    }
  });

  const testsRoot = path.resolve(__dirname, '..');

  const files = await glob('**/**.test.js', { cwd: testsRoot });

  // Add files to the test suite
  files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

  await new Promise((resolve, reject) => {

    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve(null);
      }
    });
  });
}
