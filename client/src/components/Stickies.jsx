import { useRef } from 'react';

const NOTES = [
  { id: 's1', title: 'Auth', text: 'JWT + bcrypt. Tokens last 7 days.', pos: { left: 12, top: 24, '--r': '-4deg' }, cls: 'bg-hl' },
  { id: 's2', title: 'Schema', text: 'Users, Workspaces, Documents.', pos: { left: 190, top: 70, '--r': '3deg' }, cls: 'bg-white' },
  { id: 's3', title: 'This week', text: 'Auth done. Editor started. Sockets next.', pos: { left: 50, top: 172, '--r': '-2deg' }, cls: 'bg-accent text-white' },
];

export default function Stickies({ glow }) {
  const stage = useRef(null);
  const drag = useRef(null);
  const z = useRef(5);

  const down = (e) => {
    const el = e.currentTarget;
    drag.current = { el, dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
    el.style.zIndex = ++z.current;
    el.setPointerCapture(e.pointerId);
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const box = stage.current;
    const x = Math.max(0, Math.min(box.clientWidth - d.el.offsetWidth, e.clientX - d.dx));
    const y = Math.max(0, Math.min(box.clientHeight - d.el.offsetHeight, e.clientY - d.dy));
    d.el.style.left = x + 'px';
    d.el.style.top = y + 'px';
  };

  const up = () => {
    drag.current = null;
  };

  return (
    <div className="stage" ref={stage}>
      {NOTES.map((n) => (
        <div
          key={n.id}
          className={`stk ${n.cls} ${glow === n.id ? 'glow' : ''}`}
          style={n.pos}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <b>{n.title}</b>
          {n.text}
        </div>
      ))}
      <span className="absolute right-3 bottom-2 opacity-70 text-xl" style={{ fontFamily: 'Caveat, cursive' }}>
        psst… drag the notes around
      </span>
    </div>
  );
}