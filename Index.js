import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();

// Usa el puerto de Render o 3000 localmente
const PORT = process.env.PORT || 3000;

app.use(cors());

// URI de MongoDB Atlas, mejor usar variable de entorno en producción
const uri = process.env.MONGO_URI || 'mongodb+srv://pablolara:PeUlKWpeOYXeJTmT@prueba1.puvcqaj.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

await client.connect();
console.log('✅ Conectado a MongoDB');

const db = client.db('rutvans_chofer');

app.get('/datos', async (req, res) => {
  try {
    const nombreColeccion = req.query.coleccion;
    if (!nombreColeccion) {
      return res.status(400).json({ error: 'Falta el parámetro "coleccion"' });
    }

    // Si envías filtro, úsalo; si no, vacío
    const filtro = req.query.filtro ? JSON.parse(req.query.filtro) : {};

    const coleccion = db.collection(nombreColeccion);
    const datos = await coleccion.find(filtro).toArray();

    res.json(datos);
  } catch (error) {
    console.error('❌ Error al obtener datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
