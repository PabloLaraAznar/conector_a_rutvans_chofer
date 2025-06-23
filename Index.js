import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

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

    // GET - Obtener documentos
    app.get('/datos', async (req, res) => {
      try {
        const nombreColeccion = req.query.coleccion;
        if (!nombreColeccion) {
          return res.status(400).json({ error: 'Falta el parámetro "coleccion"' });
        }

        let filtro = req.query.filtro ? JSON.parse(req.query.filtro) : {};

        // Convertir id string a ObjectId si existe
        if (filtro._id && typeof filtro._id === 'string') {
          filtro._id = new ObjectId(filtro._id);
        }

        const coleccion = db.collection(nombreColeccion);
        const datos = await coleccion.find(filtro).toArray();

        res.json(datos);
      } catch (error) {
        console.error('❌ Error al obtener datos:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
      }
    });

    // POST - Insertar nuevo documento (sin cambios)
    app.post('/datos', async (req, res) => {
      try {
        const nombreColeccion = req.query.coleccion;
        if (!nombreColeccion) {
          return res.status(400).json({ error: 'Falta el parámetro "coleccion"' });
        }

        const coleccion = db.collection(nombreColeccion);
        const resultado = await coleccion.insertOne(req.body);

        res.status(201).json({ mensaje: 'Documento insertado', id: resultado.insertedId });
      } catch (error) {
        console.error('❌ Error al insertar:', error);
        res.status(500).json({ error: 'Error al insertar documento' });
      }
    });

    // PUT - Actualizar documento por ID
    app.put('/datos', async (req, res) => {
      try {
        const nombreColeccion = req.query.coleccion;
        const id = req.query.id;

        if (!nombreColeccion || !id) {
          return res.status(400).json({ error: 'Faltan parámetros "coleccion" o "id"' });
        }

        const coleccion = db.collection(nombreColeccion);
        const objectId = new ObjectId(id); // Convertir id string a ObjectId

        const resultado = await coleccion.updateOne(
          { _id: objectId },
          { $set: req.body }
        );

        res.json({ mensaje: 'Documento actualizado', modificado: resultado.modifiedCount });
      } catch (error) {
        console.error('❌ Error al actualizar:', error);
        res.status(500).json({ error: 'Error al actualizar documento' });
      }
    });

    // DELETE - Eliminar documento por ID
    app.delete('/datos', async (req, res) => {
      try {
        const nombreColeccion = req.query.coleccion;
        const id = req.query.id;

        if (!nombreColeccion || !id) {
          return res.status(400).json({ error: 'Faltan parámetros "coleccion" o "id"' });
        }

        const coleccion = db.collection(nombreColeccion);
        const objectId = new ObjectId(id); // Convertir id string a ObjectId

        const resultado = await coleccion.deleteOne({ _id: objectId });

        res.json({ mensaje: 'Documento eliminado', eliminado: resultado.deletedCount });
      } catch (error) {
        console.error('❌ Error al eliminar:', error);
        res.status(500).json({ error: 'Error al eliminar documento' });
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (e) {
    console.error('❌ Error conectando a MongoDB:', e);
    process.exit(1);
  }
}

main();
