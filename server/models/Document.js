const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Untitled document', trim: true },
    content: { type: String, default: '' },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);