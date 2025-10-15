const { query } = require('../config/database');

async function createAuditTriggers() {
  try {
    console.log('🚀 Iniciando creación de triggers de auditoría...');

    // 1. Crear función principal de auditoría
    console.log('🔧 Creando función principal de auditoría...');
    await query(`
      CREATE OR REPLACE FUNCTION sistema.auditar_cambio()
      RETURNS TRIGGER AS $$
      DECLARE
        config_record RECORD;
        datos_anteriores_json JSONB;
        datos_nuevos_json JSONB;
        registro_id_val VARCHAR(50);
        es_critico_operacion BOOLEAN := false;
        contexto_val TEXT;
      BEGIN
        -- Obtener configuración de la tabla
        SELECT * INTO config_record 
        FROM sistema.configuracion_auditoria 
        WHERE tabla = TG_TABLE_NAME AND activo = true;
        
        -- Si no hay configuración, no auditar
        IF NOT FOUND THEN
          RETURN COALESCE(NEW, OLD);
        END IF;
        
        -- Verificar si debe auditar esta operación
        CASE TG_OP
          WHEN 'INSERT' THEN
            IF NOT config_record.auditar_insert THEN
              RETURN NEW;
            END IF;
          WHEN 'UPDATE' THEN
            IF NOT config_record.auditar_update THEN
              RETURN NEW;
            END IF;
          WHEN 'DELETE' THEN
            IF NOT config_record.auditar_delete THEN
              RETURN OLD;
            END IF;
        END CASE;
        
        -- Determinar ID del registro
        registro_id_val := COALESCE(NEW.id::text, OLD.id::text, 'unknown');
        
        -- Determinar si es crítico
        es_critico_operacion := config_record.es_critico;
        IF TG_OP = 'DELETE' THEN
          es_critico_operacion := true; -- Las eliminaciones siempre son críticas
        END IF;
        
        -- Preparar datos para auditoría
        IF TG_OP = 'INSERT' THEN
          datos_anteriores_json := NULL;
          datos_nuevos_json := to_jsonb(NEW);
          contexto_val := 'Registro creado';
        ELSIF TG_OP = 'UPDATE' THEN
          datos_anteriores_json := to_jsonb(OLD);
          datos_nuevos_json := to_jsonb(NEW);
          contexto_val := 'Registro actualizado';
        ELSIF TG_OP = 'DELETE' THEN
          datos_anteriores_json := to_jsonb(OLD);
          datos_nuevos_json := NULL;
          contexto_val := 'Registro eliminado';
        END IF;
        
        -- Insertar en log de auditoría
        INSERT INTO sistema.auditoria_log (
          tabla_afectada,
          operacion,
          registro_id,
          datos_anteriores,
          datos_nuevos,
          usuario,
          ip_address,
          user_agent,
          es_critico,
          contexto,
          endpoint
        ) VALUES (
          TG_TABLE_NAME,
          TG_OP,
          registro_id_val,
          datos_anteriores_json,
          datos_nuevos_json,
          current_setting('app.current_user', true),
          inet_client_addr(),
          current_setting('app.user_agent', true),
          es_critico_operacion,
          contexto_val,
          current_setting('app.current_endpoint', true)
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Función principal de auditoría creada');

    // 2. Lista de tablas críticas con sus esquemas
    const tablasCriticas = [
      { esquema: 'mantenimiento', tabla: 'personal_disponible' },
      { esquema: 'mantenimiento', tabla: 'documentos' },
      { esquema: 'mantenimiento', tabla: 'programacion_semanal' },
      { esquema: 'mantenimiento', tabla: 'belray' },
      { esquema: 'servicios', tabla: 'carteras' },
      { esquema: 'servicios', tabla: 'clientes' },
      { esquema: 'servicios', tabla: 'nodos' }
    ];

    // 3. Crear triggers para cada tabla
    console.log('🔗 Creando triggers para tablas críticas...');
    for (const { esquema, tabla } of tablasCriticas) {
      const tablaCompleta = `${esquema}.${tabla}`;
      
      try {
        // Eliminar triggers existentes si existen
        await query(`
          DROP TRIGGER IF EXISTS trigger_auditar_${tabla}_insert ON ${tablaCompleta};
        `);
        await query(`
          DROP TRIGGER IF EXISTS trigger_auditar_${tabla}_update ON ${tablaCompleta};
        `);
        await query(`
          DROP TRIGGER IF EXISTS trigger_auditar_${tabla}_delete ON ${tablaCompleta};
        `);

        // Crear triggers
        await query(`
          CREATE TRIGGER trigger_auditar_${tabla}_insert
            AFTER INSERT ON ${tablaCompleta}
            FOR EACH ROW
            EXECUTE FUNCTION sistema.auditar_cambio();
        `);

        await query(`
          CREATE TRIGGER trigger_auditar_${tabla}_update
            AFTER UPDATE ON ${tablaCompleta}
            FOR EACH ROW
            EXECUTE FUNCTION sistema.auditar_cambio();
        `);

        await query(`
          CREATE TRIGGER trigger_auditar_${tabla}_delete
            AFTER DELETE ON ${tablaCompleta}
            FOR EACH ROW
            EXECUTE FUNCTION sistema.auditar_cambio();
        `);

        console.log(`   ✅ Triggers creados para ${tablaCompleta}`);

      } catch (error) {
        console.error(`   ❌ Error creando triggers para ${tablaCompleta}:`, error.message);
      }
    }

    // 4. Crear función para configurar contexto de usuario
    console.log('👤 Creando función de contexto de usuario...');
    await query(`
      CREATE OR REPLACE FUNCTION sistema.set_audit_context(
        p_usuario VARCHAR(100) DEFAULT NULL,
        p_user_agent TEXT DEFAULT NULL,
        p_endpoint VARCHAR(200) DEFAULT NULL
      )
      RETURNS VOID AS $$
      BEGIN
        PERFORM set_config('app.current_user', COALESCE(p_usuario, 'sistema'), false);
        PERFORM set_config('app.user_agent', COALESCE(p_user_agent, 'unknown'), false);
        PERFORM set_config('app.current_endpoint', COALESCE(p_endpoint, 'unknown'), false);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Función de contexto creada');

    // 5. Crear función para limpiar logs antiguos
    console.log('🧹 Creando función de limpieza de logs...');
    await query(`
      CREATE OR REPLACE FUNCTION sistema.limpiar_logs_antiguos(
        p_dias_antiguedad INTEGER DEFAULT 90
      )
      RETURNS INTEGER AS $$
      DECLARE
        registros_eliminados INTEGER;
      BEGIN
        -- Eliminar logs de auditoría antiguos
        DELETE FROM sistema.auditoria_log 
        WHERE timestamp < NOW() - INTERVAL '1 day' * p_dias_antiguedad;
        
        GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
        
        -- Eliminar notificaciones antiguas
        DELETE FROM sistema.notificaciones 
        WHERE timestamp < NOW() - INTERVAL '1 day' * p_dias_antiguedad;
        
        RETURN registros_eliminados;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Función de limpieza creada');

    // 6. Verificar triggers creados
    console.log('🔍 Verificando triggers creados...');
    const triggers = await query(`
      SELECT 
        trigger_name,
        event_object_schema,
        event_object_table,
        event_manipulation,
        action_timing
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trigger_auditar_%'
      ORDER BY event_object_schema, event_object_table, event_manipulation;
    `);

    console.log('📋 Triggers de auditoría creados:');
    let tablaActual = '';
    triggers.rows.forEach(trigger => {
      const tablaCompleta = `${trigger.event_object_schema}.${trigger.event_object_table}`;
      if (tablaCompleta !== tablaActual) {
        console.log(`\n   📊 ${tablaCompleta}:`);
        tablaActual = tablaCompleta;
      }
      console.log(`      ✅ ${trigger.event_manipulation} (${trigger.action_timing})`);
    });

    // 7. Crear vista para dashboard de actividad
    console.log('📊 Creando vista de dashboard...');
    await query(`
      CREATE OR REPLACE VIEW sistema.vista_dashboard_actividad AS
      SELECT 
        al.id,
        al.tabla_afectada,
        al.operacion,
        al.registro_id,
        al.usuario,
        al.timestamp,
        al.es_critico,
        al.contexto,
        al.endpoint,
        n.tipo as tipo_notificacion,
        n.titulo,
        n.mensaje,
        n.leida,
        CASE 
          WHEN al.operacion = 'INSERT' THEN 'success'
          WHEN al.operacion = 'UPDATE' THEN 'info'
          WHEN al.operacion = 'DELETE' THEN 'warning'
        END as color_operacion,
        CASE 
          WHEN al.es_critico THEN '🔴'
          WHEN al.operacion = 'DELETE' THEN '⚠️'
          WHEN al.operacion = 'INSERT' THEN '✅'
          ELSE 'ℹ️'
        END as icono
      FROM sistema.auditoria_log al
      LEFT JOIN sistema.notificaciones n ON n.auditoria_id = al.id
      ORDER BY al.timestamp DESC;
    `);
    console.log('✅ Vista de dashboard creada');

    console.log('\n🎉 ¡Triggers de auditoría creados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   🔗 ${triggers.rows.length} triggers creados`);
    console.log(`   📊 ${tablasCriticas.length} tablas monitoreadas`);
    console.log(`   🔧 3 funciones auxiliares creadas`);
    console.log(`   📈 1 vista de dashboard creada`);

  } catch (error) {
    console.error('❌ Error creando triggers de auditoría:', error);
    throw error;
  }
}

if (require.main === module) {
  createAuditTriggers()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { createAuditTriggers };
