# Imagen base de Node
FROM node:18-slim

# Instalar poppler-utils para generar miniaturas de PDF
RUN apt-get update && apt-get install -y poppler-utils && apt-get clean

# Crear directorio principal
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (modo producción)
RUN npm install --omit=dev

# Copiar todo el código del backend
COPY . .

# Exponer el puerto que Render asigna (Render lo respeta)
EXPOSE 10000

# Comando para lanzar el backend
CMD ["node", "server.js"]


