// 📌 Importar módulos necesarios
const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient'); // Importar conexión a Supabase

// 📌 Ruta para obtener todos los lugares de memoria histórica
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('lugares_memoria').select('*');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener los lugares', error: err.message });
    }
});

module.exports = router;
