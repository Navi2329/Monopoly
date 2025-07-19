// server/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const app = express();
const socketManager = require('./src/socket/socketManager');

// Enable CORS for all routes and allow frontend origin
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const server = http.createServer(app);

// Initialize Socket.IO
socketManager.init(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
});
