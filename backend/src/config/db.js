const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_queue';
    
    // Attempt standard MongoDB connection with short timeout to detect if server is running
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to standard MongoDB instance (${err.message}).`);
    console.log(`[MongoDB] Falling back to MongoDB Memory Server...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB Memory Server] Connected successfully at ${uri}`);
    } catch (memErr) {
      console.error(`[MongoDB] Failed to start MongoDB Memory Server:`, memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
