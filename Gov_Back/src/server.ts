import { createServer } from 'http';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { startVoiceWebSocketServer } from "./voice/voice.ws";
import { logger } from './utils/logger.js';
import { startRemindersWorker } from './workers/remindersWorker.js';

startRemindersWorker();

const app = createApp();
const server = createServer(app);

startVoiceWebSocketServer(5000);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server listening');
});
