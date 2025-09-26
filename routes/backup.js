const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// GET /backup - listar backups existentes
router.get('/', async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({
        success: true,
        message: 'No existe directorio de backups',
        data: []
      });
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

    res.json({
      success: true,
      message: files.length > 0 ? 'Backups encontrados' : 'No se encontraron backups',
      data: files
    });

  } catch (error) {
    console.error('Error al listar backups:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar backups',
      message: error.message
    });
  }
});

// POST /backup - crear nuevo backup
router.post('/', async (req, res) => {
  try {
    console.log('💾 Iniciando backup de la base de datos...');

    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'postgres',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    };

    // Crear directorio de backups si no existe
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generar nombre del archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    const backupFileName = `backup_${dbConfig.database}_${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Comando pg_dump
    const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --verbose --clean --create --if-exists --format=plain --file="${backupFilePath}"`;

    console.log('🔄 Ejecutando pg_dump...');

    return new Promise((resolve, reject) => {
      const process = exec(pgDumpCommand, {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password
        }
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error al crear backup:', error.message);
          res.status(500).json({
            success: false,
            error: 'Error al crear backup',
            message: error.message
          });
          return;
        }

        // Verificar que el archivo se creó
        if (fs.existsSync(backupFilePath)) {
          const stats = fs.statSync(backupFilePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          console.log('✅ Backup creado exitosamente');
          console.log(`📁 Archivo: ${backupFileName}`);
          console.log(`📊 Tamaño: ${fileSizeMB} MB`);

          res.json({
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
          res.status(500).json({
            success: false,
            error: 'El archivo de backup no se creó',
            message: 'El proceso de backup no generó el archivo esperado'
          });
        }
      });

      // Mostrar progreso en consola
      process.stdout.on('data', (data) => {
        console.log('📤', data.toString().trim());
      });

      process.stderr.on('data', (data) => {
        console.log('📋', data.toString().trim());
      });
    });

  } catch (error) {
    console.error('Error al crear backup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear backup',
      message: error.message
    });
  }
});

// GET /backup/:filename - descargar backup específico
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFilePath = path.join(backupDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup no encontrado',
        message: `No existe backup con nombre ${filename}`
      });
    }

    // Verificar que es un archivo .sql
    if (!filename.endsWith('.sql')) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo inválido',
        message: 'Solo se pueden descargar archivos .sql'
      });
    }

    // Enviar archivo
    res.download(backupFilePath, filename, (error) => {
      if (error) {
        console.error('Error al descargar backup:', error);
        res.status(500).json({
          success: false,
          error: 'Error al descargar backup',
          message: error.message
        });
      }
    });

  } catch (error) {
    console.error('Error al descargar backup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al descargar backup',
      message: error.message
    });
  }
});

// DELETE /backup/:filename - eliminar backup específico
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFilePath = path.join(backupDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup no encontrado',
        message: `No existe backup con nombre ${filename}`
      });
    }

    // Verificar que es un archivo .sql
    if (!filename.endsWith('.sql')) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo inválido',
        message: 'Solo se pueden eliminar archivos .sql'
      });
    }

    // Eliminar archivo
    fs.unlinkSync(backupFilePath);

    res.json({
      success: true,
      message: 'Backup eliminado exitosamente',
      data: {
        fileName: filename,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al eliminar backup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar backup',
      message: error.message
    });
  }
});

// GET /backup/info - información sobre el sistema de backups
router.get('/info', async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    let totalSize = 0;
    let fileCount = 0;
    let oldestBackup = null;
    let newestBackup = null;

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql'));

      fileCount = files.length;

      if (files.length > 0) {
        files.forEach(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;

          if (!oldestBackup || stats.birthtime < oldestBackup.birthtime) {
            oldestBackup = {
              fileName: file,
              created: stats.birthtime.toISOString()
            };
          }

          if (!newestBackup || stats.birthtime > newestBackup.birthtime) {
            newestBackup = {
              fileName: file,
              created: stats.birthtime.toISOString()
            };
          }
        });
      }
    }

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      message: 'Información del sistema de backups',
      data: {
        backupDirectory: backupDir,
        totalBackups: fileCount,
        totalSize: totalSizeMB + ' MB',
        oldestBackup: oldestBackup,
        newestBackup: newestBackup,
        databaseConfig: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || '5432',
          database: process.env.DB_NAME || 'postgres',
          username: process.env.DB_USER || 'postgres'
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener información de backups:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información de backups',
      message: error.message
    });
  }
});

module.exports = router;









