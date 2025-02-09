// 📌 Importar módulo necesario
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 📌 Conectar con Supabase usando las variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 📌 Exportar la instancia de Supabase para que pueda ser usada en otros archivos
module.exports = { supabase };
