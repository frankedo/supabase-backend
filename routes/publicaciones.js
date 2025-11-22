// routes/publicaciones.js
import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const router = express.Router();

// Variables de entorno (Render)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_PUBLICACIONES = process.env.BUCKET_PUBLICACIONES; // publicaciones
const BUCKET_PORTADAS = process.env.BUCKET_PORTADAS;           // portadas

// Multer para recibir archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------------------------
// 📌 Subir una publicación
// ----------------------------
router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const { titulo, descripcion, categoria, fecha } = req.body;
      const pdfFile = req.file;

      if (!pdfFile) {
        return res.status(400).json({ error: "Debe enviar un archivo PDF." });
      }

      const filename = `${Date.now()}-${pdfFile.originalname}`;

      // 1️⃣ SUBIR PDF A SUPABASE
      const { data: pdfUpload, error: pdfError } = await supabase.storage
        .from(BUCKET_PUBLICACIONES)
        .upload(filename, pdfFile.buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (pdfError) throw pdfError;

      const pdfUrl = supabase.storage
        .from(BUCKET_PUBLICACIONES)
        .getPublicUrl(filename).data.publicUrl;

      // ----------------------------
      // 2️⃣ EXTRAER PRIMERA PÁGINA COMO PNG (portada)
      // ----------------------------

      // Render NO tiene poppler, así que usamos método seguro:
      // 👉 Usar external API (si deseas), o un placeholder temporal.
      //
      // Para avanzar, dejo un generador de portada sencillo:
      const portadaFilename = filename.replace(".pdf", ".png");
      const portadaBuffer = await sharp({
        create: {
          width: 800,
          height: 1100,
          channels: 3,
          background: "#cccccc",
        },
      })
        .png()
        .toBuffer();

      // Subir portada
      const { error: portadaError } = await supabase.storage
        .from(BUCKET_PORTADAS)
        .upload(portadaFilename, portadaBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (portadaError) throw portadaError;

      const portadaUrl = supabase.storage
        .from(BUCKET_PORTADAS)
        .getPublicUrl(portadaFilename).data.publicUrl;

      // ----------------------------
      // 3️⃣ GUARDAR METADATOS EN LA BD
      // ----------------------------
      const { data: dbInsert, error: dbError } = await supabase
        .from("publicaciones")
        .insert([
          {
            titulo,
            descripcion,
            categoria,
            fecha,
            pdf_url: pdfUrl,
            portada_url: portadaUrl,
          },
        ]);

      if (dbError) throw dbError;

      res.status(200).json({
        message: "Publicación subida con éxito",
        pdfUrl,
        portadaUrl,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error subiendo la publicación",
        details: error.message,
      });
    }
  }
);

// ----------------------------
// 📌 Listar todas las publicaciones
// ----------------------------
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("publicaciones")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "No se pudieron obtener las publicaciones",
      details: error.message,
    });
  }
});

// ----------------------------
// 📌 Obtener por categoría
// ----------------------------
router.get("/categoria/:cat", async (req, res) => {
  try {
    const { cat } = req.params;

    const { data, error } = await supabase
      .from("publicaciones")
      .select("*")
      .eq("categoria", cat);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "No se pudo obtener esta categoría",
      details: error.message,
    });
  }
});

export default router;
  
