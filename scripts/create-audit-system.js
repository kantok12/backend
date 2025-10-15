const { query } = require('../config/database');

async function createAuditSystem() {
  try {
    console.log('🚀 Iniciando creación del sistema de auditoría híbrido...');

    // 1. Crear esquema sistema si no existe
    console.log('📁 Creando esquema sistema...');
    await query(`
      CREATE SCHEMA IF NOT EXISTS sistema;
    `);
    console.log('✅ Esquema sistema creado');

    // 2. Crear tabla principal de auditoría
    console.log('📊 Creando tabla auditoria_log...');
    await query(`
      CREATE TABLE IF NOT EXISTS sistema.auditoria_log (
        id BIGSERIAL PRIMARY KEY,
        tabla_afectada VARCHAR(100) NOT NULL,
        operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
        registro_id VARCHAR(50) NOT NULL,
        datos_anteriores JSONB,
        datos_nuevos JSONB,
        usuario VARCHAR(100),
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        es_critico BOOLEAN DEFAULT false,
        notificado BOOLEAN DEFAULT false,
        contexto TEXT,
        endpoint VARCHAR(200)
      );
    `);
    console.log('✅ Tabla auditoria_log creada');

    // 3. Crear tabla de notificaciones
    console.log('🔔 Creando tabla notificaciones...');
    await query(`
      CREATE TABLE IF NOT EXISTS sistema.notificaciones (
        id BIGSERIAL PRIMARY KEY,
        auditoria_id BIGINT REFERENCES sistema.auditoria_log(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('info', 'warning', 'error', 'success', 'critical')),
        titulo VARCHAR(200) NOT NULL,
        mensaje TEXT NOT NULL,
        usuario_destino VARCHAR(100),
        leida BOOLEAN DEFAULT false,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        expira_en TIMESTAMPTZ,
        metadata JSONB
      );
    `);
    console.log('✅ Tabla notificaciones creada');

    // 4. Crear tabla de configuración de auditoría
    console.log('⚙️ Creando tabla configuracion_auditoria...');
    await query(`
      CREATE TABLE IF NOT EXISTS sistema.configuracion_auditoria (
        id SERIAL PRIMARY KEY,
        tabla VARCHAR(100) NOT NULL UNIQUE,
        auditar_insert BOOLEAN DEFAULT true,
        auditar_update BOOLEAN DEFAULT true,
        auditar_delete BOOLEAN DEFAULT true,
        es_critico BOOLEAN DEFAULT false,
        campos_sensibles TEXT[],
        notificar_usuarios TEXT[],
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla configuracion_auditoria creada');

    // 5. Crear índices para optimización
    console.log('📈 Creando índices...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_log_tabla ON sistema.auditoria_log(tabla_afectada);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_log_operacion ON sistema.auditoria_log(operacion);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_log_timestamp ON sistema.auditoria_log(timestamp);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_log_usuario ON sistema.auditoria_log(usuario);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_log_critico ON sistema.auditoria_log(es_critico);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON sistema.notificaciones(tipo);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON sistema.notificaciones(leida);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_timestamp ON sistema.notificaciones(timestamp);
    `);
    console.log('✅ Índices creados');

    // 6. Crear función para generar notificaciones automáticas
    console.log('🔧 Creando función de notificaciones...');
    await query(`
      CREATE OR REPLACE FUNCTION sistema.generar_notificacion_auditoria()
      RETURNS TRIGGER AS $$
      DECLARE
        config_record RECORD;
        titulo_notif VARCHAR(200);
        mensaje_notif TEXT;
        tipo_notif VARCHAR(50);
        es_critico_operacion BOOLEAN := false;
      BEGIN
        -- Obtener configuración de la tabla
        SELECT * INTO config_record 
        FROM sistema.configuracion_auditoria 
        WHERE tabla = TG_TABLE_NAME AND activo = true;
        
        -- Si no hay configuración, no generar notificación
        IF NOT FOUND THEN
          RETURN COALESCE(NEW, OLD);
        END IF;
        
        -- Determinar si es crítico
        es_critico_operacion := config_record.es_critico;
        
        -- Generar título y mensaje según operación
        CASE TG_OP
          WHEN 'INSERT' THEN
            titulo_notif := 'Nuevo registro creado en ' || TG_TABLE_NAME;
            mensaje_notif := 'Se creó un nuevo registro en la tabla ' || TG_TABLE_NAME;
            tipo_notif := 'success';
          WHEN 'UPDATE' THEN
            titulo_notif := 'Registro actualizado en ' || TG_TABLE_NAME;
            mensaje_notif := 'Se actualizó un registro en la tabla ' || TG_TABLE_NAME;
            tipo_notif := 'info';
          WHEN 'DELETE' THEN
            titulo_notif := 'Registro eliminado de ' || TG_TABLE_NAME;
            mensaje_notif := 'Se eliminó un registro de la tabla ' || TG_TABLE_NAME;
            tipo_notif := 'warning';
            es_critico_operacion := true; -- Las eliminaciones siempre son críticas
        END CASE;
        
        -- Crear notificación
        INSERT INTO sistema.notificaciones (
          auditoria_id,
          tipo,
          titulo,
          mensaje,
          es_critico,
          metadata
        ) VALUES (
          (SELECT id FROM sistema.auditoria_log WHERE timestamp = NOW() ORDER BY id DESC LIMIT 1),
          tipo_notif,
          titulo_notif,
          mensaje_notif,
          es_critico_operacion,
          jsonb_build_object(
            'tabla', TG_TABLE_NAME,
            'operacion', TG_OP,
            'registro_id', COALESCE(NEW.id::text, OLD.id::text)
          )
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Función de notificaciones creada');

    // 7. Insertar configuración inicial para tablas críticas
    console.log('⚙️ Configurando auditoría para tablas críticas...');
    const tablasCriticas = [
      { tabla: 'personal_disponible', es_critico: true, campos_sensibles: ['rut', 'nombres', 'correo_electronico'] },
      { tabla: 'documentos', es_critico: true, campos_sensibles: ['rut_persona', 'nombre_archivo'] },
      { tabla: 'programacion_semanal', es_critico: true, campos_sensibles: ['rut', 'cartera_id'] },
      { tabla: 'belray', es_critico: false, campos_sensibles: ['nombre', 'numero_telefono'] },
      { tabla: 'carteras', es_critico: true, campos_sensibles: ['name'] },
      { tabla: 'clientes', es_critico: true, campos_sensibles: ['nombre'] },
      { tabla: 'nodos', es_critico: true, campos_sensibles: ['nombre'] }
    ];

    for (const config of tablasCriticas) {
      await query(`
        INSERT INTO sistema.configuracion_auditoria (
          tabla, es_critico, campos_sensibles, auditar_insert, auditar_update, auditar_delete
        ) VALUES ($1, $2, $3, true, true, true)
        ON CONFLICT (tabla) DO UPDATE SET
          es_critico = EXCLUDED.es_critico,
          campos_sensibles = EXCLUDED.campos_sensibles,
          updated_at = NOW()
      `, [config.tabla, config.es_critico, config.campos_sensibles]);
      console.log(`   ✅ Configurado: ${config.tabla}`);
    }

    // 8. Crear trigger para actualizar timestamp de configuración
    console.log('🔄 Creando trigger de actualización...');
    await query(`
      CREATE OR REPLACE FUNCTION sistema.update_configuracion_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await query(`
      CREATE TRIGGER trigger_update_configuracion_timestamp
        BEFORE UPDATE ON sistema.configuracion_auditoria
        FOR EACH ROW
        EXECUTE FUNCTION sistema.update_configuracion_timestamp();
    `);
    console.log('✅ Trigger de actualización creado');

    // 9. Verificar estructura creada
    console.log('🔍 Verificando estructura creada...');
    const tablas = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'sistema'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tablas creadas en esquema sistema:');
    tablas.rows.forEach(tabla => {
      console.log(`   ✅ ${tabla.table_name}`);
    });

    const configuraciones = await query(`
      SELECT tabla, es_critico, auditar_insert, auditar_update, auditar_delete
      FROM sistema.configuracion_auditoria
      ORDER BY tabla;
    `);
    
    console.log('\n⚙️ Configuraciones de auditoría:');
    configuraciones.rows.forEach(config => {
      const criticidad = config.es_critico ? '🔴 CRÍTICO' : '🟡 NORMAL';
      console.log(`   ${criticidad} ${config.tabla} - I:${config.auditar_insert} U:${config.auditar_update} D:${config.auditar_delete}`);
    });

    console.log('\n🎉 ¡Sistema de auditoría híbrido creado exitosamente!');

  } catch (error) {
    console.error('❌ Error creando sistema de auditoría:', error);
    throw error;
  }
}

if (require.main === module) {
  createAuditSystem()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { createAuditSystem };
