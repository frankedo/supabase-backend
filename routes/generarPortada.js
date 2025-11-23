const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// Conexión a Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Endpoint para generar portada
router.post('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Obtener la publicación de la tabla
    const { data: publicaciones, error } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !publicaciones) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    const pdfUrl = publicaciones.url_pdf;
    const pdfPath = `/tmp/${id}.pdf`; // temporal en Render
    const portadaPath = `/tmp/${id}.png`;

    // 2️⃣ Descargar el PDF
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(pdfPath, Buffer.from(buffer));

    // 3️⃣ Generar portada (solo la primera página) usando pdftoppm
    // pdftoppm -png -f 1 -singlefile input.pdf output
    await new Promise((resolve, reject) => {
      exec(`pdftoppm -png -f 1 -singlefile ${pdfPath} /tmp/${id}`, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 4️⃣ Subir la portada al bucket 'portadas'
    const portadaFile = fs.readFileSync(portadaPath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portadas')
      .upload(`${id}.png`, portadaFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { publicUrl } = supabase.storage.from('portadas').getPublicUrl(`${id}.png`);

    // 5️⃣ Actualizar la columna url_portada
    const { data: updated, error: updateError } = await supabase
      .from('publicaciones')
      .update({ url_portada: publicUrl })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ message: 'Portada generada correctamente', url_portada: publicUrl });

    // 6️⃣ Limpiar archivos temporales
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(portadaPath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar portada', details: err.message });
  }
});

module.exports = router;
