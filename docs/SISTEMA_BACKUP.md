# 💾 Sistema de Backup de Base de Datos

## 📋 Resumen General

**Módulo**: Sistema de Backup  
**Base URL**: `/api/backup`  
**Métodos**: `GET`, `POST`, `DELETE`  
**Descripción**: Sistema completo de backup y restauración de la base de datos PostgreSQL

---

## 🎯 Funcionalidades

### **1. Crear Backups**
- Backup completo de la base de datos
- Incluye todos los esquemas y datos
- Formato SQL plano para fácil restauración
- Timestamps automáticos en nombres de archivo

### **2. Gestionar Backups**
- Listar todos los backups existentes
- Descargar backups específicos
- Eliminar backups antiguos
- Información detallada de cada backup

### **3. Restaurar Backups**
- Restauración completa desde archivos SQL
- Comandos de restauración proporcionados
- Verificación de integridad

---

## 🌐 Endpoints Disponibles

### **Base URL**: `/api/backup`

#### **1. Listar Backups**
```
GET /api/backup
```

**Descripción**: Lista todos los backups existentes con información detallada

**Respuesta**:
```json
{
  "success": true,
  "message": "Backups encontrados",
  "data": [
    {
      "fileName": "backup_postgres_2025-01-10_18-30-45.sql",
      "filePath": "/ruta/completa/al/backup.sql",
      "size": "15.23 MB",
      "created": "2025-01-10T18:30:45.123Z",
      "modified": "2025-01-10T18:30:45.123Z"
    }
  ]
}
```

#### **2. Crear Backup**
```
POST /api/backup
```

**Descripción**: Crea un nuevo backup completo de la base de datos

**Respuesta**:
```json
{
  "success": true,
  "message": "Backup creado exitosamente",
  "data": {
    "fileName": "backup_postgres_2025-01-10_18-30-45.sql",
    "filePath": "/ruta/completa/al/backup.sql",
    "fileSize": "15.23 MB",
    "timestamp": "2025-01-10T18:30:45.123Z"
  }
}
```

#### **3. Descargar Backup**
```
GET /api/backup/:filename
```

**Descripción**: Descarga un backup específico

**Parámetros**:
- `:filename` - Nombre del archivo de backup

**Respuesta**: Archivo SQL para descarga

#### **4. Eliminar Backup**
```
DELETE /api/backup/:filename
```

**Descripción**: Elimina un backup específico

**Parámetros**:
- `:filename` - Nombre del archivo de backup

**Respuesta**:
```json
{
  "success": true,
  "message": "Backup eliminado exitosamente",
  "data": {
    "fileName": "backup_postgres_2025-01-10_18-30-45.sql",
    "timestamp": "2025-01-10T18:30:45.123Z"
  }
}
```

#### **5. Información del Sistema**
```
GET /api/backup/info
```

**Descripción**: Información detallada del sistema de backups

**Respuesta**:
```json
{
  "success": true,
  "message": "Información del sistema de backups",
  "data": {
    "backupDirectory": "/ruta/al/directorio/backups",
    "totalBackups": 5,
    "totalSize": "75.45 MB",
    "oldestBackup": {
      "fileName": "backup_postgres_2025-01-01_10-00-00.sql",
      "created": "2025-01-01T10:00:00.000Z"
    },
    "newestBackup": {
      "fileName": "backup_postgres_2025-01-10_18-30-45.sql",
      "created": "2025-01-10T18:30:45.123Z"
    },
    "databaseConfig": {
      "host": "localhost",
      "port": "5432",
      "database": "postgres",
      "username": "postgres"
    }
  }
}
```

---

## 🔧 Scripts de Comando

### **1. Backup Rápido**
```bash
# Crear backup inmediatamente
node backup-now.js
```

### **2. Backup con Opciones**
```bash
# Crear backup
node scripts/backup-database.js

# Listar backups existentes
node scripts/backup-database.js list

# Restaurar backup específico
node scripts/backup-database.js restore backup_postgres_2025-01-10_18-30-45.sql
```

### **3. Backup Simple**
```bash
# Script simplificado
node scripts/backup-simple.js
```

---

## 📊 Características del Backup

### **Contenido del Backup**:
- ✅ **Todos los esquemas** (mantenimiento, servicio, etc.)
- ✅ **Todas las tablas** y sus datos
- ✅ **Índices** y restricciones
- ✅ **Vistas** y funciones
- ✅ **Triggers** y procedimientos
- ✅ **Datos de ejemplo** incluidos

### **Opciones de pg_dump**:
- `--verbose`: Información detallada del proceso
- `--clean`: Limpiar objetos antes de crear
- `--create`: Incluir comandos CREATE DATABASE
- `--if-exists`: Usar IF EXISTS en comandos DROP
- `--format=plain`: Formato SQL legible

### **Estructura del Archivo**:
```sql
-- Backup completo de PostgreSQL
-- Fecha: 2025-01-10 18:30:45
-- Base de datos: postgres

-- Configuración inicial
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Crear base de datos
CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'es_ES.UTF-8';

-- Conectar a la base de datos
\connect postgres

-- Crear esquemas
CREATE SCHEMA IF NOT EXISTS mantenimiento;
CREATE SCHEMA IF NOT EXISTS servicio;

-- Crear tablas y datos
-- ... (contenido completo de la base de datos)
```

---

## 🚀 Casos de Uso

### **1. Backup Programado**
```bash
# Crear backup diario
curl -X POST http://localhost:3000/api/backup

# Verificar backups existentes
curl http://localhost:3000/api/backup
```

### **2. Backup Antes de Cambios**
```bash
# Crear backup antes de migración
curl -X POST http://localhost:3000/api/backup

# Verificar que se creó
curl http://localhost:3000/api/backup/info
```

### **3. Descargar Backup**
```bash
# Descargar backup específico
curl -O http://localhost:3000/api/backup/backup_postgres_2025-01-10_18-30-45.sql
```

### **4. Limpiar Backups Antiguos**
```bash
# Listar backups
curl http://localhost:3000/api/backup

# Eliminar backup antiguo
curl -X DELETE http://localhost:3000/api/backup/backup_postgres_2025-01-01_10-00-00.sql
```

---

## 🔄 Restauración de Backups

### **1. Restauración Completa**
```bash
# Restaurar desde archivo SQL
psql -h localhost -p 5432 -U postgres -d postgres -f backup_postgres_2025-01-10_18-30-45.sql
```

### **2. Restauración con Verificación**
```bash
# Verificar conexión
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();"

# Restaurar backup
psql -h localhost -p 5432 -U postgres -d postgres -f backup_postgres_2025-01-10_18-30-45.sql

# Verificar restauración
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT COUNT(*) FROM mantenimiento.personal_disponible;"
```

### **3. Restauración con Script**
```bash
# Usar script de restauración
node scripts/backup-database.js restore backup_postgres_2025-01-10_18-30-45.sql
```

---

## 📁 Estructura de Archivos

### **Directorio de Backups**:
```
backend/
├── backups/
│   ├── backup_postgres_2025-01-10_18-30-45.sql
│   ├── backup_postgres_2025-01-09_18-30-45.sql
│   └── backup_postgres_2025-01-08_18-30-45.sql
├── scripts/
│   ├── backup-database.js
│   ├── backup-simple.js
│   └── setup-servicio-schema.js
├── routes/
│   └── backup.js
└── backup-now.js
```

### **Nomenclatura de Archivos**:
- **Formato**: `backup_{database}_{fecha}_{hora}.sql`
- **Ejemplo**: `backup_postgres_2025-01-10_18-30-45.sql`
- **Fecha**: YYYY-MM-DD
- **Hora**: HH-MM-SS

---

## ⚠️ Consideraciones Importantes

### **Seguridad**:
- ✅ **Credenciales**: Se usan variables de entorno
- ✅ **Permisos**: Solo archivos .sql pueden ser descargados/eliminados
- ✅ **Validación**: Verificación de existencia de archivos
- ✅ **Logs**: Registro de todas las operaciones

### **Rendimiento**:
- ⏱️ **Tiempo**: Depende del tamaño de la base de datos
- 💾 **Espacio**: Los backups pueden ser grandes
- 🔄 **Concurrencia**: Un backup a la vez para evitar conflictos
- 📊 **Monitoreo**: Logs detallados del proceso

### **Mantenimiento**:
- 🗂️ **Limpieza**: Eliminar backups antiguos regularmente
- 📅 **Programación**: Crear backups automáticos
- 🔍 **Verificación**: Probar restauraciones periódicamente
- 📋 **Documentación**: Mantener registro de backups importantes

---

## 🎯 Mejores Prácticas

### **1. Frecuencia de Backups**:
- **Desarrollo**: Diario
- **Producción**: Cada 6 horas
- **Crítico**: Antes de cambios importantes

### **2. Retención**:
- **Backups diarios**: 7 días
- **Backups semanales**: 4 semanas
- **Backups mensuales**: 12 meses

### **3. Verificación**:
- **Probar restauraciones** regularmente
- **Verificar integridad** de archivos
- **Monitorear espacio** en disco

### **4. Automatización**:
- **Cron jobs** para backups programados
- **Scripts de limpieza** automática
- **Alertas** por fallos en backups

---

**Fecha de creación**: 10 de enero de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ **FUNCIONAL Y DOCUMENTADO**

El sistema de backup está **completamente implementado** y **listo para uso en producción**, proporcionando una solución completa para la gestión de backups de la base de datos PostgreSQL.



