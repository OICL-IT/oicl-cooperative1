import 'dotenv/config';
import app from './app.js';
import { connectDB } from './database/db.js';

const PORT = Number(process.env.PORT) || 3000;

async function startApiServer() {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OICL API server running at http://localhost:${PORT}`);
  });
}

startApiServer().catch((error) => {
  console.error('API server startup failed:', error);
  process.exit(1);
});
