const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { getAccess } = require('../utils/access');

exports.create = async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Workspace name is required' });
  const ws = await Workspace.create({
    name,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }],
  });
  res.status(201).json(ws);
};

exports.list = async (req, res) => {
  const list = await Workspace.find({ 'members.user': req.user._id }).sort('-updatedAt');
  res.json(list);
};

exports.get = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.id, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
  if (!role) return res.status(403).json({ message: 'You are not a member' });
  await workspace.populate('members.user', 'name email');
  res.json({ workspace, role });
};

exports.addMember = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.id, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
  if (role !== 'owner') return res.status(403).json({ message: 'Only the owner can invite' });

  const email = (req.body?.email || '').toLowerCase().trim();
  const newRole = req.body?.role === 'viewer' ? 'viewer' : 'editor';
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No user with that email. They must sign up first.' });
  if (workspace.members.some((m) => m.user.equals(user._id)))
    return res.status(400).json({ message: 'Already a member' });

  workspace.members.push({ user: user._id, role: newRole });
  await workspace.save();
  res.status(201).json({ message: 'Member added' });
};

exports.removeMember = async (req, res) => {
  const { workspace, role } = await getAccess(req.params.id, req.user._id);
  if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
  if (role !== 'owner') return res.status(403).json({ message: 'Only the owner can remove members' });
  if (req.params.userId === String(workspace.owner))
    return res.status(400).json({ message: 'The owner cannot be removed' });

  workspace.members = workspace.members.filter((m) => String(m.user) !== req.params.userId);
  await workspace.save();
  res.json({ message: 'Member removed' });
};