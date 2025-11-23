const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Conectar con Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /publicaciones → devuelve todas las publicaciones
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('publicaciones')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener publicaciones' });
    }
});

module.exports = router;
