import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

await connectDB();

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  server.close(() => process.exit(1));
});
