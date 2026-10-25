import { setMasterRunner, runSuites } from './harness.mjs';
import { performance } from 'node:perf_hooks';

// Instruct harness that master runner is orchestrating execution
setMasterRunner(true);

const ALL_SUITES = [
  { name: 'rooms', file: './suites/rooms.test.mjs', label: 'Room Management & Host Authority' },
  { name: 'playback', file: './suites/playbackSync.test.mjs', label: 'Cinema Playback & Drift Sync' },
  { name: 'stream', file: './suites/streamResponder.test.mjs', label: 'HTTP 206 Range Streaming Slices' },
  { name: 'chat', file: './suites/chatReactions.test.mjs', label: 'Live Chat & Reaction Physics' },
  { name: 'media', file: './suites/mediaUtils.test.mjs', label: 'Cinema Utilities & Release Sanitization' },
  { name: 'signaling', file: './suites/signalingSecurity.test.mjs', label: 'WebRTC Mesh & Zero-Trust Auth' },
  { name: 'oci', file: './suites/ociStorage.test.mjs', label: 'OCI Object Storage Integration' },
  { name: 'client', file: './suites/clientPiP.test.mjs', label: 'Fullscreen Video PiP & Subtitles' }
];

// CLI filter argument: node test/index.mjs [--suite <name>]
const suiteArgIndex = process.argv.indexOf('--suite');
const filterName = suiteArgIndex !== -1 ? process.argv[suiteArgIndex + 1]?.toLowerCase() : null;

const suitesToRun = filterName
  ? ALL_SUITES.filter((s) => s.name.includes(filterName) || s.label.toLowerCase().includes(filterName))
  : ALL_SUITES;

if (suitesToRun.length === 0) {
  console.error(`\x1b[31mNo test suites found matching filter "${filterName}". Available: ${ALL_SUITES.map((s) => s.name).join(', ')}\x1b[0m`);
  process.exit(1);
}

console.log('========================================================================================');
console.log('🎬 Bliss Real-Time Cinema Watch Party — Comprehensive Test Suite Engine');
console.log(`📡 Node.js Version: ${process.version} | Target: ${suitesToRun.length} Active Test Suites`);
console.log('========================================================================================');

async function execute() {
  const masterStart = performance.now();
  const summaryRows = [];
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  for (const s of suitesToRun) {
    // Dynamically import suite file (registers tests into harness)
    await import(s.file);

    // Run suite
    const result = await runSuites({ silent: false });

    grandTotal += result.total;
    grandPassed += result.passed;
    grandFailed += result.failed;

    summaryRows.push({
      label: s.label,
      total: result.total,
      passed: result.passed,
      failed: result.failed,
      durationMs: result.durationMs,
      status: result.failed === 0 ? '\x1b[32mPASS ✓\x1b[0m' : '\x1b[31mFAIL ✗\x1b[0m'
    });
  }

  const masterDuration = ((performance.now() - masterStart) / 1000).toFixed(2);

  // Executive Summary Table
  console.log('\n========================================================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('========================================================================================');
  console.log(
    'Suite Label'.padEnd(46) +
    'Tests'.padEnd(12) +
    'Status'.padEnd(14) +
    'Duration'
  );
  console.log('-'.repeat(88));

  for (const row of summaryRows) {
    const testCount = `${row.passed}/${row.total}`.padEnd(12);
    const duration = `${row.durationMs}ms`;
    console.log(
      row.label.padEnd(46) +
      testCount +
      row.status.padEnd(23) + // accounts for ANSI color codes
      duration
    );
  }

  console.log('-'.repeat(88));
  if (grandFailed === 0) {
    console.log(
      `\x1b[32m\x1b[1m🎉 ALL ${grandPassed} TESTS ACROSS ${suitesToRun.length} SUITES PASSED! (${masterDuration}s)\x1b[0m`
    );
    console.log('========================================================================================\n');
    process.exit(0);
  } else {
    console.error(
      `\x1b[31m\x1b[1m❌ ${grandFailed} of ${grandTotal} TESTS FAILED ACROSS ${suitesToRun.length} SUITES (${masterDuration}s)\x1b[0m`
    );
    console.log('========================================================================================\n');
    process.exit(1);
  }
}

execute().catch((err) => {
  console.error('\x1b[31mFatal test runner exception:\x1b[0m', err);
  process.exit(1);
});
