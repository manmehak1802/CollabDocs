import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const IDEAS = ['Summarize this week', 'What did we decide?', 'What are the open questions?'];

const renderAnswer = (text) =>
  text.split(/(\[\d+\])/g).map((part, i) => (/^\[\d+\]$/.test(part) ? <mark key={i}>{part}</mark> : part));

export default function Ask() {
  const toast = useToast();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [scope, setScope] = useState('all');
  const [q, setQ] = useState('');
  const [last, setLast] = useState('');
  const [busy, setBusy] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.get('/workspaces').then((r) => setWorkspaces(r.data));
  }, []);

  const run = async (question, sc = scope) => {
    const text = question.trim();
    if (!text || busy) return;
    setLast(text);
    setQ('');
    setBusy(true);
    setError('');
    setResult(null);
    setOpen(null);
    try {
      const { data } = await api.post('/ai/ask', {
        question: text,
        workspaceId: sc === 'all' ? undefined : sc,
      });
      setResult({ ...data, question: text });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  };

  const pickScope = (sc) => {
    setScope(sc);
    if (last) run(last, sc);
  };

  // A question sent from the command palette runs automatically
  useEffect(() => {
    const incoming = location.state?.q;
    if (incoming) run(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const reindex = async () => {
    setIndexing(true);
    const ids = scope === 'all' ? workspaces.map((w) => w._id) : [scope];
    let total = 0;
    try {
      for (const id of ids) {
        const { data } = await api.post(`/ai/workspaces/${id}/reindex`);
        total += data.indexed;
      }
      toast(`Indexed ${total} document(s)`);
    } catch (err) {
      toast(err.response?.data?.message || 'Indexing failed');
    } finally {
      setIndexing(false);
    }
  };

  const copy = () => {
    try {
      navigator.clipboard.writeText(result.answer);
    } catch {
      /* ignore */
    }
    toast('Answer copied');
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <p className="eye">Ask</p>
          <h1 className="text-5xl md:text-6xl mt-2">
            Ask your <span className="hl">notes</span>
          </h1>
        </div>
        <button className="btn btn-pl" onClick={reindex} disabled={indexing}>
          {indexing ? 'Indexing…' : 'Update index'}
        </button>
      </div>

      <div className="seg mb-5">
        <button className={scope === 'all' ? 'act' : ''} onClick={() => pickScope('all')}>All notebooks</button>
        {workspaces.map((w) => (
          <button key={w._id} className={scope === w._id ? 'act' : ''} onClick={() => pickScope(w._id)}>
            {w.name}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="flex gap-3 mb-8"
      >
        <input
          className="input"
          placeholder="Ask your notes anything…"
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ac whitespace-nowrap px-8" disabled={busy}>
          {busy ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {error && <p className="mb-5 font-bold text-red-600">{error}</p>}

      {!result && !busy && !error && (
        <div className="box">
          <p className="text-lg mb-3">
            Ask a question and get an answer from your own notes, with the documents it came from.
          </p>
          <div>
            {IDEAS.map((s) => (
              <button key={s} className="chip" onClick={() => run(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {busy && (
        <div className="box">
          <h2 className="text-3xl mb-3">{last}</h2>
          <span className="dots"><i /><i /><i /></span>
        </div>
      )}

      {result && (
        <div className="fade-up">
          <h2 className="text-3xl md:text-4xl mb-4">{result.question}</h2>
          <div className="box p-6 md:p-8 mb-4">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{renderAnswer(result.answer)}</p>
          </div>
          <button className="btn btn-pl mb-8" onClick={copy}>Copy answer</button>

          {result.sources.length > 0 && (
            <>
              <p className="eye mb-3">Found in · tap a sticker</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {result.sources.map((s, i) => (
                  <div
                    key={s.n}
                    className="box sticker"
                    style={{ transform: `rotate(${i % 2 ? 1 : -1}deg)` }}
                    onClick={() => setOpen(open === i ? null : i)}
                  >
                    <h3 className="text-xl">[{s.n}] {s.title}</h3>
                    <p className="text-sm opacity-70">{s.workspaceName} · tap to preview</p>
                    {open === i && (
                      <>
                        <p className="snip">“{s.snippet}”</p>
                        <Link to={`/doc/${s.docId}`} className="inline-block mt-2 font-bold underline text-sm" onClick={(e) => e.stopPropagation()}>
                          Open document →
                        </Link>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div>
            {IDEAS.map((s) => (
              <button key={s} className="chip" onClick={() => run(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}