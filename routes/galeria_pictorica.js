const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

// 📌 Obtener todas las obras de la galería pictórica
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('galeria_pictorica')
            .select('*')
            .order('orden', { ascending: true });

        if (error) throw error;

        res.json(data);

    } catch (err) {
        res.status(500).json({ 
            message: 'Error al obtener las obras de la galería', 
            error: err.message 
        });
    }
});

module.exports = router;

