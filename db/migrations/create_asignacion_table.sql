-- Crear tabla para registrar asignaciones en el esquema servicios
CREATE TABLE servicios.asignacion (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    rut VARCHAR(12) NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT NOW(),
    UNIQUE (cliente_id, rut),
    FOREIGN KEY (cliente_id) REFERENCES servicios.clientes(id) ON DELETE CASCADE
);