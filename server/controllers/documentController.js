const Doc = require('../models/Document');
const { getAccess } = require('../utils/access');

const canEdit = (role) => role === 'owner' || role === 'editor';

exports.create = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.workspaceId, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
  if (!canEdit(role)) return res.status(403).json({ message: 'You cannot create documents here' });

  const doc = await Doc.create({
    title: (req.body?.title || '').trim() || 'Untitled document',
    workspace: workspace._id,
    createdBy: req.user._id,
    lastEditedBy: req.user._id,
  });
  res.status(201).json(doc);
};

exports.listByWorkspace = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.workspaceId, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
  if (!role) return res.status(403).json({ message: 'You are not a member' });

  const docs = await Doc.find({ workspace: workspace._id })
    .select('-content')
    .populate('lastEditedBy', 'name')
    .sort('-updatedAt');
  res.json(docs);
};

exports.get = async (req, res) => {
  const doc = await Doc.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const { role } = await getAccess(doc.workspace, req.user._id);
  if (!role) return res.status(403).json({ message: 'You are not a member' });
  res.json({ doc, role });
};

exports.update = async (req, res) => {
  const doc = await Doc.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const { role } = await getAccess(doc.workspace, req.user._id);
  if (!canEdit(role)) return res.status(403).json({ message: 'You cannot edit this document' });

  const { title, content } = req.body || {};
  if (title !== undefined) doc.title = String(title).trim() || 'Untitled document';
  if (content !== undefined) doc.content = String(content);
  doc.lastEditedBy = req.user._id;
  await doc.save();
  res.json(doc);
};

exports.remove = async (req, res) => {
  const doc = await Doc.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const { role } = await getAccess(doc.workspace, req.user._id);
  if (role !== 'owner' && String(doc.createdBy) !== String(req.user._id))
    return res.status(403).json({ message: 'Only the owner or creator can delete' });

  await doc.deleteOne();
  res.json({ message: 'Document deleted' });
};