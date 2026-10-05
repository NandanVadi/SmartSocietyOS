const mongoose = require('mongoose');

// Vercel Serverless Mongoose Connection Caching
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Fail fast if network is blocked
    }).then((mongoose) => mongoose);
  }
  
  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;