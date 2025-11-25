// Configuración global de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Esta función recibe la URL del PDF y devuelve una imagen base64 de la portada
async function obtenerPortadaPDF(urlPDF) {
    try {
        const loadingTask = pdfjsLib.getDocument(urlPDF);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // página 1 = portada

        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        return canvas.toDataURL(); // imagen base64
    } catch (error) {
        console.error("Error al obtener la portada del PDF:", error);
        return 'https://placehold.co/300x400?text=Sin+portada';
    }
}
