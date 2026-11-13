import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PAGES = [
  { label: 'Go to Dashboard', to: '/dashboard' },
  { label: 'Go to Ask', to: '/ask' },
  { label: 'Go to Settings', to: '/settings' },
];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [books, setBooks] = useState([]);
  const input = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    api.get('/workspaces').then((r) => setBooks(r.data)).catch(() => {});
    setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  const items = useMemo(() => {
    const text = q.trim();
    const low = text.toLowerCase();
    const list = [];
    if (text)
      list.push({ label: `Ask: “${text}”`, hint: 'AI', run: () => navigate('/ask', { state: { q: text } }) });
    PAGES.forEach((p) => {
      if (!low || p.label.toLowerCase().includes(low)) list.push({ label: p.label, run: () => navigate(p.to) });
    });
    books.forEach((b) => {
      if (!low || b.name.toLowerCase().includes(low))
        list.push({ label: `Open notebook: ${b.name}`, run: () => navigate(`/workspace/${b._id}`) });
    });
    return list;
  }, [q, books, navigate]);

  if (!open) return null;

  const pick = (item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') pick(items[active]);
  };

  return (
    <div className="cmd-back" onClick={onClose}>
      <div className="cmd-box" onClick={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className="input mb-2"
          placeholder="Search pages or ask a question…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
        />
        {items.map((it, i) => (
          <div
            key={it.label + i}
            className={`cmd-item ${i === active ? 'on' : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => pick(it)}
          >
            <span>{it.label}</span>
            {it.hint && <small>{it.hint}</small>}
          </div>
        ))}
        {items.length === 0 && <p className="opacity-70 p-2">No matches.</p>}
      </div>
    </div>
  );
}