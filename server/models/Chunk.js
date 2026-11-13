const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    doc: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, default: '' },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chunk', chunkSchema);