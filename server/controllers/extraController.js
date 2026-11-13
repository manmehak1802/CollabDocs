const Workspace = require('../models/Workspace');
const Doc = require('../models/Document');
const Chunk = require('../models/Chunk');
const User = require('../models/User');
const { getAccess } = require('../utils/access');

// GET /api/documents/recent: latest documents across all your notebooks
exports.recentDocs = async (req, res) => {
  const workspaces = await Workspace.find({ 'members.user': req.user._id }).select('name');
  const ids = workspaces.map((w) => w._id);
  const names = new Map(workspaces.map((w) => [String(w._id), w.name]));

  const [docs, total] = await Promise.all([
    Doc.find({ workspace: { $in: ids } })
      .select('-content')
      .populate('lastEditedBy', 'name')
      .sort('-updatedAt')
      .limit(5)
      .lean(),
    Doc.countDocuments({ workspace: { $in: ids } }),
  ]);

  res.json({
    total,
    recent: docs.map((d) => ({ ...d, workspaceName: names.get(String(d.workspace)) })),
  });
};

// PUT /api/auth/me: change your name
exports.updateProfile = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name is required' });
  if (name.length > 60) return res.status(400).json({ message: 'Name is too long (60 characters max)' });
  const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true }).select('-password');
  res.json({ user });
};

// PUT /api/workspaces/:id/members/:userId: change a member's role (owner only)
exports.changeRole = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.id, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Notebook not found' });
  if (role !== 'owner') return res.status(403).json({ message: 'Only the owner can change roles' });

  const newRole = req.body?.role;
  if (!['editor', 'viewer'].includes(newRole))
    return res.status(400).json({ message: 'Role must be editor or viewer' });
  if (req.params.userId === String(workspace.owner))
    return res.status(400).json({ message: 'The owner role cannot be changed' });

  const member = workspace.members.find((m) => String(m.user) === req.params.userId);
  if (!member) return res.status(404).json({ message: 'Member not found' });

  member.role = newRole;
  await workspace.save();
  res.json({ message: 'Role updated' });
};

// PUT /api/workspaces/:id/settings: switch AI on or off for a notebook (owner only)
exports.updateSettings = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.id, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Notebook not found' });
  if (role !== 'owner') return res.status(403).json({ message: 'Only the owner can change this' });
  if (typeof req.body?.aiEnabled !== 'boolean')
    return res.status(400).json({ message: 'aiEnabled must be true or false' });

  workspace.aiEnabled = req.body.aiEnabled;
  await workspace.save();
  if (!workspace.aiEnabled) await Chunk.deleteMany({ workspace: workspace._id });
  res.json({ aiEnabled: workspace.aiEnabled });
};