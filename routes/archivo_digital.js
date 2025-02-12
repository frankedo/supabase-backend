const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient'); // Conexión a Supabase es el archivo que esta en el config

// 📌 Obtener todos los archivos digitales
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('archivo_digital').select('*');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener los archivos', error: err.message });
    }
});

module.exports = router;
