import mongoose from 'mongoose';
import { env } from '../src/config/env';

/**
 * One-off: the guests collection has a STALE unique index on {eventId, email}
 * (the schema declares it non-unique since long ago, but Mongo only creates —
 * never drops — indexes, so the old unique index survived). It rejects guests
 * who share a family email. Drops it and lets autoIndex recreate the
 * non-unique version on next boot.
 */
async function main() {
  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db!;

  const prodEvent = await db
    .collection('events')
    .findOne({ _id: new mongoose.Types.ObjectId('6ac339fcfcc79f79a363bc27') });
  console.log('user prod event present in this DB:', !!prodEvent);

  const coll = db.collection('guests');
  const before = await coll.indexes();
  console.log(
    'indexes before:',
    before.map((i) => `${i.name}${i.unique ? ' UNIQUE' : ''}`).join(' | ')
  );

  const stale = before.find((i) => i.name === 'eventId_1_email_1' && i.unique === true);
  if (stale) {
    await coll.dropIndex('eventId_1_email_1');
    console.log('DROPPED unique index eventId_1_email_1');
  } else {
    console.log('no unique email index — nothing to drop');
  }

  await coll.createIndex({ eventId: 1, email: 1 }, { name: 'eventId_1_email_1' });
  console.log('ensured non-unique eventId_1_email_1');

  const after = await coll.indexes();
  console.log(
    'indexes after:',
    after.map((i) => `${i.name}${i.unique ? ' UNIQUE' : ''}`).join(' | ')
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
