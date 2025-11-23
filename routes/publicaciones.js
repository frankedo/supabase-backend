// Ruta: Obtener todas las publicaciones
router.get('/', async (req, res) => {
    try {
        const publicaciones = [
            {
                id: 1,
                titulo: "Informe de prueba",
                descripcion: "Descripción de prueba",
                tipo: "informe",
                fecha: "2025-11-21",
                url_pdf: "https://ppidrwpyhoqqeoesvdbk.supabase.co/storage/v1/object/public/publicaciones/CARTA%20DE%20INTENCION.pdf",
                url_portada: ""
            }
        ];

        res.json(publicaciones);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener publicaciones' });
    }
});
