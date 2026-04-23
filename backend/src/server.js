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
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use('/api', notificationsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SportSync Backend API' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`);
});
