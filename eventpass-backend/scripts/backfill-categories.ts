import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { Event } from '../src/models/Event';
import { Category } from '../src/models/Category';
import { logger } from '../src/utils/logger';

function weddingKeywords(eventType?: string) {
  const t = (eventType ?? '').toLowerCase();
  return /wed|marri|bride|groom|shaadi|ceremony|nuptial|weeding|wedding/.test(t);
}

const WEDDING = [
  { name: "Bride's Guests", colorTag: '#EC4899' },
  { name: "Groom's Guests", colorTag: '#8B5CF6' },
  { name: 'Family', colorTag: '#F59E0B' },
  { name: 'Friends', colorTag: '#10B981' },
  { name: 'VIP', colorTag: '#3B82F6' },
];
const GENERIC = [
  { name: 'VIP', colorTag: '#3B82F6' },
  { name: 'Staff', colorTag: '#8B5CF6' },
  { name: 'Guests', colorTag: '#10B981' },
];

async function main() {
  await mongoose.connect(env.mongoUri);

  const events = await Event.find();
  let weddingSeeded = 0;
  let genericSeeded = 0;

  for (const event of events) {
    const existing = await Category.findOne({ eventId: event._id });
    if (existing) continue; // already has categories

    const defaults = weddingKeywords(event.type) ? WEDDING : GENERIC;
    await Category.insertMany(defaults.map((c) => ({ eventId: event._id, name: c.name, colorTag: c.colorTag })));
    logger.info(`Seeded categories for "${event.name}" (${event.type})`);
    if (event.type && /wed|marri|bride|groom|shaadi|ceremony|nuptial/i.test(event.type ?? '')) {
      weddingSeeded += 1;
    } else {
      genericSeeded += 1;
    }
  }

  logger.info(`Done. ${weddingSeeded} wedding events, ${genericSeeded} generic events seeded.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  logger.error({ err }, 'Backfill failed');
  process.exit(1);
});