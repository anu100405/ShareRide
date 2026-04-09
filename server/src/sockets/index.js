const { Server } = require('socket.io');
const { verifyToken } = require('../services/token.service');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const { ROLES, SOCKET_EVENTS } = require('../config/constants');
const { setIO, registerSocket, unregisterSocket } = require('./socket.store');
const registerDriverHandlers = require('./driver.socket');
const registerPassengerHandlers = require('./passenger.socket');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  setIO(io);

  // Socket auth middleware — verifies JWT on handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = verifyToken(cleanToken);

      let user;
      if (decoded.role === ROLES.DRIVER) {
        user = await Driver.findById(decoded.id);
      } else {
        user = await User.findById(decoded.id);
      }

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const role = socket.userRole;

    console.log(`🔌 ${role} connected: ${user.name} [${socket.id}]`);

    // Map userId -> socketId
    registerSocket(user._id.toString(), socket.id);

    // Register event handlers based on role
    if (role === ROLES.DRIVER) {
      registerDriverHandlers(io, socket, user);
    } else {
      registerPassengerHandlers(io, socket, user);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 ${role} disconnected: ${user.name}`);
      unregisterSocket(user._id.toString());
    });
  });

  return io;
};

module.exports = initSocket;