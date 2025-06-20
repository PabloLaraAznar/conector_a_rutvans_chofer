import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;

// Obtén la URI desde la variable de entorno
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ No se encontró la variable de entorno MONGO_URI');
  process.exit(1);
}

const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db('rutvans_chofer');

    app.use(cors());

    app.get('/datos', async (req, res) => {
      try {
        const nombreColeccion = req.query.coleccion;
        if (!nombreColeccion) {
          return res.status(400).json({ error: 'Falta el parámetro "coleccion"' });
        }

        const coleccion = db.collection(nombreColeccion);
        const datos = await coleccion.find({}).toArray();

        res.json(datos);
      } catch (error) {
        console.error('❌ Error al obtener datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('❌ Error conectando a MongoDB:', e);
    process.exit(1);
  }
}

main();
