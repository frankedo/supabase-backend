#!/usr/bin/env bash
set -e

# Instalar Poppler
apt-get update
apt-get install -y poppler-utils

echo "Poppler instalado correctamente en Render."
