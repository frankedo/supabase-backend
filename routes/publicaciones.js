// routes/publicaciones.js  (CommonJS)
const express = require('express');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Supabase (usa las env vars que ya configuraste en Render)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKET_PUBLICACIONES = process.env.BUCKET_PUBLICACIONES || 'publicaciones';
const BUCKET_PORTADAS = process.env.BUCKET_PORTADAS || 'portadas';

// multer para recibir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------------------------
// GET /publicaciones -> lista todas
// ----------------------------
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('publicaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /publicaciones error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// ----------------------------
// POST /publicaciones/upload
// Recibe multipart/form-data con fields: titulo, descripcion, tipo, fecha
// y file: (key) file  -> sube PDF a Supabase + genera miniatura + guarda registro
// ----------------------------
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { titulo, descripcion, tipo, fecha } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Se requiere el archivo PDF en field "file".' });
    if (!titulo) return res.status(400).json({ error: 'Se requiere el titulo.' });

    // filename para el bucket
    const pdfFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

    // 1) subir PDF al bucket publicaciones
    const { data: uploadPdfData, error: uploadPdfErr } = await supabase
      .storage
      .from(BUCKET_PUBLICACIONES)
      .upload(pdfFilename, file.buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadPdfErr) throw uploadPdfErr;

    const pdfPublic = supabase.storage.from(BUCKET_PUBLICACIONES).getPublicUrl(pdfFilename).data.publicUrl;
    const url_pdf = pdfPublic;

    // 2) guardar temporalmente en /tmp para procesar
    const tmpPdfPath = path.join('/tmp', `pdf_${Date.now()}.pdf`);
    fs.writeFileSync(tmpPdfPath, file.buffer);

    // 3) ejecutar pdftoppm para generar miniatura de la primera página como PNG
    // pdftoppm -f 1 -l 1 -png input.pdf out_prefix
    const outPrefix = path.join('/tmp', `thumb_${Date.now()}`);
    await new Promise((resolve, reject) => {
      const args = ['-f', '1', '-l', '1', '-png', tmpPdfPath, outPrefix];
      const p = spawn('pdftoppm', args);

      p.on('error', (err) => reject(err));
      p.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('pdftoppm returned code ' + code));
      });
    });

    const generatedPath = `${outPrefix}-1.png`;
    if (!fs.existsSync(generatedPath)) throw new Error('No se generó la miniatura');

    // 4) leer miniatura y subir al bucket portadas
    const thumbBuffer = fs.readFileSync(generatedPath);
    const thumbName = `miniatura_${Date.now()}.png`;

    const { data: uploadThumbData, error: uploadThumbErr } = await supabase
      .storage
      .from(BUCKET_PORTADAS)
      .upload(thumbName, thumbBuffer, { contentType: 'image/png', upsert: false });

    if (uploadThumbErr) throw uploadThumbErr;

    const thumbPublic = supabase.storage.from(BUCKET_PORTADAS).getPublicUrl(thumbName).data.publicUrl;
    const url_portada = thumbPublic;

    // 5) insertar registro en la tabla publicaciones
    const insertObj = {
      titulo,
      descripcion: descripcion || null,
      tipo: tipo || null,
      fecha: fecha || null,
      url_pdf,
      url_portada,
      created_at: new Date()
    };

    const { data: insertData, error: insertErr } = await supabase
      .from('publicaciones')
      .insert([insertObj])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 6) limpiar temporales
    try { fs.unlinkSync(tmpPdfPath); } catch(e){}
    try { fs.unlinkSync(generatedPath); } catch(e){}

    res.json({ ok: true, publicacion: insertData });

  } catch (err) {
    console.error('POST /publicaciones/upload error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ----------------------------
// POST /publicaciones/process-url
// Body JSON: { titulo, descripcion, tipo, fecha, url_pdf }
// (util si subiste el PDF manualmente a Supabase y solo quieres procesarlo)
// ----------------------------
router.post('/process-url', express.json(), async (req, res) => {
  try {
    const { titulo, descripcion, tipo, fecha, url_pdf } = req.body;
    if (!url_pdf || !titulo) return res.status(400).json({ error: 'Faltan url_pdf o titulo' });

    // 1) descargar PDF
    const resp = await fetch(url_pdf);
    if (!resp.ok) throw new Error('No se pudo descargar PDF desde la URL');
    const arrayBuffer = await resp.arrayBuffer();
    const tmpPdfPath = path.join('/tmp', `pdf_${Date.now()}.pdf`);
    fs.writeFileSync(tmpPdfPath, Buffer.from(arrayBuffer));

    // 2) generar miniatura con pdftoppm
    const outPrefix = path.join('/tmp', `thumb_${Date.now()}`);
    await new Promise((resolve, reject) => {
      const args = ['-f', '1', '-l', '1', '-png', tmpPdfPath, outPrefix];
      const p = spawn('pdftoppm', args);
      p.on('error', (err) => reject(err));
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error('pdftoppm err ' + code))));
    });

    const genPath = `${outPrefix}-1.png`;
    if (!fs.existsSync(genPath)) throw new Error('Miniatura no generada');

    // 3) subir miniatura a portadas
    const thumbBuffer = fs.readFileSync(genPath);
    const thumbName = `miniatura_${Date.now()}.png`;

    const { data: upThumb, error: upThumbErr } = await supabase
      .storage
      .from(BUCKET_PORTADAS)
      .upload(thumbName, thumbBuffer, { contentType: 'image/png', upsert: false });

    if (upThumbErr) throw upThumbErr;

    const thumbPublic = supabase.storage.from(BUCKET_PORTADAS).getPublicUrl(thumbName).data.publicUrl;

    // 4) insertar registro
    const { data: inserted, error: insertErr } = await supabase
      .from('publicaciones')
      .insert([{
        titulo,
        descripcion: descripcion || null,
        tipo: tipo || null,
        fecha: fecha || null,
        url_pdf,
        url_portada: thumbPublic,
        created_at: new Date()
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    try { fs.unlinkSync(tmpPdfPath); } catch(e){}
    try { fs.unlinkSync(genPath); } catch(e){}

    res.json({ ok: true, publicacion: inserted });

  } catch (err) {
    console.error('POST /publicaciones/process-url error:', err);
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
