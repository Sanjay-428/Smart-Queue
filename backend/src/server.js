const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedHospitals = require('./config/seedHospitals');
const seedDoctors = require('./config/seedDoctors');
const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const queueRoutes = require('./routes/queueRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and seed data
connectDB().then(async () => {
  await seedHospitals();
  await seedDoctors();
});

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/locations', locationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Queue API Backend is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Smart Queue API Server running on port ${PORT}`);
  console.log(`=================================`);
});
