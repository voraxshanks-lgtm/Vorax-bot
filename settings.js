const Settings = require('./models/Settings');

async function getSettings(key) {
  return Settings.findOneAndUpdate(
    { key },
    { $setOnInsert: { key } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function updateSettings(key, patch) {
  const allowed = ['prefix', 'mode', 'welcome', 'goodbye', 'antiLink', 'autoLike', 'autoView', 'likeEmoji'];
  const safe = {};
  for (const k of allowed) if (Object.hasOwn(patch, k)) safe[k] = patch[k];
  return Settings.findOneAndUpdate({ key }, { $set: safe }, { new: true, upsert: true });
}

module.exports = { getSettings, updateSettings };
