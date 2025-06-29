import express from 'express';
import cors from 'cors';
// import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json()); // Para leer JSON en POST/PUT

// 🔵 Conexión a MySQL
const pool = mysql.createPool({
  host: 'localhost',       // Cambia esto según tu servidor
  user: 'usuario',         // Tu usuario MySQL
  password: 'contraseña',  // Tu contraseña
  database: 'rutvans_chofer',
});

// 🔴 MongoDB (comentado)
/*
const uri = 'mongodb+srv://pablolara:PeUlKWpeOYXeJTmT@prueba1.puvcqaj.mongodb.net/';

if (!uri) {
  console.error('❌ No se proporcionó URI de MongoDB');
  process.exit(1);
}

const client = new MongoClient(uri);
*/

async function main() {
  try {
    // await client.connect();
    // console.log('✅ Conectado a MongoDB');
    // const db = client.db('rutvans_chofer');

    console.log('✅ Conectado a MySQL');

    // GET - Obtener datos
    app.get('/datos', async (req, res) => {
      try {
        const tabla = req.query.coleccion;
        if (!tabla) {
          return res.status(400).json({ error: 'Falta el parámetro "coleccion"' });
        }

        let filtro = '1'; // sin filtro
        if (req.query.filtro) {
          const obj = JSON.parse(req.query.filtro);
          const condiciones = Object.entries(obj).map(
            ([clave, valor]) => `${clave} = ${mysql.escape(valor)}`
          );
          filtro = condiciones.join(' AND ');
        }

        const [rows] = await pool.query(`SELECT * FROM ${tabla} WHERE ${filtro}`);
        res.json(rows);
      } catch (error) {
        console.error('❌ Error al obtener datos:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
      }
    });

    // PUT - Actualizar
    app.put('/datos', async (req, res) => {
      try {
        const tabla = req.query.coleccion;
        const id = req.query.id;

        if (!tabla || !id) {
          return res.status(400).json({ error: 'Faltan parámetros "coleccion" o "id"' });
        }

        const campos = Object.entries(req.body)
          .map(([key, val]) => `${key} = ${mysql.escape(val)}`)
          .join(', ');

        const [resultado] = await pool.query(
          `UPDATE ${tabla} SET ${campos} WHERE id = ?`,
          [id]
        );

        res.json({ mensaje: 'Documento actualizado', modificado: resultado.affectedRows });
      } catch (error) {
        console.error('❌ Error al actualizar:', error);
        res.status(500).json({ error: 'Error al actualizar documento' });
      }
    });

    // DELETE - Eliminar
    app.delete('/datos', async (req, res) => {
      try {
        const tabla = req.query.coleccion;
        const id = req.query.id;

        if (!tabla || !id) {
          return res.status(400).json({ error: 'Faltan parámetros "coleccion" o "id"' });
        }

        const [resultado] = await pool.query(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
        res.json({ mensaje: 'Documento eliminado', eliminado: resultado.affectedRows });
      } catch (error) {
        console.error('❌ Error al eliminar:', error);
        res.status(500).json({ error: 'Error al eliminar documento' });
      }
    });

    // POST - Login
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ success: false, error: 'email y contraseña requeridos' });
        }

        console.log('➡️ Cuerpo recibido en /login:', req.body);

        const [usuarios] = await pool.query(
          'SELECT * FROM users WHERE email = ?',
          [email]
        );

        const usuario = usuarios[0];

        if (!usuario) {
          console.log('❌ Usuario no encontrado con email:', email);
          return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
        }

        if (usuario.password !== password) {
          console.log('❌ Contraseña incorrecta para email:', email);
          return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
        }

        const { password: _, ...usuarioSinPass } = usuario;
        res.json({ success: true, mensaje: 'Login exitoso', usuario: usuarioSinPass });
      } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (e) {
    console.error('❌ Error en servidor:', e);
    process.exit(1);
  }
}

main();
