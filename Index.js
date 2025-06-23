import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json()); // Para leer JSON en POST/PUT

// 🔴 Pega aquí tu URI real de MongoDB Atlas o local
const uri = 'mongodb+srv://pablolara:PeUlKWpeOYXeJTmT@prueba1.puvcqaj.mongodb.net/';

if (!uri) {
  console.error('❌ No se proporcionó URI de MongoDB');
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

        const filtro = req.query.filtro ? JSON.parse(req.query.filtro) : {};
        const coleccion = db.collection(nombreColeccion);
        const datos = await coleccion.find(filtro).toArray();

        res.json(datos);
      } catch (error) {
        console.error('❌ Error al obtener datos:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
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
        const resultado = await coleccion.updateOne(
          { _id: id },
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
        const resultado = await coleccion.deleteOne({ _id: id });

        res.json({ mensaje: 'Documento eliminado', eliminado: resultado.deletedCount });
      } catch (error) {
        console.error('❌ Error al eliminar:', error);
        res.status(500).json({ error: 'Error al eliminar documento' });
      }
    });

        // POST - Login por email y contraseña
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'email y contraseña requeridos' });
        }

        console.log('➡️ Cuerpo recibido en /login:', req.body);

        const coleccion = db.collection('users');
        const usuario = await coleccion.findOne({ email, password });

        if (!usuario) {
          return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        delete usuario.password; // Evita devolver el password

        res.json({ mensaje: 'Login exitoso', usuario });
      } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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
