const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Endpoint para generar portada automáticamente
router.post('/publicaciones/portada', async (req, res) => {
    try {
        const { nombre_pdf } = req.body; // Ej: "CARTA DE INTENCION.pdf"

        // Descargar el PDF desde Supabase
        const { data, error: downloadError } = await supabase
            .storage
            .from('publicaciones')
            .download(nombre_pdf);

        if (downloadError) throw downloadError;

        const pdfPath = path.join('/tmp', nombre_pdf);
        const arrayBuffer = await data.arrayBuffer();
        fs.writeFileSync(pdfPath, Buffer.from(arrayBuffer));

        // Generar portada usando pdftoppm (PNG del primer página)
        const portadaPath = pdfPath.replace('.pdf', '.png');
        exec(`pdftoppm -png -f 1 -singlefile "${pdfPath}" "${pdfPath.replace('.pdf', '')}"`, async (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Subir la portada al bucket 'portadas'
            const portadaFile = fs.readFileSync(portadaPath);
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('portadas')
                .upload(nombre_pdf.replace('.pdf', '.png'), portadaFile, { upsert: true });

            if (uploadError) throw uploadError;

            const url_portada = `https://ppidrwpyhoqqeoesvdbk.supabase.co/storage/v1/object/public/portadas/${nombre_pdf.replace('.pdf', '.png')}`;

            // Actualizar tabla publicacion con la portada
            const { data: publicaciones, error: selectError } = await supabase
                .from('publicaciones')
                .select('id')
                .ilike('url_pdf', `%${nombre_pdf}%`)
                .limit(1);

            if (selectError) throw selectError;
            if (publicaciones.length === 0) return res.status(404).json({ error: 'No se encontró la publicación' });

            const id = publicaciones[0].id;

            const { error: updateError } = await supabase
                .from('publicaciones')
                .update({ url_portada })
                .eq('id', id);

            if (updateError) throw updateError;

            res.json({ message: 'Portada generada correctamente', url_portada });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
