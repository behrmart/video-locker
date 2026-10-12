const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function setup() {
  const calls = [];
  const source = fs.readFileSync(path.join(__dirname, '../services/media-duration.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', compiled)(() => ({
    execFile: (command, args, options, callback) => calls.push({ command, args, options, callback })
  }), module.exports, module);
  return { calls, get: module.exports.getVideoDuration };
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('reads durations without a shell and reuses matching metadata', async () => {
  const { calls, get } = setup();
  const filename = '/media/video with spaces;$(example).mp4';
  const first = get(filename, 100, 1);
  assert.equal(first, get(filename, 100, 1));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'ffprobe');
  assert.equal(calls[0].args.at(-1), filename);
  assert.equal(calls[0].options.shell, undefined);
  assert.equal(calls[0].options.timeout, 15000);
  calls[0].callback(null, JSON.stringify({ format: { duration: '65.25' } }));
  assert.equal(await first, 65.25);
  assert.equal(await get(filename, 100, 1), 65.25);
  const changed = get(filename, 101, 2);
  assert.equal(calls.length, 2);
  calls[1].callback(null, JSON.stringify({ streams: [{ duration: '70' }, { duration: '75' }] }));
  assert.equal(await changed, 75);
});

test('missing, invalid, or unreadable metadata returns an unknown duration', async () => {
  const { calls, get } = setup();
  for (const [index, output] of ['{}', 'not json', '{"format":{"duration":"N/A"}}', '{"format":{"duration":"-1"}}'].entries()) {
    const result = get('/media/' + index + '.mp4', 1, 1);
    calls.at(-1).callback(null, output);
    assert.equal(await result, null);
  }
  const failed = get('/media/failed.mp4', 1, 1);
  calls.at(-1).callback(new Error('timeout or missing ffprobe'), '');
  assert.equal(await failed, null);
});

test('limits concurrent processes and continues queued work after failures', async () => {
  const { calls, get } = setup();
  const results = Array.from({ length: 5 }, (_, index) => get('/media/' + index + '.mp4', 1, 1));
  assert.equal(calls.length, 3);
  calls[0].callback(new Error('invalid video'), '');
  await tick();
  assert.equal(calls.length, 4);
  calls[1].callback(null, '{"format":{"duration":"0"}}');
  await tick();
  assert.equal(calls.length, 5);
  for (let index = 2; index < 5; index++) calls[index].callback(null, '{"format":{"duration":"10"}}');
  assert.deepEqual(await Promise.all(results), [null, 0, 10, 10, 10]);
});
