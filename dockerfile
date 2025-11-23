# Imagen base de Node
FROM node:18-slim

# Instalar poppler-utils para convertir PDFs
RUN apt-get update && apt-get install -y poppler-utils && apt-get clean

# Crear directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias en modo producción
RUN npm install --omit=dev

# Copiar todo el código del proyecto
COPY . .

# Exponer el puerto 10000 (Render lo respeta automáticamente)
EXPOSE 10000

# Comando para iniciar tu servidor
CMD ["node", "server.js"]
