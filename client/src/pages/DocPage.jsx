import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import api from '../services/api';
import { connectSocket } from '../services/socket';

const countWords = (text) => (text.trim().match(/\S+/g) || []).length;

function Editor({ doc, canEdit }) {
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState('Saved');
  const [live, setLive] = useState(false);
  const [online, setOnline] = useState([]);
  const [words, setWords] = useState(countWords(doc.content.replace(/<[^>]+>/g, ' ')));
  const [focus, setFocus] = useState(false);
  const [msgs, setMsgs] = useState([{ text: 'Ask me anything about this notebook.' }]);
  const [aiQ, setAiQ] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const timer = useRef(null);
  const dirty = useRef(false);
  const remote = useRef(false);
  const socketRef = useRef(null);
  const chatEnd = useRef(null);
  const latest = useRef({ title: doc.title, content: doc.content });

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

  const sendChange = () => {
    socketRef.current?.emit('doc:change', {
      docId: doc._id,
      title: latest.current.title,
      html: latest.current.content,
    });
  };

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
      if (remote.current) return;
      latest.current.content = editor.getHTML();
      setWords(countWords(editor.getText()));
      save();
      sendChange();
    },
  });

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
        const { from, to } = editor.state.selection;
        remote.current = true;
        editor.commands.setContent(html);
        remote.current = false;
        const max = editor.state.doc.content.size;
        editor.commands.setTextSelection({ from: Math.min(from, max), to: Math.min(to, max) });
        latest.current.content = html;
        setWords(countWords(editor.getText()));
      }
    });

    return () => {
      socket.emit('doc:leave', doc._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [editor, doc._id]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs]);

  const onTitle = (e) => {
    setTitle(e.target.value);
    latest.current.title = e.target.value;
    save();
    sendChange();
  };

  const askAI = async (e) => {
    e.preventDefault();
    const q = aiQ.trim();
    if (!q || aiBusy) return;
    setAiQ('');
    setMsgs((m) => [...m, { me: true, text: q }]);
    setAiBusy(true);
    try {
      const { data } = await api.post('/ai/ask', { question: q, workspaceId: doc.workspace });
      setMsgs((m) => [...m, { text: data.answer, src: [...new Set(data.sources.map((s) => s.title))] }]);
    } catch (err) {
      setMsgs((m) => [...m, { text: err.response?.data?.message || 'The AI request failed.' }]);
    } finally {
      setAiBusy(false);
    }
  };

  if (!editor) return null;

  const tools = [
    ['B', () => editor.chain().focus().toggleBold().run()],
    ['I', () => editor.chain().focus().toggleItalic().run()],
    ['Highlight', () => editor.chain().focus().toggleHighlight().run()],
    ['H', () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ['• List', () => editor.chain().focus().toggleBulletList().run()],
  ];

  return (
    <div>
      <div className={`flex flex-wrap justify-between items-center gap-3 mb-5 transition-opacity ${focus ? 'opacity-30' : ''}`}>
        <Link to={`/workspace/${doc.workspace}`} className="font-bold underline">← Notebook</Link>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-accent' : 'bg-gray-400'}`} />
            {live ? 'Live' : 'Offline'}
          </span>
          <span className="flex -space-x-2">
            {online.map((u) => (
              <span
                key={u.id}
                title={u.name}
                className="w-8 h-8 rounded-full border-2 border-ink bg-hl text-xs font-bold flex items-center justify-center"
              >
                {u.name[0].toUpperCase()}
              </span>
            ))}
          </span>
          <span className="font-bold text-sm">{canEdit ? status : 'Read only'}</span>
          <button className="btn btn-pl" onClick={() => setFocus(!focus)}>
            {focus ? 'Exit focus' : 'Focus mode'}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 items-start ${focus ? 'max-w-3xl mx-auto' : 'lg:grid-cols-[1fr_21rem]'}`}>
        <div className="box p-6 md:p-8">
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {tools.map(([label, run]) => (
                <button key={label} type="button" className="tbtn" onClick={run}>{label}</button>
              ))}
              <span className="ml-auto text-sm opacity-60">{words} words</span>
            </div>
          )}
          <input
            className="w-full font-display text-4xl md:text-5xl font-extrabold mb-4 outline-none bg-transparent"
            value={title}
            onChange={onTitle}
            readOnly={!canEdit}
          />
          <EditorContent editor={editor} />
        </div>

        {!focus && (
          <aside className="box">
            <h3 className="text-2xl mb-3">Ask this notebook</h3>
            <div className="max-h-80 overflow-auto pr-1">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 mb-2 text-sm border-2 border-ink rounded-xl fade-up ${
                    m.me ? 'bg-accent text-white' : 'bg-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.src?.length > 0 && <p className="text-xs opacity-70 mt-1">Source: {m.src.join(', ')}</p>}
                </div>
              ))}
              {aiBusy && (
                <div className="px-3 py-2 mb-2 border-2 border-ink rounded-xl bg-white">
                  <span className="dots"><i /><i /><i /></span>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <form onSubmit={askAI} className="mt-3">
              <input className="input" placeholder="Try: which auth method?" value={aiQ} onChange={(e) => setAiQ(e.target.value)} maxLength={500} />
            </form>
          </aside>
        )}
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

  if (error) return <p className="font-bold text-red-600">{error}</p>;
  if (!data) return <p className="font-bold">Loading…</p>;
  return <Editor key={data.doc._id} doc={data.doc} canEdit={data.role !== 'viewer'} />;
}