import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import { config } from './config';
import { createServer } from './server';
import { initializeWebSockets } from './websocket';

(async () => {
  console.log('Running migrations');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrated successfully');

  const server = createServer();

  initializeWebSockets(server);

  server.listen(config.port, () => {
    console.log(`🚀 Server started on ${config.serverUrl}`);
    console.log(
      `🔌 WebSocket server initialized and listening on the same port.`,
    );
  });
})();
