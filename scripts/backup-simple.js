const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

console.log('💾 Creando backup de la base de datos...');
console.log('=====================================================');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

console.log('🔍 Configuración:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Base de datos: ${dbConfig.database}`);
console.log(`   Usuario: ${dbConfig.username}`);

// Crear directorio de backups
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📁 Directorio de backups creado');
}

// Generar nombre del archivo
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                 now.toTimeString().split(' ')[0].replace(/:/g, '-');
const backupFileName = `backup_${dbConfig.database}_${timestamp}.sql`;
const backupFilePath = path.join(backupDir, backupFileName);

console.log('📄 Archivo de backup:', backupFileName);

// Comando pg_dump
const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --verbose --clean --create --if-exists --format=plain --file="${backupFilePath}"`;

console.log('🔄 Ejecutando backup...');
console.log('⏳ Esto puede tomar varios minutos...');

exec(pgDumpCommand, {
  env: {
    ...process.env,
    PGPASSWORD: dbConfig.password
  }
}, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error al crear backup:', error.message);
    console.log('=====================================================');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verificar que PostgreSQL esté instalado');
    console.log('   2. Verificar que pg_dump esté en el PATH');
    console.log('   3. Verificar credenciales de la base de datos');
    console.log('   4. Verificar permisos de escritura');
    console.log('=====================================================');
    process.exit(1);
  }

  if (stderr) {
    console.log('📋 Información del proceso:');
    console.log(stderr);
  }

  // Verificar que el archivo se creó
  if (fs.existsSync(backupFilePath)) {
    const stats = fs.statSync(backupFilePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup creado exitosamente');
    console.log('=====================================================');
    console.log(`📁 Archivo: ${backupFileName}`);
    console.log(`📊 Tamaño: ${fileSizeMB} MB`);
    console.log(`📍 Ubicación: ${backupFilePath}`);
    console.log('=====================================================');
    console.log('🎉 Backup completado exitosamente');
  } else {
    console.error('❌ El archivo de backup no se creó');
    process.exit(1);
  }
});





