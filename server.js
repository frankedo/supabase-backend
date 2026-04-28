// 📌 Importar módulos necesarios
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 📌 Crear una instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 📌 Habilitar CORS para permitir solicitudes desde el frontend en Netlify
app.use(cors({
    origin: 'https://corpomemorias.netlify.app',
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization'
}));

// 📌 Middleware para procesar bodies JSON grandes
app.use(express.json({ limit: '20mb' }));

// 📌 Importar rutas de diferentes tablas
const timelineRoutes = require('./routes/timeline');
const lugaresRoutes = require('./routes/lugares_memoria');
const archivoDigitalRoutes = require('./routes/archivo_digital');
const publicacionesRouter = require('./routes/publicaciones');
const galeriaRoutes = require('./routes/galeria_pictorica');
const piezasRoutes = require('./routes/piezas');



// 📌 Registrar las rutas en la aplicación
app.use('/timeline', timelineRoutes);
app.use('/lugares', lugaresRoutes);
app.use('/archivo_digital', archivoDigitalRoutes);
app.use('/publicaciones', publicacionesRouter);
app.use('/galeria_pictorica', galeriaRoutes);
app.use('/api/piezas', piezasRoutes);




// 📌 Ruta principal de prueba
app.get('/', (req, res) => {
    res.json({ message: '✅ API de Supabase funcionando correctamente' });
});

// 📌 Iniciar el servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
