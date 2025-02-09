# supabase-backend
aqui guardo las variables privadas de mi bd en supabase (lineadeltiempo)



Explicación de la estructura
server.js → Archivo principal que configura Express y registra las rutas.
routes/timeline.js → Contiene las rutas para manejar la tabla linea_tiempo.
routes/lugares_memoria.js → Contiene las rutas para manejar la tabla lugares_memoria.
supabaseClient.js → Se encarga de la conexión con Supabase y se reutiliza en todas las rutas.
