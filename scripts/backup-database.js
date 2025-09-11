const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function createDatabaseBackup() {
  try {
    console.log('💾 Iniciando backup de la base de datos...');
    console.log('=====================================================');

    // Obtener configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'postgres',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    };

    console.log('🔍 Configuración de la base de datos:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Usuario: ${dbConfig.username}`);

    // Crear directorio de backups si no existe
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Directorio de backups creado');
    }

    // Generar nombre del archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    const backupFileName = `backup_${dbConfig.database}_${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    console.log('📄 Archivo de backup:', backupFileName);

    // Comando pg_dump
    const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --verbose --clean --create --if-exists --format=plain --file="${backupFilePath}"`;

    console.log('🔄 Ejecutando pg_dump...');
    console.log('⏳ Esto puede tomar varios minutos dependiendo del tamaño de la base de datos...');

    return new Promise((resolve, reject) => {
      const process = exec(pgDumpCommand, {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password
        }
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error al crear backup:', error.message);
          reject(error);
          return;
        }

        if (stderr) {
          console.log('📋 Información de pg_dump:');
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

          resolve({
            success: true,
            message: 'Backup creado exitosamente',
            data: {
              fileName: backupFileName,
              filePath: backupFilePath,
              fileSize: fileSizeMB + ' MB',
              timestamp: new Date().toISOString()
            }
          });
        } else {
          console.error('❌ El archivo de backup no se creó');
          reject(new Error('El archivo de backup no se creó'));
        }
      });

      // Mostrar progreso
      process.stdout.on('data', (data) => {
        console.log('📤', data.toString().trim());
      });

      process.stderr.on('data', (data) => {
        console.log('📋', data.toString().trim());
      });
    });

  } catch (error) {
    console.error('❌ Error al crear backup:', error);
    console.log('=====================================================');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verificar que PostgreSQL esté instalado');
    console.log('   2. Verificar que pg_dump esté en el PATH');
    console.log('   3. Verificar credenciales de la base de datos');
    console.log('   4. Verificar permisos de escritura en el directorio');
    console.log('=====================================================');
    
    return {
      success: false,
      error: 'Error al crear backup',
      message: error.message
    };
  }
}

// Función para listar backups existentes
function listBackups() {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('📁 No existe directorio de backups');
      return [];
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          filePath: filePath,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    return files;
  } catch (error) {
    console.error('❌ Error al listar backups:', error);
    return [];
  }
}

// Función para restaurar backup
function restoreBackup(backupFileName) {
  return new Promise((resolve, reject) => {
    try {
      const backupDir = path.join(__dirname, '..', 'backups');
      const backupFilePath = path.join(backupDir, backupFileName);

      if (!fs.existsSync(backupFilePath)) {
        reject(new Error(`Archivo de backup no encontrado: ${backupFileName}`));
        return;
      }

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'postgres',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
      };

      console.log('🔄 Restaurando backup...');
      console.log(`📄 Archivo: ${backupFileName}`);

      const psqlCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d postgres -f "${backupFilePath}"`;

      exec(psqlCommand, {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password
        }
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error al restaurar backup:', error.message);
          reject(error);
          return;
        }

        console.log('✅ Backup restaurado exitosamente');
        console.log('📋 Salida:', stdout);
        
        if (stderr) {
          console.log('⚠️ Advertencias:', stderr);
        }

        resolve({
          success: true,
          message: 'Backup restaurado exitosamente',
          data: {
            fileName: backupFileName,
            timestamp: new Date().toISOString()
          }
        });
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'list') {
    console.log('📋 Listando backups existentes...');
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('📁 No se encontraron backups');
    } else {
      console.log('📊 Backups encontrados:');
      backups.forEach((backup, index) => {
        console.log(`   ${index + 1}. ${backup.fileName}`);
        console.log(`      Tamaño: ${backup.size}`);
        console.log(`      Creado: ${backup.created}`);
        console.log('');
      });
    }
  } else if (args[0] === 'restore' && args[1]) {
    restoreBackup(args[1])
      .then(result => {
        console.log('✅ Restauración completada');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error en restauración:', error.message);
        process.exit(1);
      });
  } else {
    createDatabaseBackup()
      .then(result => {
        if (result.success) {
          console.log('✅ Proceso completado exitosamente');
          process.exit(0);
        } else {
          console.log('❌ Proceso falló');
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
      });
  }
}

module.exports = { 
  createDatabaseBackup, 
  listBackups, 
  restoreBackup 
};
