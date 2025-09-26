#!/bin/bash

# Script de despliegue para Google Cloud Run
# Uso: ./deploy.sh [PROJECT_ID] [REGION]

set -e

# Configuración por defecto
PROJECT_ID=${1:-"tu-proyecto-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="backend-gestion-personal"

echo "🚀 Iniciando despliegue en Google Cloud Run..."
echo "📋 Proyecto: $PROJECT_ID"
echo "🌍 Región: $REGION"
echo "🔧 Servicio: $SERVICE_NAME"

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI no está instalado"
    echo "📥 Instálalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Configurar proyecto
echo "⚙️ Configurando proyecto..."
gcloud config set project $PROJECT_ID

# Habilitar APIs necesarias
echo "🔌 Habilitando APIs necesarias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Construir y subir imagen
echo "🏗️ Construyendo imagen Docker..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Desplegar en Cloud Run
echo "🚀 Desplegando en Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production

# Obtener URL del servicio
echo "🔗 Obteniendo URL del servicio..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Despliegue completado!"
echo "🌐 URL del servicio: $SERVICE_URL"
echo "🏥 Health check: $SERVICE_URL/api/health"
echo "📊 API docs: $SERVICE_URL/"

# Mostrar información del servicio
echo ""
echo "📋 Información del servicio:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(metadata.name,status.url,spec.template.spec.containers[0].image,status.conditions[0].status)"

