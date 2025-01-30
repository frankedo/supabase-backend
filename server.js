import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
app.use(cors());

// Conectar a Supabase usando variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/", (req, res) => {
  res.json({ message: "API de Supabase funcionando" });
});

app.get("/get-data", async (req, res) => {
  const { data, error } = await supabase.from("lineadetiempomarlon").select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

