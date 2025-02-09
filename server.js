// 📌 Importar módulos necesarios
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 📌 Crear una instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 📌 Habilitar CORS para permitir solicitudes desde el frontend en Netlify
app.use(cors({
    origin: 'https://corpomemorias.netlify.app', // Reemplaza con el dominio de tu frontend
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization'
}));

// 📌 Middleware para procesar datos JSON
app.use(express.json());

// 📌 Importar rutas de diferentes tablas
const timelineRoutes = require('./routes/timeline');
const lugaresRoutes = require('./routes/lugares_memoria');

// 📌 Registrar las rutas en la aplicación
app.use('/timeline', timelineRoutes);
app.use('/lugares', lugaresRoutes);

// 📌 Ruta principal de prueba
app.get('/', (req, res) => {
    res.json({ message: '✅ API de Supabase funcionando correctamente' });
});

// 📌 Iniciar el servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});

