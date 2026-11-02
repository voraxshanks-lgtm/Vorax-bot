const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  prefix: { type: String, default: process.env.PREFIX || '.' },
  mode: { type: String, enum: ['public', 'private'], default: 'public' },
  welcome: { type: Boolean, default: false },
  goodbye: { type: Boolean, default: false },
  antiLink: { type: Boolean, default: false },
  autoLike: { type: Boolean, default: false },
  autoView: { type: Boolean, default: false },
  likeEmoji: { type: String, default: '❤️' }
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
