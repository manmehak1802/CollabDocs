import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import api from '../services/api';
import { connectSocket } from '../services/socket';

function Editor({ doc, canEdit }) {
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState('Saved');
  const [live, setLive] = useState(false);
  const [online, setOnline] = useState([]);
  const timer = useRef(null);
  const dirty = useRef(false);
  const remote = useRef(false); // true while we apply someone else's change
  const socketRef = useRef(null);
  const latest = useRef({ title: doc.title, content: doc.content });

  // Auto-save to the database (waits 800 ms after you stop typing)
  const save = () => {
    dirty.current = true;
    setStatus('Saving…');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await api.put(`/documents/${doc._id}`, latest.current);
        dirty.current = false;
        setStatus('Saved');
      } catch {
        setStatus('Save failed');
      }
    }, 800);
  };

  // Send our change to everyone else in the room
  const sendChange = () => {
    socketRef.current?.emit('doc:change', {
      docId: doc._id,
      title: latest.current.title,
      html: latest.current.content,
    });
  };

  // Save immediately if you leave the page before the timer fires
  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      if (dirty.current) api.put(`/documents/${doc._id}`, latest.current).catch(() => {});
    };
  }, [doc._id]);

  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: doc.content,
    editable: canEdit,
    onUpdate: ({ editor }) => {
      if (remote.current) return; // ignore changes that came from others
      latest.current.content = editor.getHTML();
      save();
      sendChange();
    },
  });

  // Live connection
  useEffect(() => {
    if (!editor) return;
    const socket = connectSocket();
    socketRef.current = socket;

    const join = () => socket.emit('doc:join', doc._id, (res) => setLive(!!res?.ok));
    socket.on('connect', join);
    socket.on('disconnect', () => setLive(false));
    socket.on('doc:presence', setOnline);

    socket.on('doc:update', ({ html, title: t }) => {
      if (typeof t === 'string' && t !== latest.current.title) {
        latest.current.title = t;
        setTitle(t);
      }
      if (typeof html === 'string' && html !== editor.getHTML()) {
        const { from, to } = editor.state.selection; // remember cursor
        remote.current = true;
        editor.commands.setContent(html);
        remote.current = false;
        const max = editor.state.doc.content.size;
        editor.commands.setTextSelection({ from: Math.min(from, max), to: Math.min(to, max) });
        latest.current.content = html;
      }
    });

    return () => {
      socket.emit('doc:leave', doc._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [editor, doc._id]);

  const onTitle = (e) => {
    setTitle(e.target.value);
    latest.current.title = e.target.value;
    save();
    sendChange();
  };

  if (!editor) return null;

  const tools = [
    ['B', () => editor.chain().focus().toggleBold().run()],
    ['I', () => editor.chain().focus().toggleItalic().run()],
    ['H', () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ['Highlight', () => editor.chain().focus().toggleHighlight().run()],
    ['• List', () => editor.chain().focus().toggleBulletList().run()],
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Link to={`/workspace/${doc.workspace}`} className="font-bold underline">← Notebook</Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-accent' : 'bg-gray-400'}`} />
            {live ? 'Live' : 'Offline'}
          </span>
          <span className="flex -space-x-2">
            {online.map((u) => (
              <span
                key={u.id}
                title={u.name}
                className="w-7 h-7 rounded-full border-2 border-ink bg-hl text-xs font-bold flex items-center justify-center"
              >
                {u.name[0].toUpperCase()}
              </span>
            ))}
          </span>
          <span className="font-bold text-sm">{canEdit ? status : 'Read only'}</span>
        </div>
      </div>

      <div className="box">
        {canEdit && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {tools.map(([label, run]) => (
              <button key={label} type="button" onClick={run} className="px-3 py-1 border-2 border-ink rounded-lg font-bold text-sm bg-white hover:bg-hl">
                {label}
              </button>
            ))}
          </div>
        )}
        <input
          className="w-full text-3xl font-extrabold mb-3 outline-none bg-transparent"
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
          value={title}
          onChange={onTitle}
          readOnly={!canEdit}
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default function DocPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/documents/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load document'));
  }, [id]);

  if (error) return <p className="p-8 font-bold text-red-600">{error}</p>;
  if (!data) return <p className="p-8 font-bold">Loading…</p>;
  return <Editor key={data.doc._id} doc={data.doc} canEdit={data.role !== 'viewer'} />;
}