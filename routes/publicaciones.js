const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /publicaciones -> todas las publicaciones
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

// GET /publicaciones/portada/:id -> portada del PDF
router.get('/portada/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: pub } = await supabase
            .from('publicaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });

        const nombrePortada = `${id}.png`;

        // Revisar si la portada ya existe
        const { data: portadaExistente } = await supabase.storage.from('portadas').download(nombrePortada).catch(() => null);

        if (portadaExistente) {
            const urlPublica = supabase.storage.from('portadas').getPublicUrl(nombrePortada).data.publicUrl;
            return res.redirect(urlPublica);
        }

        // Descargar PDF temporal
        const tmpPdf = path.join('/tmp', `${id}.pdf`);
        const tmpPng = path.join('/tmp', nombrePortada);
        const pdfResp = await fetch(pub.url_pdf);
        const buffer = Buffer.from(await pdfResp.arrayBuffer());
        fs.writeFileSync(tmpPdf, buffer);

        // Convertir PDF a PNG
        exec(`pdftoppm -png -singlefile ${tmpPdf} ${tmpPng.replace('.png','')}`, async (err) => {
            if (err) return res.status(500).json({ error: 'Error generando portada' });

            const imageBuffer = fs.readFileSync(tmpPng);
            await supabase.storage.from('portadas').upload(nombrePortada, imageBuffer, { upsert: true });

            const urlPublica = supabase.storage.from('portadas').getPublicUrl(nombrePortada).data.publicUrl;
            res.redirect(urlPublica);
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router;
