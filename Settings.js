const Settings = require('./Settings');

async function getSettings(key) {
  return Settings.findOneAndUpdate(
    { key },
    { $setOnInsert: { key } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function updateSettings(key, patch) {
  const allowed = [
    'prefix', 'mode', 'welcome', 'goodbye',
    'antiLink', 'autoLike', 'autoView', 'likeEmoji'
  ];

  const safePatch = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      safePatch[field] = patch[field];
    }
  }

  return Settings.findOneAndUpdate(
    { key },
    { $set: safePatch },
    { new: true, upsert: true }
  );
}

module.exports = { getSettings, updateSettings };
