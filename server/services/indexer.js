const Doc = require('../models/Document');
const Chunk = require('../models/Chunk');
const { htmlToText, chunkText } = require('../utils/chunker');
const { embed } = require('./gemini');

async function indexDocument(docId) {
  const doc = await Doc.findById(docId);
  if (!doc) {
    await Chunk.deleteMany({ doc: docId });
    return 0;
  }
  const chunks = chunkText(htmlToText(doc.content));
  if (!chunks.length) {
    await Chunk.deleteMany({ doc: doc._id });
    return 0;
  }
  // Embed first, so a failure never wipes the old index
  const vectors = await embed(chunks.map((c) => `${doc.title}\n${c}`), 'RETRIEVAL_DOCUMENT');
  await Chunk.deleteMany({ doc: doc._id });
  await Chunk.insertMany(
    chunks.map((text, i) => ({
      doc: doc._id,
      workspace: doc.workspace,
      title: doc.title,
      text,
      embedding: vectors[i],
    }))
  );
  return chunks.length;
}

// Autosave fires often, so wait 20 seconds after the last save
const timers = new Map();
function scheduleIndex(docId, delay = 20000) {
  if (!process.env.GEMINI_API_KEY) return;
  const key = String(docId);
  clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(async () => {
      timers.delete(key);
      try {
        await indexDocument(docId);
      } catch (err) {
        console.log('Indexing failed:', err.message);
      }
    }, delay)
  );
}

module.exports = { indexDocument, scheduleIndex };