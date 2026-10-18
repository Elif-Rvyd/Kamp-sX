const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const modules = new Map();
function load(name) {
  const file = path.resolve(__dirname, '../libs/shared/util', name + '.ts');
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const js = ts.transpileModule(
    fs.readFileSync(file, 'utf8').replaceAll('import.meta.url', JSON.stringify('file:///post-video-test.js')),
    {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  new Function('require', 'exports', js)((specifier) => load(specifier), exports);
  return exports;
}
const { preparePostVideo, POST_VIDEO_MAX_BYTES, POST_VIDEO_SOURCE_MAX_BYTES } = load('post-video');
const source = (size = POST_VIDEO_MAX_BYTES + 1) => {
  const file = new File(['fixture'], 'campus.mp4', { type: 'video/mp4' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
const workers = [];
class WorkerFixture {
  constructor() {
    workers.push(this);
  }
  postMessage(file) {
    this.input = file;
  }
  terminate() {
    this.terminated = true;
  }
  reply(data) {
    this.onmessage?.({ data });
  }
}
test.beforeEach(() => {
  workers.length = 0;
  global.Worker = WorkerFixture;
});
test.afterEach(() => {
  delete global.Worker;
});
test('small videos also require preparation instead of leaking the original metadata', async () => {
  const file = source(POST_VIDEO_MAX_BYTES);
  const progress = [];
  const result = preparePostVideo(file, { onProgress: (value) => progress.push(value) });
  assert.equal(workers[0].input, file);
  workers[0].reply({ kind: 'progress', percent: 42 });
  const clean = source(100);
  workers[0].reply({ kind: 'done', file: clean });
  assert.equal(await result, clean);
  assert.notEqual(clean, file);
  assert.equal(workers[0].terminated, true);
  assert.deepEqual(progress, []);
});
test('oversized videos send only the File and accept a bounded video result', async () => {
  const file = source(),
    progress = [];
  const result = preparePostVideo(file, { onProgress: (value) => progress.push(value) });
  assert.equal(workers[0].input, file);
  workers[0].reply({ kind: 'progress', percent: 42.5 });
  const prepared = new File(['encoded'], 'campus.webm', { type: 'video/webm' });
  workers[0].reply({ kind: 'done', file: prepared });
  assert.equal(await result, prepared);
  assert.deepEqual(progress, [0, 42]);
  assert.equal(workers[0].terminated, true);
});
test('unsupported, empty and excessive source files fail before starting work', async () => {
  await assert.rejects(preparePostVideo(new File(['x'], 'text.txt', { type: 'text/plain' })), {
    key: 'media.errors.invalidVideo',
  });
  await assert.rejects(preparePostVideo(new File([], 'empty.mp4', { type: 'video/mp4' })), {
    key: 'media.errors.invalidVideo',
  });
  await assert.rejects(preparePostVideo(source(POST_VIDEO_SOURCE_MAX_BYTES + 1)), {
    key: 'media.errors.videoSourceSize',
  });
  assert.equal(workers.length, 0);
});
test('a missing Worker API gives a recoverable error', async () => {
  delete global.Worker;
  await assert.rejects(preparePostVideo(source()), { key: 'media.errors.videoUnsupported' });
});
test('aborted and canceled tasks terminate without accepting delayed results', async () => {
  const previous = new AbortController();
  previous.abort();
  await assert.rejects(preparePostVideo(source(), { signal: previous.signal }), { name: 'AbortError' });
  assert.equal(workers.length, 0);
  const controller = new AbortController();
  const result = preparePostVideo(source(), { signal: controller.signal });
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
  assert.equal(workers[0].terminated, true);
  workers[0].reply({ kind: 'done', file: source(100) });
});
test('oversized or non-video worker outputs never reach Storage', async () => {
  for (const file of [source(), new File(['x'], 'x.html', { type: 'text/html' })]) {
    const result = preparePostVideo(source());
    workers.at(-1).reply({ kind: 'done', file });
    await assert.rejects(result, { key: 'media.errors.videoCompression' });
    assert.equal(workers.at(-1).terminated, true);
  }
});
test('worker failures reveal only localized allowlisted errors', async () => {
  const result = preparePostVideo(source());
  workers[0].reply({ kind: 'error', key: 'arbitrary private decoder details' });
  await assert.rejects(result, { key: 'media.errors.videoCompression' });
  assert.equal(workers[0].terminated, true);
});
test('worker crashes clean up and permit a fresh retry', async () => {
  const failed = preparePostVideo(source());
  workers[0].onerror();
  await assert.rejects(failed, { key: 'media.errors.videoCompression' });
  assert.equal(workers[0].terminated, true);
  const retried = preparePostVideo(source());
  const file = source(200);
  workers[1].reply({ kind: 'done', file });
  assert.equal(await retried, file);
});

test('malformed worker replies fail immediately and release resources', async () => {
  for (const data of [
    null,
    'invalid',
    {},
    { kind: 'unknown' },
    { kind: 'progress', percent: NaN },
    { kind: 'error' },
    { kind: 'done' },
  ]) {
    const result = preparePostVideo(source());
    workers.at(-1).reply(data);
    await assert.rejects(result, { key: 'media.errors.videoCompression' });
    assert.equal(workers.at(-1).terminated, true);
  }
});

test('message deserialization failure terminates preparation and permits retry', async () => {
  const result = preparePostVideo(source());
  workers[0].onmessageerror();
  await assert.rejects(result, { key: 'media.errors.videoCompression' });
  assert.equal(workers[0].terminated, true);
});

test('a stalled worker cannot retain resources beyond the preparation deadline', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const result = preparePostVideo(source());
  const rejected = assert.rejects(result, { key: 'media.errors.videoCompression' });
  context.mock.timers.tick(10 * 60 * 1000);
  await rejected;
  assert.equal(workers[0].terminated, true);
});
