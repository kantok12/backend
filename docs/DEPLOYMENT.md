# Guía de Despliegue en Google Cloud Run

Esta guía te ayudará a desplegar tu backend de gestión de personal en Google Cloud Run.

## 📋 Prerrequisitos

1. **Cuenta de Google Cloud Platform**
   - Crear una cuenta en [Google Cloud Console](https://console.cloud.google.com/)
   - Habilitar facturación

2. **Google Cloud SDK**
   - Instalar desde: https://cloud.google.com/sdk/docs/install
   - Autenticarse: `gcloud auth login`

3. **Docker** (opcional, para pruebas locales)
   - Instalar Docker Desktop

## 🚀 Pasos de Despliegue

### Opción 1: Despliegue Automático (Recomendado)

#### En Windows (PowerShell):
```powershell
# Ejecutar el script de despliegue
.\deploy.ps1 "tu-proyecto-id" "us-central1"
```

#### En Linux/Mac:
```bash
# Hacer ejecutable el script
chmod +x deploy.sh

# Ejecutar el script de despliegue
./deploy.sh "tu-proyecto-id" "us-central1"
```

### Opción 2: Despliegue Manual

1. **Configurar proyecto:**
```bash
gcloud config set project tu-proyecto-id
```

2. **Habilitar APIs necesarias:**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

3. **Construir y subir imagen:**
```bash
gcloud builds submit --tag gcr.io/tu-proyecto-id/backend-gestion-personal
```

4. **Desplegar en Cloud Run:**
```bash
gcloud run deploy backend-gestion-personal \
  --image gcr.io/tu-proyecto-id/backend-gestion-personal \
  --region us-central1 \
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
```

## ⚙️ Configuración de Variables de Entorno

### Variables Obligatorias

Después del despliegue inicial, debes configurar las variables de entorno:

```bash
gcloud run services update backend-gestion-personal \
  --region us-central1 \
  --set-env-vars \
    DB_HOST=aws-1-us-east-2.pooler.supabase.com,\
    DB_PORT=5432,\
    DB_NAME=postgres,\
    DB_USER=tu-usuario-db,\
    DB_PASSWORD=tu-password-db,\
    JWT_SECRET=tu-jwt-secret-super-seguro,\
    SUPABASE_URL=https://tu-proyecto.supabase.co,\
    SUPABASE_ANON_KEY=tu-clave-anonima,\
    SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
```

### Variables Opcionales

```bash
gcloud run services update backend-gestion-personal \
  --region us-central1 \
  --set-env-vars \
    CORS_ORIGIN=https://tu-dominio-frontend.com,\
    JWT_EXPIRES_IN=24h
```

## 🔧 Configuración Avanzada

### Configurar Dominio Personalizado

1. **Mapear dominio:**
```bash
gcloud run domain-mappings create \
  --service backend-gestion-personal \
  --domain api.tu-dominio.com \
  --region us-central1
```

2. **Configurar DNS:**
   - Agregar registro CNAME apuntando a `ghs.googlehosted.com`

### Configurar SSL/TLS

Cloud Run maneja automáticamente los certificados SSL para dominios personalizados.

### Configurar Autenticación

Para requerir autenticación:

```bash
gcloud run services remove-iam-policy-binding backend-gestion-personal \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:
```bash
gcloud logs tail --follow --service=backend-gestion-personal
```

### Ver métricas:
- Ir a [Cloud Console > Cloud Run](https://console.cloud.google.com/run)
- Seleccionar tu servicio
- Ver pestaña "Métricas"

## 🔄 CI/CD con Cloud Build

Para automatizar despliegues con Git:

1. **Conectar repositorio:**
```bash
gcloud builds triggers create github \
  --repo-name=tu-repo \
  --repo-owner=tu-usuario \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

2. **Cada push a main desplegará automáticamente**

## 🛠️ Comandos Útiles

### Ver estado del servicio:
```bash
gcloud run services describe backend-gestion-personal --region us-central1
```

### Actualizar servicio:
```bash
gcloud run services update backend-gestion-personal --region us-central1
```

### Eliminar servicio:
```bash
gcloud run services delete backend-gestion-personal --region us-central1
```

### Ver logs específicos:
```bash
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=backend-gestion-personal" --limit=50
```

## 🚨 Solución de Problemas

### Error de conexión a base de datos:
- Verificar variables de entorno
- Comprobar configuración de Supabase
- Revisar logs: `gcloud logs tail --service=backend-gestion-personal`

### Error de memoria:
- Aumentar memoria: `--memory 2Gi`

### Error de timeout:
- Aumentar timeout: `--timeout 600`

### Error de CORS:
- Verificar variable `CORS_ORIGIN`
- Revisar configuración en `server.js`

## 📈 Optimizaciones

### Performance:
- Usar `--min-instances 1` para evitar cold starts
- Configurar `--concurrency` según tu carga esperada

### Costos:
- Usar `--min-instances 0` para ahorrar costos
- Configurar `--max-instances` según necesidades

## 🔐 Seguridad

1. **Variables de entorno sensibles:**
   - Usar Secret Manager para datos sensibles
   - Nunca hardcodear credenciales

2. **Configurar CORS apropiadamente:**
   - Limitar orígenes permitidos
   - No usar wildcards en producción

3. **Autenticación:**
   - Implementar autenticación JWT
   - Usar HTTPS siempre

## 📞 Soporte

Si tienes problemas:
1. Revisar logs en Cloud Console
2. Verificar configuración de variables de entorno
3. Comprobar conectividad a base de datos
4. Revisar documentación de Cloud Run

---

**¡Tu backend estará disponible en la URL que te proporcione Cloud Run!** 🎉

