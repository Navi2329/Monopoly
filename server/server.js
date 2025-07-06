// server/server.js
const http = require('http');
const app = require('./src/app');
const socketManager = require('./src/socket/socketManager');

const server = http.createServer(app);

// Initialize Socket.IO
socketManager.init(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
