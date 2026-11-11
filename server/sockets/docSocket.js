const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doc = require('../models/Document');
const { getAccess } = require('../utils/access');

module.exports = function setupSockets(io) {
  // Runs once when someone connects: checks their login token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email');
      if (!user) return next(new Error('User not found'));
      socket.data.user = user;
      socket.data.roles = {};
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Tells everyone in a document room who is online
  const sendPresence = async (room) => {
    const sockets = await io.in(room).fetchSockets();
    const seen = new Map();
    sockets.forEach((s) => {
      const id = String(s.data.user._id);
      seen.set(id, { id, name: s.data.user.name });
    });
    io.to(room).emit('doc:presence', [...seen.values()]);
  };

  io.on('connection', (socket) => {
    socket.on('doc:join', async (docId, ack) => {
      try {
        if (typeof docId !== 'string' || !mongoose.isValidObjectId(docId))
          return ack?.({ ok: false, message: 'Bad document id' });
        const doc = await Doc.findById(docId).select('workspace');
        if (!doc) return ack?.({ ok: false, message: 'Document not found' });

        const { role } = await getAccess(doc.workspace, socket.data.user._id);
        if (!role) return ack?.({ ok: false, message: 'Not a member' });

        const room = `doc:${docId}`;
        socket.join(room);
        socket.data.roles[docId] = role;
        ack?.({ ok: true, role });
        sendPresence(room);
      } catch {
        ack?.({ ok: false, message: 'Could not join' });
      }
    });

    // Only owners and editors may send changes
    socket.on('doc:change', (payload = {}) => {
      const { docId, html, title } = payload;
      const role = socket.data.roles[docId];
      if (role !== 'owner' && role !== 'editor') return;
      socket.to(`doc:${docId}`).emit('doc:update', {
        html,
        title,
        by: socket.data.user.name,
      });
    });

    socket.on('doc:leave', (docId) => {
      socket.leave(`doc:${docId}`);
      delete socket.data.roles[docId];
      sendPresence(`doc:${docId}`);
    });

    socket.on('disconnecting', () => {
      socket.rooms.forEach((room) => {
        if (room.startsWith('doc:')) setTimeout(() => sendPresence(room), 150);
      });
    });
  });
};