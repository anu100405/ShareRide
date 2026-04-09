// In-memory store mapping userId -> socketId
// In production, use Redis for multi-server setups
const userSocketMap = new Map(); // userId -> socketId
let _io = null;

const setIO = (io) => { _io = io; };
const getIO = () => _io;

const registerSocket = (userId, socketId) => {
  userSocketMap.set(userId, socketId);
};

const unregisterSocket = (userId) => {
  userSocketMap.delete(userId);
};

const getSocketByUserId = (userId) => {
  return userSocketMap.get(userId) || null;
};

module.exports = { setIO, getIO, registerSocket, unregisterSocket, getSocketByUserId };