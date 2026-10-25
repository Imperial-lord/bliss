import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

export { assert };

/**
 * Registered test suites in memory.
 */
const registry = {
  suites: [],
  currentSuite: null,
  isMasterRunner: false
};

/**
 * Configure harness mode (standalone vs master runner).
 * @param {boolean} isMaster
 */
export function setMasterRunner(isMaster) {
  registry.isMasterRunner = isMaster;
}

/**
 * Defines a named test suite block.
 *
 * @param {string} suiteName - Descriptive suite title
 * @param {Function} fn - Suite definition callback
 */
export function describe(suiteName, fn) {
  const suite = {
    name: suiteName,
    tests: [],
    beforeHooks: [],
    afterHooks: [],
    beforeEachHooks: [],
    afterEachHooks: []
  };

  registry.suites.push(suite);
  registry.currentSuite = suite;

  try {
    fn();
  } finally {
    registry.currentSuite = null;
  }
}

/**
 * Registers an individual test case.
 *
 * @param {string} testName - Description of the test
 * @param {Function} fn - Synchronous or async test function
 */
export function test(testName, fn) {
  if (!registry.currentSuite) {
    describe('Default Suite', () => {
      registry.currentSuite.tests.push({ name: testName, fn });
    });
    return;
  }
  registry.currentSuite.tests.push({ name: testName, fn });
}

export const it = test;

/**
 * Hooks
 */
export function before(fn) {
  if (registry.currentSuite) registry.currentSuite.beforeHooks.push(fn);
}

export function after(fn) {
  if (registry.currentSuite) registry.currentSuite.afterHooks.push(fn);
}

export function beforeEach(fn) {
  if (registry.currentSuite) registry.currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn) {
  if (registry.currentSuite) registry.currentSuite.afterEachHooks.push(fn);
}

/**
 * Executes all registered test suites.
 *
 * @param {Object} [options]
 * @param {boolean} [options.silent=false]
 * @returns {Promise<{ total: number, passed: number, failed: number, durationMs: number, failures: Array }>}
 */
export async function runSuites(options = {}) {
  const startTime = performance.now();
  let total = 0;
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const suite of registry.suites) {
    if (!options.silent) {
      console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${suite.name}\x1b[0m`);
    }

    // Run before hooks
    for (const hook of suite.beforeHooks) {
      await hook();
    }

    // Run test cases
    for (const t of suite.tests) {
      total++;

      // Run beforeEach hooks
      for (const hook of suite.beforeEachHooks) {
        await hook();
      }

      const testStart = performance.now();
      try {
        await t.fn();
        const duration = (performance.now() - testStart).toFixed(2);
        passed++;
        if (!options.silent) {
          console.log(`  \x1b[32m✓\x1b[0m ${t.name} \x1b[90m(${duration}ms)\x1b[0m`);
        }
      } catch (err) {
        const duration = (performance.now() - testStart).toFixed(2);
        failed++;
        failures.push({
          suite: suite.name,
          test: t.name,
          error: err
        });
        if (!options.silent) {
          console.log(`  \x1b[31m✗\x1b[0m ${t.name} \x1b[90m(${duration}ms)\x1b[0m`);
          console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
          if (err.stack) {
            const relevantStack = err.stack
              .split('\n')
              .slice(1, 4)
              .join('\n');
            console.log(`\x1b[90m${relevantStack}\x1b[0m`);
          }
        }
      }

      // Run afterEach hooks
      for (const hook of suite.afterEachHooks) {
        try {
          await hook();
        } catch (e) {
          console.error('Error in afterEach hook:', e);
        }
      }
    }

    // Run after hooks
    for (const hook of suite.afterHooks) {
      try {
        await hook();
      } catch (e) {
        console.error('Error in after hook:', e);
      }
    }
  }

  const durationMs = parseFloat((performance.now() - startTime).toFixed(2));

  // Reset registry for subsequent runs if needed
  registry.suites = [];

  return { total, passed, failed, durationMs, failures };
}

/**
 * Auto-runner for standalone execution (`node suite.test.mjs`).
 * If not triggered via the master test runner, automatically runs when the event loop is idle.
 */
let autoRunScheduled = false;
export function scheduleAutoRun() {
  if (autoRunScheduled || registry.isMasterRunner) return;
  autoRunScheduled = true;

  queueMicrotask(() => {
    setTimeout(async () => {
      if (registry.isMasterRunner || registry.suites.length === 0) return;

      console.log('===============================================================');
      console.log('🧪 Bliss Standalone Test Suite Runner');
      console.log('===============================================================');

      const results = await runSuites();

      console.log('\n===============================================================');
      if (results.failed === 0) {
        console.log(
          `\x1b[32m🎉 ALL ${results.passed} TESTS PASSED SUCCESSFULLY! (${results.durationMs}ms)\x1b[0m`
        );
        process.exit(0);
      } else {
        console.error(
          `\x1b[31m❌ ${results.failed} of ${results.total} TESTS FAILED (${results.durationMs}ms)\x1b[0m`
        );
        process.exit(1);
      }
    }, 10);
  });
}
