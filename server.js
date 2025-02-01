const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 📌 Habilitar CORS para que el frontend en Netlify pueda acceder a la API
app.use(cors({
    origin: 'https://corpomemorias.netlify.app', // Reemplaza con el dominio de tu frontend
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization'
}));

// 📌 Conectar con Supabase usando variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 📌 Ruta para obtener los eventos de la base de datos
app.get('/timeline', async (req, res) => {
    try {
        const { data, error } = await supabase.from('linea_tiempo').select('*');

        if (error) {
            throw error;
        }

        res.json(data); // 📌 Enviar datos al frontend
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener datos', error: err.message });
    }
});

// 📌 Ruta principal
app.get('/', (req, res) => {
    res.json({ message: 'API de Supabase funcionando' });
});

// 📌 Iniciar el servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
