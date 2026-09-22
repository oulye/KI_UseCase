const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");
const UseCase=require("./models/UseCase");
const app=express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ki_usecases";

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("MongoDB verbunden", mongoUri);
    await UseCase.updateMany(
      { kategorie: { $exists: true } },
      { $unset: { kategorie: "" } }
    );
    console.log("MongoDB-Migration: Feld 'kategorie' entfernt.");
  })
  .catch(err=>console.error("MongoDB Verbindung fehlgeschlagen:", err));

app.get('/api/usecases', async (req, res) => {
  const useCases = await UseCase.find();
  res.json(useCases);
});

app.get('/api/usecases/:id', async (req, res) => {
  const useCase = await UseCase.findById(req.params.id);
  if (!useCase) {
    return res.status(404).json({ error: 'UseCase nicht gefunden' });
  }
  res.json(useCase);
});

app.post('/api/usecases', async (req, res) => {
  const useCase = new UseCase(req.body);
  await useCase.save();
  res.json(useCase);
});

app.put('/api/usecases/:id', async (req, res) => {
  const updated = await UseCase.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    return res.status(404).json({ error: 'UseCase nicht gefunden' });
  }
  res.json(updated);
});

app.delete('/api/usecases/:id', async (req, res) => {
  await UseCase.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

const tryListen = (port) => {
  const server = app.listen(port, () => {
    console.log(`App: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} belegt, versuche ${nextPort}...`);
      tryListen(nextPort);
      return;
    }

    console.error('Server-Fehler:', err);
    process.exit(1);
  });
};

tryListen(process.env.PORT ? Number(process.env.PORT) : 3000);
