// routes/publicaciones.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// lee variables de entorno (defínelas en Render)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY; // service role mejor si vas a insertar archivos
const BUCKET_PUBLICACIONES = process.env.BUCKET_PUBLICACIONES || 'publicaciones';
const BUCKET_PORTADAS = process.env.BUCKET_PORTADAS || 'portadas';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// GET /publicaciones -> lista
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('publicaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /publicaciones -> procesa PDF, genera miniatura y guarda registro
/**
 * body: {
 *   titulo,
 *   descripcion,
 *   tipo,
 *   fecha,            // yyyy-mm-dd (opcional)
 *   url_pdf           // url pública en Supabase storage
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion, tipo, fecha, url_pdf } = req.body;
    if (!titulo || !url_pdf) return res.status(400).json({ error: 'Faltan titulo o url_pdf' });

    // 1) descargar PDF a temp
    const tmpDir = '/tmp';
    const pdfName = `doc_${Date.now()}.pdf`;
    const pdfPath = path.join(tmpDir, pdfName);

    const r = await fetch(url_pdf);
    if (!r.ok) throw new Error('No se pudo descargar el PDF');

    const destStream = fs.createWriteStream(pdfPath);
    await new Promise((resolve, reject) => {
      r.body.pipe(destStream);
      r.body.on('error', reject);
      destStream.on('finish', resolve);
    });

    // 2) usar pdftoppm para convertir la primera página a jpg
    // pdftoppm -f 1 -l 1 -jpeg input.pdf output_prefix
    const outPrefix = path.join(tmpDir, `thumb_${Date.now()}`);
    await new Promise((resolve, reject) => {
      const args = ['-f', '1', '-l', '1', '-jpeg', pdfPath, outPrefix];
      const p = spawn('pdftoppm', args);

      p.on('error', (err) => reject(err));
      p.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('pdftoppm falló con código ' + code));
      });
    });

    // pdftoppm genera outPrefix-1.jpg
    const generatedFile = `${outPrefix}-1.jpg`;
    if (!fs.existsSync(generatedFile)) throw new Error('No se generó la miniatura');

    // 3) subir miniatura a Supabase Storage
    const portadaFilename = `portada_${Date.now()}.jpg`;
    const portadaBuffer = fs.readFileSync(generatedFile);

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BUCKET_PORTADAS)
      .upload(portadaFilename, portadaBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('uploadError', uploadError);
      throw uploadError;
    }

    // obtener URL pública
    const { publicUrl } = supabase
      .storage
      .from(BUCKET_PORTADAS)
      .getPublicUrl(portadaFilename);

    const url_portada = publicUrl;

    // 4) insertar registro en la tabla publicaciones
    const insertObj = {
      titulo,
      descripcion: descripcion || null,
      tipo: tipo || null,
      fecha: fecha || null,
      url_pdf,
      url_portada
    };

    const { data: inserted, error: insertError } = await supabase
      .from('publicaciones')
      .insert([insertObj])
      .select()
      .single();

    if (insertError) throw insertError;

    // limpiar archivos temporales
    try { fs.unlinkSync(pdfPath); } catch (e) {}
    try { fs.unlinkSync(generatedFile); } catch (e) {}

    res.json({ ok: true, publicacion: inserted });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
