<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Publicaciones | Corpomemorias</title>

    <!-- Bootstrap -->
    <link rel="stylesheet" href="../assets/css/creative-design.css">

    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

    <style>
        /* GRID */
        #publicacionesGrid{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        /* CARD */
        .pub-card{
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            overflow: hidden;
            transition: .2s;
        }
        .pub-card:hover{
            transform: scale(1.02);
        }

        /* Miniatura PDF */
        .pdf-thumb{
            width: 100%;
            height: 260px;
            background: #f4f4f4;
            border-bottom: 1px solid #ddd;
        }
        .pdf-thumb iframe{
            width: 100%;
            height: 100%;
            border: none;
        }

        .pub-body{
            padding: 12px;
        }

        .pub-title{
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: #222;
        }

        .pub-desc{
            font-size: 0.9rem;
            color: #555;
            margin-bottom: 6px;
            min-height: 40px;
        }

        .pub-date{
            font-size: 0.8rem;
            color: #777;
        }

        .buttons{
            margin-top: 10px;
            display: flex;
            gap: 6px;
        }

        .btn-yellow{
            background: #fbc02d;
            border: none;
            color: #000;
            padding: 6px 10px;
            font-size: 0.8rem;
            border-radius: 6px;
        }
    </style>
</head>

<body>

<header class="header">
    <div class="overlay"></div>
    <div class="header-content">
        <h3>Archivo de Publicaciones</h3>
        <h6>Informes, Boletines, Revistas, Libros, Talleres</h6>
    </div>
</header>

<div class="container mt-4">

    <!-- FILTRO -->
    <div class="row mb-3">
        <div class="col-md-4">
            <select id="filterPublicaciones" class="form-control">
                <option value="all">Todas</option>
                <option value="informe">Informes</option>
                <option value="boletin">Boletines</option>
                <option value="revista">Revistas</option>
                <option value="libro">Libros</option>
                <option value="taller">Talleres</option>
            </select>
        </div>
    </div>

    <!-- GRID -->
    <div id="publicacionesGrid"></div>

</div>


<script>
const backendUrl = "https://supabase-backend.onrender.com"; // tu backend

async function cargarPublicaciones(filtro = "all"){
    const res = await fetch(`${backendUrl}/publicaciones`);
    const data = await res.json();

    const grid = document.getElementById("publicacionesGrid");
    grid.innerHTML = "";

    data
        .filter(pub => filtro === "all" || pub.tipo === filtro)
        .forEach(pub => {
            const fecha = new Date(pub.fecha).getFullYear();

            const card = `
                <div class="pub-card">

                    <!-- Miniatura desde el PDF -->
                    <div class="pdf-thumb">
                        <iframe src="https://docs.google.com/gview?embedded=1&url=${pub.url}#page=1"></iframe>
                    </div>

                    <div class="pub-body">
                        <div class="pub-title">${pub.titulo}</div>
                        <div class="pub-desc">${pub.descripcion || 'Sin descripción'}</div>
                        <div class="pub-date">📅 ${fecha}</div>

                        <div class="buttons">
                            <a href="${pub.url}" target="_blank" class="btn-yellow">Leer PDF</a>

                            <button class="btn-yellow" onclick="sharePub('${pub.titulo}','${pub.url}')">
                                Compartir
                            </button>
                        </div>
                    </div>
                </div>
            `;

            grid.innerHTML += card;
        });
}

function sharePub(titulo, url){
    const text = `${titulo} - ${url}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, "_blank");
}

document.getElementById("filterPublicaciones")
        .addEventListener("change", e => cargarPublicaciones(e.target.value));

cargarPublicaciones();
</script>

</body>
</html>
