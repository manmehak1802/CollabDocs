const Workspace = require('../models/Workspace');

// Returns { workspace, role }. role is null if the user is not a member.
exports.getAccess = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return {};
  const member = workspace.members.find((m) => m.user.equals(userId));
  return { workspace, role: member ? member.role : null };
};