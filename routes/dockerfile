FROM debian:bookworm

# Instalar Node.js
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Instalar poppler-utils
RUN apt-get update && apt-get install -y poppler-utils

# Crear directorio de la app
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN yarn install --production

# Copiar el resto del proyecto
COPY . .

# Exponer puerto Render
EXPOSE 10000

# Comando para iniciar
CMD ["node", "server.js"]
