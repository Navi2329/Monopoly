// server/src/app.js
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Add your client ports here
    credentials: true
}));
app.use(express.json());

// Routes would be added here in the future
// app.use('/api/auth', authRoutes);

module.exports = app;
