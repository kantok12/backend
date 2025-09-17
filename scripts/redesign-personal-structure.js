const { query } = require('../config/postgresql');

async function redesignPersonalStructure() {
  console.log('🔍 ANÁLISIS Y REDISEÑO DE ESTRUCTURA DE PERSONAL');
  console.log('================================================\n');

  try {
    // 1. Analizar estructura actual
    console.log('📋 1. ESTRUCTURA ACTUAL DE PERSONAL_DISPONIBLE');
    console.log('-----------------------------------------------');
    
    const currentStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
        AND table_name = 'personal_disponible'
      ORDER BY ordinal_position;
    `);
    
    console.log('Campos actuales:');
    currentStructure.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. Proponer nueva estructura
    console.log('\n🏗️ 2. NUEVA ESTRUCTURA PROPUESTA');
    console.log('----------------------------------');
    
    console.log('\n📋 TABLA: personal');
    console.log('Campos principales del personal:');
    const personalFields = [
      'rut (text, PK)',
      'nombre (text)',
      'sexo (varchar)',
      'fecha_nacimiento (date)',
      'cargo (varchar)',
      'estado_id (int4, FK → estados.id)',
      'comentario_estado (text)',
      'zona_geografica (text)',
      'fecha_creacion (timestamp)',
      'fecha_actualizacion (timestamp)',
      'activo (boolean)'
    ];
    personalFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field}`);
    });
    
    console.log('\n📚 TABLA: cursos');
    console.log('Campos de cursos y capacitaciones:');
    const cursosFields = [
      'id (int4, PK)',
      'rut_persona (text, FK → personal.rut)',
      'nombre_curso (varchar)',
      'fecha_inicio (date)',
      'fecha_fin (date)',
      'estado (varchar)',
      'institucion (varchar)',
      'descripcion (text)',
      'fecha_vencimiento (date)',
      'fecha_creacion (timestamp)',
      'fecha_actualizacion (timestamp)',
      'activo (boolean)'
    ];
    cursosFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field}`);
    });
    
    console.log('\n📄 TABLA: documentos');
    console.log('Campos de documentos del personal:');
    const documentosFields = [
      'id (int4, PK)',
      'rut_persona (text, FK → personal.rut)',
      'tipo_documento (varchar) - licencia_conducir, talla_zapatos, etc.',
      'nombre_documento (varchar)',
      'valor_documento (text) - el valor del documento',
      'fecha_emision (date)',
      'fecha_vencimiento (date)',
      'descripcion (text)',
      'fecha_creacion (timestamp)',
      'fecha_actualizacion (timestamp)',
      'activo (boolean)'
    ];
    documentosFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field}`);
    });
    
    // 3. Mapeo de campos actuales a nuevas tablas
    console.log('\n🔄 3. MAPEO DE CAMPOS ACTUALES');
    console.log('-------------------------------');
    
    console.log('\n📋 PERSONAL_DISPONIBLE → PERSONAL:');
    const personalMapping = [
      'rut → rut (PK)',
      'nombre → nombre',
      'sexo → sexo',
      'fecha_nacimiento → fecha_nacimiento',
      'cargo → cargo',
      'estado_id → estado_id (FK)',
      'comentario_estado → comentario_estado',
      'zona_geografica → zona_geografica',
      'created_at → fecha_creacion',
      'updated_at → fecha_actualizacion'
    ];
    personalMapping.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping}`);
    });
    
    console.log('\n📚 CAMPOS QUE VAN A CURSOS:');
    const cursosMapping = [
      'Los cursos ya están en tabla cursos (existente)',
      'Mantener relación rut_persona → personal.rut'
    ];
    cursosMapping.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping}`);
    });
    
    console.log('\n📄 PERSONAL_DISPONIBLE → DOCUMENTOS:');
    const documentosMapping = [
      'licencia_conducir → tipo_documento: "licencia_conducir", valor_documento: valor',
      'talla_zapatos → tipo_documento: "talla_zapatos", valor_documento: valor',
      'talla_pantalones → tipo_documento: "talla_pantalones", valor_documento: valor',
      'talla_poleras → tipo_documento: "talla_poleras", valor_documento: valor'
    ];
    documentosMapping.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping}`);
    });
    
    // 4. Script de migración propuesto
    console.log('\n🛠️ 4. SCRIPT DE MIGRACIÓN PROPUESTO');
    console.log('------------------------------------');
    
    console.log(`
-- 1. Crear nueva tabla personal
CREATE TABLE mantenimiento.personal (
    rut text PRIMARY KEY,
    nombre text,
    sexo varchar NOT NULL,
    fecha_nacimiento date NOT NULL,
    cargo varchar NOT NULL,
    estado_id integer NOT NULL REFERENCES mantenimiento.estados(id),
    comentario_estado text,
    zona_geografica text,
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true
);

-- 2. Crear nueva tabla documentos
CREATE TABLE mantenimiento.documentos (
    id serial PRIMARY KEY,
    rut_persona text NOT NULL REFERENCES mantenimiento.personal(rut),
    tipo_documento varchar NOT NULL,
    nombre_documento varchar,
    valor_documento text,
    fecha_emision date,
    fecha_vencimiento date,
    descripcion text,
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true
);

-- 3. Migrar datos de personal_disponible a personal
INSERT INTO mantenimiento.personal (rut, nombre, sexo, fecha_nacimiento, cargo, estado_id, comentario_estado, zona_geografica, fecha_creacion, fecha_actualizacion)
SELECT rut, nombre, sexo, fecha_nacimiento, cargo, estado_id, comentario_estado, zona_geografica, created_at, updated_at
FROM mantenimiento.personal_disponible;

-- 4. Migrar documentos de personal_disponible a documentos
INSERT INTO mantenimiento.documentos (rut_persona, tipo_documento, valor_documento, fecha_creacion)
SELECT rut, 'licencia_conducir', licencia_conducir, created_at FROM mantenimiento.personal_disponible WHERE licencia_conducir IS NOT NULL;

INSERT INTO mantenimiento.documentos (rut_persona, tipo_documento, valor_documento, fecha_creacion)
SELECT rut, 'talla_zapatos', talla_zapatos, created_at FROM mantenimiento.personal_disponible WHERE talla_zapatos IS NOT NULL;

INSERT INTO mantenimiento.documentos (rut_persona, tipo_documento, valor_documento, fecha_creacion)
SELECT rut, 'talla_pantalones', talla_pantalones, created_at FROM mantenimiento.personal_disponible WHERE talla_pantalones IS NOT NULL;

INSERT INTO mantenimiento.documentos (rut_persona, tipo_documento, valor_documento, fecha_creacion)
SELECT rut, 'talla_poleras', talla_poleras, created_at FROM mantenimiento.personal_disponible WHERE talla_poleras IS NOT NULL;

-- 5. Actualizar referencias en cursos
UPDATE mantenimiento.cursos SET rut_persona = rut_persona; -- Ya está correcto

-- 6. Actualizar referencias en cursos_certificaciones
UPDATE mantenimiento.cursos_certificaciones SET rut_persona = rut_persona; -- Ya está correcto

-- 7. Eliminar tabla personal_disponible (después de verificar)
-- DROP TABLE mantenimiento.personal_disponible;
    `);
    
    console.log('\n✅ Análisis y propuesta de rediseño completada');
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
  }
}

// Ejecutar análisis
redesignPersonalStructure()
  .then(() => {
    console.log('\n🎯 Análisis de rediseño finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });






