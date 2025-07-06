// server/src/app.js
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // In a real app, you'd configure this more securely
app.use(express.json());

// Routes would be added here in the future
// app.use('/api/auth', authRoutes);

module.exports = app;
