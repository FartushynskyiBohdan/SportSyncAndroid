require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SportSync Backend API' });
});

// Profile routes
app.get('/api/profiles', (req, res) => {
  // TODO: Implement get profiles logic
  res.json({ message: 'Profiles endpoint' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});