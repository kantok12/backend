# Script de despliegue para Google Cloud Run (PowerShell)
# Uso: .\deploy.ps1 [PROJECT_ID] [REGION]

param(
    [string]$ProjectId = "tu-proyecto-id",
    [string]$Region = "us-central1"
)

$ServiceName = "backend-gestion-personal"

Write-Host "🚀 Iniciando despliegue en Google Cloud Run..." -ForegroundColor Green
Write-Host "📋 Proyecto: $ProjectId" -ForegroundColor Cyan
Write-Host "🌍 Región: $Region" -ForegroundColor Cyan
Write-Host "🔧 Servicio: $ServiceName" -ForegroundColor Cyan

# Verificar que gcloud esté instalado
try {
    gcloud version | Out-Null
} catch {
    Write-Host "❌ Error: gcloud CLI no está instalado" -ForegroundColor Red
    Write-Host "📥 Instálalo desde: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Configurar proyecto
Write-Host "⚙️ Configurando proyecto..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Habilitar APIs necesarias
Write-Host "🔌 Habilitando APIs necesarias..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Construir y subir imagen
Write-Host "🏗️ Construyendo imagen Docker..." -ForegroundColor Yellow
gcloud builds submit --tag "gcr.io/$ProjectId/$ServiceName"

# Desplegar en Cloud Run
Write-Host "🚀 Desplegando en Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
  --image "gcr.io/$ProjectId/$ServiceName" `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 3000 `
  --memory 1Gi `
  --cpu 1 `
  --max-instances 10 `
  --min-instances 0 `
  --concurrency 80 `
  --timeout 300 `
  --set-env-vars NODE_ENV=production

# Obtener URL del servicio
Write-Host "🔗 Obteniendo URL del servicio..." -ForegroundColor Yellow
$ServiceUrl = gcloud run services describe $ServiceName --region=$Region --format='value(status.url)'

Write-Host "✅ Despliegue completado!" -ForegroundColor Green
Write-Host "🌐 URL del servicio: $ServiceUrl" -ForegroundColor Cyan
Write-Host "🏥 Health check: $ServiceUrl/api/health" -ForegroundColor Cyan
Write-Host "📊 API docs: $ServiceUrl/" -ForegroundColor Cyan

# Mostrar información del servicio
Write-Host ""
Write-Host "📋 Información del servicio:" -ForegroundColor Yellow
gcloud run services describe $ServiceName --region=$Region --format="table(metadata.name,status.url,spec.template.spec.containers[0].image,status.conditions[0].status)"

