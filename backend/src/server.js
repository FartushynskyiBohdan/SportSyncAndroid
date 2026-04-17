require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const discoverRoutes = require('./routes/discover');
const matchesRoutes = require('./routes/matches');
const messagesRoutes = require('./routes/messages');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/users');

const app = express();
const HOST = '127.0.0.1';
const BASE_PORT = Number(process.env.PORT) || 3000;

// Middleware  
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', onboardingRoutes);
app.use('/api', discoverRoutes);
app.use('/api', matchesRoutes);
app.use('/api', messagesRoutes);
app.use('/api', settingsRoutes);
app.use('/api', usersRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SportSync Backend API' });
});

const startServer = (port, retriesLeft = 10) => {
  const server = app.listen(port, HOST, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (error) => {
    const canRetry = !process.env.PORT && error.code === 'EADDRINUSE' && retriesLeft > 0;

    if (canRetry) {
      console.warn(`Port ${port} is in use, retrying on port ${port + 1}...`);
      startServer(port + 1, retriesLeft - 1);
      return;
    }

    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
};

startServer(BASE_PORT);
