const mongoose = require('mongoose');
const { createApp } = require('./app');
const UseCase = require('./models/UseCase');
const { migriereLegacy } = require('./services/usecases');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ki_usecases';

async function start() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB verbunden', mongoUri);
    await UseCase.syncIndexes();
    const migriert = await migriereLegacy();
    if (migriert) console.log(`Migration: ${migriert} Use Case(s) ins neue Datenmodell überführt.`);
  } catch (err) {
    console.error('MongoDB Verbindung fehlgeschlagen:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const tryListen = (port) => {
    const server = app.listen(port, () => console.log(`App: http://localhost:${port}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} belegt, versuche ${port + 1}...`);
        tryListen(port + 1);
        return;
      }
      console.error('Server-Fehler:', err);
      process.exit(1);
    });
  };
  tryListen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

start();
