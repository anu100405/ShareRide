require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const initSocket = require('./sockets');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect to MongoDB then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚗 Cab Service running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
  });
});