const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows_renamed.json');
const out = path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows_db_ready.json');

const targetColumns = [
  'rut', 'sexo', 'fecha_nacimiento', 'licencia_conducir', 'cargo', 'estado_id', 'documentacion_id',
  'nombres', 'id', 'estado_civil', 'pais', 'region', 'comuna', 'ciudad', 'telefono', 'correo_electronico',
  'contacto_emergencia', 'talla_ropa', 'talla_pantalon', 'talla_zapato', 'id_centro_costo', 'centro_costo',
  'sede', 'created_at', 'profesion', 'telefono_2', 'fecha_inicio_contrato', 'id_area', 'area', 'supervisor',
  'nombre_contacto_emergencia', 'vinculo_contacto_emergencia', 'telefono_contacto_emergencia', 'tipo_asistencia'
];

const keyMap = {
  'Rut': 'rut',
  'rut': 'rut',
  'Nombre': 'nombres',
  'Nombre ': 'nombres',
  'nombres': 'nombres',
  'Sexo': 'sexo',
  'Fecha Nacimiento': 'fecha_nacimiento',
  'Fecha Nacimiento ': 'fecha_nacimiento',
  'Licencia de conducir': 'licencia_conducir',
  'Licencia de conducir ': 'licencia_conducir',
  'Licencia': 'licencia_conducir',
  'Cargo': 'cargo',
  'cargo': 'cargo',
  'Tipo de Asistencia': 'tipo_asistencia',
  'Talla Ropa': 'talla_ropa',
  'Talla Zapato': 'talla_zapato',
  'Talla Pantalón': 'talla_pantalon',
  'Comuna': 'comuna',
  'Ciudad': 'ciudad',
  'Región': 'region',
  'Región ': 'region',
  'Teléfono': 'telefono',
  'Teléfono 2': 'telefono_2',
  'Correo electrónico': 'correo_electronico',
  'Profesión': 'profesion',
  'Id Centro de Costo': 'id_centro_costo',
  'Centro Costo': 'centro_costo',
  'Id Área': 'id_area',
  'Área': 'area',
  'Supervisor': 'supervisor',
  'Nombre contacto emergencia': 'nombre_contacto_emergencia',
  'Vínculo contacto emergencia': 'vinculo_contacto_emergencia',
  'Teléfono 1 contacto emergencia': 'telefono_contacto_emergencia',
  'Teléfono 1 contacto emergencia ': 'telefono_contacto_emergencia'
};

function normalizeRow(original) {
  const outRow = {};
  // initialize all target columns with null
  for (const c of targetColumns) outRow[c] = null;

  // map known keys from original
  for (const [k, v] of Object.entries(original)) {
    if (v === undefined) continue;
    const mapped = keyMap[k] || keyMap[k.trim()] || null;
    if (mapped && targetColumns.includes(mapped)) {
      outRow[mapped] = v;
      continue;
    }

    // try some heuristic lowercase key matches
    const lower = k.toString().toLowerCase().replace(/\s+/g, '_');
    for (const tc of targetColumns) {
      if (tc === lower) {
        outRow[tc] = v;
      }
    }
  }

  return outRow;
}

function main() {
  if (!fs.existsSync(src)) {
    console.error('Source JSON not found:', src);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(src, 'utf8'));
  if (!Array.isArray(data.rows)) {
    console.error('Unexpected JSON format: missing rows array');
    process.exit(1);
  }

  const newRows = data.rows.map((r, idx) => {
    const normalized = normalizeRow(r);
    // keep original for reference
    normalized.__original = r;
    return normalized;
  });

  const outData = {
    timestamp: new Date().toISOString(),
    source: data.source || src,
    count: newRows.length,
    rows: newRows
  };

  fs.writeFileSync(out, JSON.stringify(outData, null, 2), 'utf8');
  console.log('Wrote', out, 'rows:', newRows.length);
}

if (require.main === module) main();
