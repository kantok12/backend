# Diagrama gráfico de la base de datos (Mermaid)

Pegado aquí un diagrama Mermaid ER que muestra las relaciones principales. Puedes abrir este archivo en un visor que soporte Mermaid (o en GitHub si está habilitado).

```mermaid
erDiagram
    PERSONAL_DISPONIBLE {
        varchar rut PK
        varchar nombres
        varchar apellido
        varchar cargo
        varchar zona_geografica
    }
    DOCUMENTOS {
        int id PK
        varchar rut_persona FK
        varchar nombre_documento
        varchar tipo_documento
        varchar nombre_archivo
    }
    PROGRAMACION_SEMANAL {
        int id PK
        varchar rut_persona FK
        date semana_inicio
    }
    CARTERAS {
        int id PK
        varchar nombre
    }
    CLIENTES {
        int id PK
        int cartera_id FK
        varchar nombre
    }
    NODOS {
        int id PK
        int cliente_id FK
        varchar nombre
    }
    AUDITORIA_LOGS {
        int id PK
        varchar tabla
        int registro_id
    }

    PERSONAL_DISPONIBLE ||--o{ DOCUMENTOS : "tiene"
    PERSONAL_DISPONIBLE ||--o{ PROGRAMACION_SEMANAL : "programado"
    CARTERAS ||--o{ CLIENTES : "contiene"
    CLIENTES ||--o{ NODOS : "tiene"
    AUDITORIA_LOGS }o--|| PERSONAL_DISPONIBLE : "registra"

```

Instrucciones: si quieres un diagrama más completo (columnas, tipos, constraints), puedo generar un script SQL que extraiga el esquema real desde la base de datos y crear el diagrama automáticamente.
