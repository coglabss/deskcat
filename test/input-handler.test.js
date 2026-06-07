const { createInputHandler } = require('../src/renderer/input-handler.js');

function makeTarget() {
  const handlers = {};
  return {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    fire: (type, ev) => { if (handlers[type]) handlers[type](ev); },
  };
}
const at = (x, y) => ({ clientX: x, clientY: y });

describe('createInputHandler', () => {
  let canvas, emitted, hovers;
  const catRect = { x: 100, y: 100, w: 50, h: 50 };

  beforeEach(() => {
    canvas = makeTarget();
    global.window = makeTarget(); // input-handler binds mouseup on window
    emitted = [];
    hovers = [];
    createInputHandler(canvas, () => catRect, (e) => emitted.push(e), (o) => hovers.push(o));
  });
  afterEach(() => { delete global.window; });

  test('reports hover true over cat and false off cat', () => {
    canvas.fire('mousemove', at(120, 120));
    canvas.fire('mousemove', at(10, 10));
    expect(hovers).toEqual([true, false]);
  });

  test('click on cat without moving emits drag-start, drag-end, then pet', () => {
    canvas.fire('mousedown', at(120, 120));
    global.window.fire('mouseup', at(120, 120));
    expect(emitted.map((e) => e.type)).toEqual(['drag-start', 'drag-end', 'pet']);
  });

  test('mousedown off the cat emits nothing', () => {
    canvas.fire('mousedown', at(10, 10));
    global.window.fire('mouseup', at(10, 10));
    expect(emitted).toEqual([]);
  });

  test('moving between down and up counts as a drag, not a pet', () => {
    canvas.fire('mousedown', at(120, 120));
    canvas.fire('mousemove', at(140, 140));
    global.window.fire('mouseup', at(140, 140));
    const types = emitted.map((e) => e.type);
    expect(types).toContain('drag-start');
    expect(types).toContain('drag-move');
    expect(types).toContain('drag-end');
    expect(types).not.toContain('pet');
  });

  test('double-click on the cat emits play', () => {
    canvas.fire('dblclick', at(120, 120));
    expect(emitted.map((e) => e.type)).toEqual(['play']);
  });
});
