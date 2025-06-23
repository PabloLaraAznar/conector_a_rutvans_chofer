// server.js
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json()); // Para leer JSON en POST/PUT

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

    // POST - Login de usuario
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ success: false, message: 'Faltan campos' });
        }

        const coleccion = db.collection('users');

        const usuario = await coleccion.findOne({
          correo: email,
          password: password,
        });

        if (!usuario) {
          return res.status(401).json({
            success: false,
            message: 'Correo o contraseña incorrectos',
          });
        }

        res.json({
          success: true,
          message: 'Inicio de sesión exitoso',
          usuario: {
            id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
          },
        });
      } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
      }
    });

    // Arranca servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (e) {
    console.error('❌ Error conectando a MongoDB:', e);
    process.exit(1);
  }
}

main();
