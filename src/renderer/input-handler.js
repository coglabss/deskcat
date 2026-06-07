// Emits input events: {type:'drag-start'|'drag-move'|'drag-end'|'pet'|'play', x, y}
// getCatRect() returns the cat's current screen rect {x,y,w,h}.
function createInputHandler(canvas, getCatRect, emit, reportHover) {
  let dragging = false;
  let movedDuringDrag = false;

  const inCat = (e) => {
    const r = getCatRect();
    return e.clientX >= r.x && e.clientX <= r.x + r.w &&
           e.clientY >= r.y && e.clientY <= r.y + r.h;
  };

  canvas.addEventListener('mousemove', (e) => {
    reportHover(inCat(e));
    if (dragging) { movedDuringDrag = true; emit({ type: 'drag-move', x: e.clientX, y: e.clientY }); }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (!inCat(e)) return;
    dragging = true; movedDuringDrag = false;
    emit({ type: 'drag-start', x: e.clientX, y: e.clientY });
  });

  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    emit({ type: 'drag-end', x: e.clientX, y: e.clientY });
    if (!movedDuringDrag) emit({ type: 'pet', x: e.clientX, y: e.clientY }); // click w/o move = pet
  });

  canvas.addEventListener('dblclick', (e) => {
    if (inCat(e)) emit({ type: 'play', x: e.clientX, y: e.clientY });
  });
}

module.exports = { createInputHandler };
