const { supabase } = require('../config/database');

async function testSimpleConnection() {
  console.log('🔍 PRUEBA SIMPLE DE CONEXIÓN');
  console.log('=' .repeat(40));

  try {
    // Probar consulta más simple sin esquema
    console.log('1. Probando personal_servicio sin esquema...');
    const { data: personal, error: personalError } = await supabase
      .from('personal_servicio')
      .select('*')
      .limit(1);
    
    if (personalError) {
      console.log('   ❌ Error:', personalError.message);
    } else {
      console.log('   ✅ Funciona! Datos:', personal);
      if (personal && personal.length > 0) {
        console.log('   📊 Columnas:', Object.keys(personal[0]));
      }
    }

    console.log('\n2. Probando empresas sin esquema...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('*')
      .limit(1);
    
    if (empresasError) {
      console.log('   ❌ Error:', empresasError.message);
    } else {
      console.log('   ✅ Funciona! Datos:', empresas);
      if (empresas && empresas.length > 0) {
        console.log('   📊 Columnas:', Object.keys(empresas[0]));
      }
    }

    console.log('\n3. Probando servicios sin esquema...');
    const { data: servicios, error: serviciosError } = await supabase
      .from('servicios')
      .select('*')
      .limit(1);
    
    if (serviciosError) {
      console.log('   ❌ Error:', serviciosError.message);
    } else {
      console.log('   ✅ Funciona! Datos:', servicios);
      if (servicios && servicios.length > 0) {
        console.log('   📊 Columnas:', Object.keys(servicios[0]));
      }
    }

    console.log('\n4. Intentando inserción de prueba en empresas...');
    const { data: testInsert, error: insertError } = await supabase
      .from('empresas')
      .insert({
        nombre: 'TEST EMPRESA',
        rut_empresa: '12345678-9',
        direccion: 'Test'
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('   ❌ Error en inserción:', insertError.message);
    } else {
      console.log('   ✅ Inserción exitosa!', testInsert);
      
      // Eliminar el registro de prueba
      await supabase
        .from('empresas')
        .delete()
        .eq('id', testInsert.id);
      console.log('   🗑️  Registro de prueba eliminado');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testSimpleConnection();












