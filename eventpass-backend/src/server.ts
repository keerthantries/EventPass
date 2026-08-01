import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`EventPass API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
