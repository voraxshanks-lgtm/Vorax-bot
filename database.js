const mongoose = require('mongoose');

async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('MongoDB connected');
}

module.exports = { connectDatabase };
