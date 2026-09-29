import 'dotenv/config';
import app, { setupVite } from './app.js';
import { connectDB } from './database/db.js';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  // A configured live database must be available before accepting requests.
  await connectDB();

  // Setup Vite Middleware
  await setupVite(app);

  // Start Listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OICL Enterprise Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
