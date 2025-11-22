# Dockerfile para Render - incluye poppler-utils (pdftoppm)
FROM node:18-bullseye

# Instalar poppler-utils
RUN apt-get update && apt-get install -y poppler-utils && rm -rf /var/lib/apt/lists/*

# Directorio de la app
WORKDIR /usr/src/app

# Copiar package.json e instalar deps
COPY package*.json ./
RUN npm install --production

# Copiar todo el código
COPY . .

# Puerto (ajusta si tu server usa otro)
EXPOSE 3000

# Ejecutar
CMD ["node", "server.js"]
