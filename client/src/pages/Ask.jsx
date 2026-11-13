import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Ask() {
  const [workspaces, setWorkspaces] = useState([]);
  const [scope, setScope] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.get('/workspaces').then((r) => setWorkspaces(r.data));
  }, []);

  const ask = async (e) => {
    e.preventDefault();
    if (!q.trim() || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    setOpen(null);
    try {
      const { data } = await api.post('/ai/ask', {
        question: q,
        workspaceId: scope === 'all' ? undefined : scope,
      });
      setResult({ ...data, question: q });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  };

  const reindex = async () => {
    setIndexing(true);
    setMsg('');
    const ids = scope === 'all' ? workspaces.map((w) => w._id) : [scope];
    let total = 0;
    try {
      for (const id of ids) {
        const { data } = await api.post(`/ai/workspaces/${id}/reindex`);
        total += data.indexed;
      }
      setMsg(`Indexed ${total} document(s).`);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Indexing failed');
    } finally {
      setIndexing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link to="/dashboard" className="font-bold underline">← Dashboard</Link>
      <h1 className="text-4xl my-4">
        Ask your <span className="hl">notes</span>
      </h1>

      <div className="flex flex-wrap gap-3 mb-2 items-center">
        <select className="input max-w-xs" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">All notebooks</option>
          {workspaces.map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
        <button type="button" className="btn" onClick={reindex} disabled={indexing}>
          {indexing ? 'Indexing…' : 'Update index'}
        </button>
      </div>
      <p className="text-xs opacity-70 mb-4">
        Notes are indexed 20 seconds after you stop typing. “Update index” re-reads everything now.
      </p>
      {msg && <p className="mb-3 font-bold text-sm">{msg}</p>}

      <form onSubmit={ask} className="flex gap-3 mb-6">
        <input
          className="input"
          placeholder="Ask anything about your notes…"
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ac whitespace-nowrap" disabled={busy}>
          {busy ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {error && <p className="mb-4 font-bold text-red-600">{error}</p>}

      {result && (
        <div>
          <h2 className="text-2xl mb-3">{result.question}</h2>
          <div className="box mb-5">
            <p className="whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.sources.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase opacity-60 mb-2">Found in · tap to preview</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.sources.map((s, i) => (
                  <div
                    key={s.n}
                    className="box cursor-pointer"
                    onClick={() => setOpen(open === i ? null : i)}
                  >
                    <h3 className="text-lg">[{s.n}] {s.title}</h3>
                    <p className="text-xs opacity-70">{s.workspaceName}</p>
                    {open === i && (
                      <div className="mt-3">
                        <p className="text-sm bg-hl p-2 rounded-lg whitespace-pre-wrap">“{s.snippet}”</p>
                        <Link to={`/doc/${s.docId}`} className="inline-block mt-2 font-bold underline text-sm">
                          Open document →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}