# supabase-backend
aqui guardo las variables privadas de mi bd en supabase (lineadeltiempo)



Explicación de la estructura

server.js → Archivo principal que configura Express y registra las rutas.
routes/timeline.js → Contiene las rutas para manejar la tabla linea_tiempo.
routes/lugares_memoria.js → Contiene las rutas para manejar la tabla lugares_memoria.
supabaseClient.js → Se encarga de la conexión con Supabase y se reutiliza en todas las rutas.

Ventajas de esta estructura
✅ Escalabilidad: Puedes agregar más tablas y rutas sin modificar server.js.
✅ Modularidad: Cada archivo tiene una responsabilidad clara, facilitando la lectura y mantenimiento.
✅ Reutilización: La conexión a Supabase está en un solo archivo (supabaseClient.js).

Ahora, cuando quieras agregar nuevas tablas en Supabase, simplemente creas un nuevo archivo en /routes/ y lo importas en server.js. 🚀


