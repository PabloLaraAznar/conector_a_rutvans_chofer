import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware para medir y loguear duración de cada petición
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    let duration = durationMs / 1000; // en segundos

    if (duration > 60) {
      console.log(
        `[${req.method}] ${req.originalUrl} - Duración: ${(duration / 60).toFixed(2)} minutos - Status: ${res.statusCode}`
      );
    } else {
      console.log(
        `[${req.method}] ${req.originalUrl} - Duración: ${duration.toFixed(2)} segundos - Status: ${res.statusCode}`
      );
    }
  });

  next();
});

// 🔵 Conexión a MySQL
const pool = mysql.createPool({
  host: 'mysql.hostinger.com',
  port: 27849,
  user: 'root',
  password: 'D4rk3st3r*0',
  database: 'u726126735_rutvans_chofer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Rutas

// GET - Obtener datos
app.get('/datos', async (req, res) => {
  console.log('GET /datos - Query params:', req.query);
  try {
    const tabla = req.query.coleccion;
    if (!tabla) {
      console.log('Falta el parámetro "coleccion"');
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
    console.log(`Registros obtenidos de ${tabla}:`, rows.length);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener datos:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// POST - Crear nuevo registro
app.post('/datos', async (req, res) => {
  console.log('POST /datos - Query params:', req.query);
  console.log('POST /datos - Body:', req.body);
  try {
    const tabla = req.query.coleccion;
    if (!tabla) {
      console.log('Falta el parámetro "coleccion"');
      return res.status(400).json({ error: 'Falta el parámetro "coleccion"' });
    }

    const datos = req.body;

    if (!datos || Object.keys(datos).length === 0) {
      console.log('No se enviaron datos para insertar');
      return res.status(400).json({ error: 'No se enviaron datos para insertar' });
    }

    const campos = Object.keys(datos).join(', ');
    const valores = Object.values(datos);
    const placeholders = valores.map(() => '?').join(', ');

    const [resultado] = await pool.query(
      `INSERT INTO ${tabla} (${campos}) VALUES (${placeholders})`,
      valores
    );

    console.log('Registro insertado con ID:', resultado.insertId);
    res.status(201).json({ mensaje: 'Registro insertado', id: resultado.insertId });
  } catch (error) {
    console.error('❌ Error al insertar datos:', error);
    res.status(500).json({ error: 'Error al insertar datos' });
  }
});

// PUT - Actualizar
app.put('/datos', async (req, res) => {
  console.log('PUT /datos - Query params:', req.query);
  console.log('PUT /datos - Body:', req.body);
  try {
    const tabla = req.query.coleccion;
    const id = req.query.id;

    if (!tabla || !id) {
      console.log('Faltan parámetros "coleccion" o "id"');
      return res.status(400).json({ error: 'Faltan parámetros "coleccion" o "id"' });
    }

    const campos = Object.entries(req.body)
      .map(([key, val]) => `${key} = ${mysql.escape(val)}`)
      .join(', ');

    const [resultado] = await pool.query(
      `UPDATE ${tabla} SET ${campos} WHERE id = ?`,
      [id]
    );

    console.log(`Documento actualizado, filas modificadas: ${resultado.affectedRows}`);
    res.json({ mensaje: 'Documento actualizado', modificado: resultado.affectedRows });
  } catch (error) {
    console.error('❌ Error al actualizar:', error);
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
});

// DELETE - Eliminar
app.delete('/datos', async (req, res) => {
  console.log('DELETE /datos - Query params:', req.query);
  try {
    const tabla = req.query.coleccion;
    const id = req.query.id;

    if (!tabla || !id) {
      console.log('Faltan parámetros "coleccion" o "id"');
      return res.status(400).json({ error: 'Faltan parámetros "coleccion" o "id"' });
    }

    const [resultado] = await pool.query(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
    console.log(`Documento eliminado, filas afectadas: ${resultado.affectedRows}`);
    res.json({ mensaje: 'Documento eliminado', eliminado: resultado.affectedRows });
  } catch (error) {
    console.error('❌ Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

// POST - Login
app.post('/login', async (req, res) => {
  console.log('POST /login - Body:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('email y contraseña requeridos');
      return res.status(400).json({ success: false, error: 'email y contraseña requeridos' });
    }

    const [usuarios] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const usuario = usuarios[0];

    if (!usuario) {
      console.log('Usuario no encontrado con email:', email);
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (usuario.password !== password) {
      console.log('Contraseña incorrecta para email:', email);
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
