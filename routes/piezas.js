const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');


// 📌 Obtener todas las piezas publicadas
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('piezas')
            .select('*')
            .eq('publicado', true);

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 📌 Obtener una pieza con sus imágenes
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('piezas')
            .select(`
                *,
                imagenes_piezas ( id, url )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
