import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = 3000;

app.use(cors());

// URI de MongoDB Atlas
const uri = 'mongodb+srv://pablolara:PeUlKWpeOYXeJTmT@prueba1.puvcqaj.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
  // Ya no necesitas `useNewUrlParser` ni `useUnifiedTopology`
});

await client.connect(); // Conexión una vez, al inicio
console.log('✅ Conectado a MongoDB');

const db = client.db('rutvans_chofer'); // Nombre de tu base de datos

// Ruta dinámica que recibe ?coleccion=nombre
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





