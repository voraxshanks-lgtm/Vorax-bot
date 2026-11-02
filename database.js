const mongoose = require('mongoose');

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000
  });

  console.log('✅ VORAX BOT connecté à MongoDB');
}

module.exports = { connectDatabase };
