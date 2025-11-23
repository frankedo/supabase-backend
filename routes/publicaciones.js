const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const fetch = require('node-fetch'); // Asegúrate de instalar 'node-fetch'

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Ruta: Obtener todas las publicaciones
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

// Ruta: Generar o devolver portada de PDF
router.get('/portada/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Obtener la publicación por ID
    const { data: pub, error } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pub) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    // 2️⃣ Si ya tiene url_portada, usarla directamente
    if (pub.url_portada) {
      return res.redirect(pub.url_portada);
    }

    const pdfUrl = pub.url_pdf;
    const nombrePortada = `${id}.png`; // nombre de la imagen en bucket "portadas"

    // 3️⃣ Descargar PDF temporalmente
    const tmpPdfPath = path.join('/tmp', `${id}.pdf`);
    const tmpPngPath = path.join('/tmp', nombrePortada);

    const pdfData = await fetch(pdfUrl);
    if (!pdfData.ok) throw new Error('No se pudo descargar el PDF');
    const buffer = Buffer.from(await pdfData.arrayBuffer());
    fs.writeFileSync(tmpPdfPath, buffer);

    // 4️⃣ Convertir PDF a PNG usando poppler-utils
    exec(`pdftoppm -png -singlefile ${tmpPdfPath} ${tmpPngPath.replace('.png','')}`, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al generar portada' });
      }

      // 5️⃣ Subir PNG al bucket "portadas"
      const imageBuffer = fs.readFileSync(tmpPngPath);
      const { error: uploadError } = await supabase
        .storage
        .from('portadas')
        .upload(nombrePortada, imageBuffer, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: 'Error al subir portada' });
      }

      // 6️⃣ Obtener URL pública
      const urlPublica = supabase
        .storage
        .from('portadas')
        .getPublicUrl(nombrePortada).data.publicUrl;

      // 7️⃣ Actualizar la tabla con la URL de portada
      await supabase
        .from('publicaciones')
        .update({ url_portada: urlPublica })
        .eq('id', id);

      // 8️⃣ Redirigir al URL público
      res.redirect(urlPublica);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno en la ruta de portada' });
  }
});

module.exports = router;
