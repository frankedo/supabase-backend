import express from "express";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import pdf from "pdf-poppler";
import fs from "fs";
import path from "path";

const router = express.Router();

// 🔐 Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📌 GET — Todas las publicaciones
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("publicaciones").select("*");

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo publicaciones" });
  }
});

// 📌 POST — Crear nueva publicación con PDF
router.post("/", async (req, res) => {
  try {
    const { titulo, descripcion, tipo, url_pdf } = req.body;

    if (!url_pdf) {
      return res.status(400).json({ error: "Falta el URL del PDF" });
    }

    // 1️⃣ Descargar PDF a temporal
    const tempPdfPath = `/tmp/${Date.now()}-archivo.pdf`;
    const response = await fetch(url_pdf);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(tempPdfPath, Buffer.from(buffer));

    // 2️⃣ Convertir primera página a JPG
    const outputBase = `/tmp/${Date.now()}-thumb`;

    const pdfOptions = {
      format: "jpeg",
      out_dir: "/tmp",
      out_prefix: path.basename(outputBase),
      page: 1,
    };

    await pdf.convert(tempPdfPath, pdfOptions);

    const thumbnailPath = `${outputBase}-1.jpeg`;

    // 3️⃣ Subir miniatura al bucket “portadas”
    const fileBuffer = fs.readFileSync(thumbnailPath);

    const uploadResult = await supabase.storage
      .from("portadas")
      .upload(`miniaturas/${Date.now()}.jpg`, fileBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadResult.error) {
      return res.status(400).json({ error: uploadResult.error.message });
    }

    const { data: publicUrl } = supabase.storage
      .from("portadas")
      .getPublicUrl(uploadResult.data.path);

    // 4️⃣ Guardar registro en la tabla “publicaciones”
    const { data, error } = await supabase
      .from("publicaciones")
      .insert([
        {
          titulo,
          descripcion,
          tipo,
          url_pdf,
          url_portada: publicUrl.publicUrl,
          fecha: new Date(),
        },
      ])
      .select("*");

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      mensaje: "Publicación creada exitosamente",
      publicacion: data[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la publicación" });
  }
});

export default router;
