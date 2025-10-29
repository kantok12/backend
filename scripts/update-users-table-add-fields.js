const { query } = require('../config/database');

async function updateUsersTableAddFields() {
  try {
    console.log('🚀 Actualizando tabla usuarios con campos adicionales...');

    // 1. Agregar campos faltantes a la tabla usuarios
    console.log('📝 Agregando campos: rut, cargo, cartera_id...');
    
    // Agregar campo rut
    await query(`
      ALTER TABLE sistema.usuarios 
      ADD COLUMN IF NOT EXISTS rut VARCHAR(20);
    `);
    console.log('✅ Campo rut agregado');

    // Agregar campo cargo
    await query(`
      ALTER TABLE sistema.usuarios 
      ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
    `);
    console.log('✅ Campo cargo agregado');

    // Agregar campo cartera_id
    await query(`
      ALTER TABLE sistema.usuarios 
      ADD COLUMN IF NOT EXISTS cartera_id INTEGER;
    `);
    console.log('✅ Campo cartera_id agregado');

    // 2. Agregar constraint de foreign key para cartera_id
    console.log('🔗 Agregando foreign key constraint...');
    try {
      await query(`
        ALTER TABLE sistema.usuarios 
        ADD CONSTRAINT fk_usuarios_cartera 
        FOREIGN KEY (cartera_id) REFERENCES servicios.carteras(id) 
        ON DELETE SET NULL;
      `);
      console.log('✅ Foreign key constraint agregado');
    } catch (error) {
      if (error.code === '42710') { // Constraint already exists
        console.log('⚠️  Foreign key constraint ya existe, continuando...');
      } else {
        throw error;
      }
    }

    // 3. Agregar índices para optimizar consultas
    console.log('📊 Creando índices...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_rut ON sistema.usuarios(rut);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_cartera_id ON sistema.usuarios(cartera_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON sistema.usuarios(cargo);
    `);
    console.log('✅ Índices creados');

    // 4. Agregar constraint de unicidad para RUT
    console.log('🔒 Agregando constraint de unicidad para RUT...');
    try {
      await query(`
        ALTER TABLE sistema.usuarios 
        ADD CONSTRAINT uk_usuarios_rut UNIQUE (rut);
      `);
      console.log('✅ Constraint de unicidad para RUT agregado');
    } catch (error) {
      if (error.code === '42710') { // Constraint already exists
        console.log('⚠️  Constraint de unicidad ya existe, continuando...');
      } else {
        throw error;
      }
    }

    // 5. Actualizar usuario administrador por defecto con datos de ejemplo
    console.log('👑 Actualizando usuario administrador...');
    await query(`
      UPDATE sistema.usuarios 
      SET 
        rut = '12.345.678-9',
        cargo = 'Administrador',
        cartera_id = 6
      WHERE email = 'admin@sistema.com';
    `);
    console.log('✅ Usuario administrador actualizado');

    // 6. Verificar la actualización
    console.log('🔍 Verificando actualización...');
    const result = await query(`
      SELECT 
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        u.rut,
        u.cargo,
        u.cartera_id,
        c.name as cartera_nombre,
        u.rol,
        u.activo,
        u.created_at,
        u.ultimo_login
      FROM sistema.usuarios u
      LEFT JOIN servicios.carteras c ON u.cartera_id = c.id
      WHERE u.email = 'admin@sistema.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('📋 Usuario administrador actualizado:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   - RUT: ${user.rut}`);
      console.log(`   - Cargo: ${user.cargo}`);
      console.log(`   - Cartera ID: ${user.cartera_id}`);
      console.log(`   - Cartera: ${user.cartera_nombre || 'No asignada'}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Activo: ${user.activo}`);
    }

    console.log('🎉 ¡Tabla usuarios actualizada exitosamente!');

  } catch (error) {
    console.error('❌ Error al actualizar tabla usuarios:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateUsersTableAddFields()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { updateUsersTableAddFields };
