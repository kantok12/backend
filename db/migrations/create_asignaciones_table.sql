-- Crear tabla para registrar asignaciones
CREATE TABLE asignaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    rut VARCHAR(12) NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT NOW(),
    UNIQUE (cliente_id, rut),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);