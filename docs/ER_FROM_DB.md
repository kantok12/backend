# Diagrama ER generado desde la base de datos (Mermaid)

```mermaid
erDiagram
    BELRAY {
        PK id : integer
        nombre : character varying
        descripcion : text
        observaciones : text
        giro : character varying
        numero_telefono : character varying
        direccion : text
        razon_social : character varying
        rut_empresa : character varying
        comuna : character varying
        correo_electronico : character varying
        representante_legal : character varying
        gerente_general : character varying
        numero_trabajadores_obra : integer
        organismo_admin_ley_16744 : character varying
        numero_adherentes : integer
        tasa_siniestralidad_generica : numeric
        tasa_siniestralidad_adicional : numeric
        experto_prevencion_riesgos : character varying
        supervisor_coordinador_obra : character varying
    }

    CLIENTE_PRERREQUISITOS {
        PK id : integer
        cliente_id : integer
        tipo_documento : character varying
        descripcion : text
        created_at : timestamp with time zone
        updated_at : timestamp with time zone
        dias_duracion : integer
    }

    CLIENTES {
        PK id : integer
        nombre : character varying
        cartera_id : integer
        descripcion : text
        activo : boolean
        fecha_creacion : timestamp without time zone
        fecha_actualizacion : timestamp without time zone
    }

    CURSOS {
        PK id : integer
        rut_persona : text
        nombre_curso : character varying
        fecha_inicio : date
        fecha_fin : date
        estado : character varying
        institucion : character varying
        descripcion : text
        fecha_creacion : timestamp without time zone
        fecha_actualizacion : timestamp without time zone
        activo : boolean
        fecha_vencimiento : date
    }

    DOCUMENTOS {
        PK id : integer
        rut_persona : text
        nombre_documento : character varying
        tipo_documento : character varying
        nombre_archivo : character varying
        nombre_original : character varying
        tipo_mime : character varying
        tamaño_bytes : bigint
        ruta_archivo : text
        descripcion : text
        fecha_subida : timestamp without time zone
        subido_por : character varying
        activo : boolean
        fecha_emision : date
        fecha_vencimiento : date
        dias_validez : integer
        estado_documento : character varying
        institucion_emisora : character varying
    }

    ESTADO_UNIFICADO {
        PK id : bigint
        origen : text
        origen_id : bigint
        nombre : text
        descripcion : text
        activo : boolean
        created_at : timestamp with time zone
    }

    ESTADOS {
        PK id : integer
        nombre : character varying
        descripcion : text
        activo : boolean
    }

    NODOS {
        PK id : integer
        nombre : character varying
        cliente_id : integer
        ubicacion : character varying
        descripcion : text
        activo : boolean
        fecha_creacion : timestamp without time zone
        fecha_actualizacion : timestamp without time zone
    }

    NOMBRES {
        PK rut : character varying
        nombre : character varying
        sexo : character
        fecha_nacimiento : date
        licencia_conducir : character varying
        created_at : timestamp without time zone
        updated_at : timestamp without time zone
    }

    PERSONAL_CARTERAS {
        PK id : integer
        rut : character varying
        cartera_id : bigint
        created_at : timestamp without time zone
    }

    PERSONAL_CLIENTES {
        PK id : integer
        rut : character varying
        cliente_id : bigint
        created_at : timestamp without time zone
    }

    PERSONAL_DISPONIBLE {
        PK rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        talla_zapatos : character varying
        talla_pantalones : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        vencimiento_examen_altura_fisica : date
        vencimiento_examen_gran_altura_geografica : date
        vencimiento_examen_vehiculo_liviano : date
        vencimiento_cedula : date
        vencimiento_licencia_profesional : date
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP_1764332366966 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP_1764332464733 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP_1764332599812 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP_1764332642142 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP_1764332682916 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        tipo_asistencia : text
    }

    PERSONAL_DISPONIBLE_BACKUP_20251128_082057 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        talla_zapatos : character varying
        talla_pantalones : character varying
        cargo : character varying
        estado_id : integer
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
        profesion : text
        telefono_2 : text
        fecha_inicio_contrato : date
        id_area : text
        area : text
        supervisor : text
        nombre_contacto_emergencia : text
        vinculo_contacto_emergencia : text
        telefono_contacto_emergencia : text
        vencimiento_examen_altura_fisica : date
        vencimiento_examen_gran_altura_geografica : date
        vencimiento_examen_vehiculo_liviano : date
        vencimiento_cedula : date
        vencimiento_licencia_profesional : date
        tipo_asistencia : text
    }

    PERSONAL_ESTADOS {
        PK id : bigint
        rut : text
        estado_id : integer
        cargo : text
        activo : boolean
        comentario : text
        desde : timestamp with time zone
        hasta : timestamp with time zone
        created_at : timestamp with time zone
    }

    PERSONAL_NODOS {
        PK id : integer
        rut : character varying
        nodo_id : bigint
        created_at : timestamp without time zone
    }

    PRERREQUISITOS_CLIENTES {
        PK id : integer
        cliente_id : bigint
        tipo_documento : character varying
        obligatorio : boolean
        dias_validez : integer
        created_at : timestamp without time zone
    }

    PROGRAMACION_COMPATIBILIDAD {
        PK id : integer
        rut : character varying
        cartera_id : integer
        cliente_id : integer
        nodo_id : integer
        semana_inicio : date
        semana_fin : date
        lunes : boolean
        martes : boolean
        miercoles : boolean
        jueves : boolean
        viernes : boolean
        sabado : boolean
        domingo : boolean
        horas_estimadas : integer
        observaciones : text
        estado : character varying
        created_at : timestamp without time zone
        updated_at : timestamp without time zone
        dia_semana : character varying
    }

    PROGRAMACION_HISTORIAL {
        PK id : integer
        programacion_id : integer
        rut : character varying
        cartera_id : bigint
        accion : character varying
        cambios : jsonb
        fecha_accion : timestamp without time zone
        usuario : character varying
    }

    PROGRAMACION_HISTORIAL_OPTIMIZADO {
        PK id : integer
        programacion_id : integer
        rut : character varying
        cartera_id : bigint
        fecha_trabajo : date
        accion : character varying
        cambios : jsonb
        fecha_accion : timestamp without time zone
        usuario : character varying
    }

    PROGRAMACION_OPTIMIZADA {
        PK id : integer
        rut : character varying
        cartera_id : bigint
        cliente_id : bigint
        nodo_id : bigint
        fecha_trabajo : date
        dia_semana : character varying
        horas_estimadas : integer
        horas_reales : integer
        observaciones : text
        estado : character varying
        created_at : timestamp without time zone
        updated_at : timestamp without time zone
        created_by : character varying
    }

    PROGRAMACION_SEMANAL {
        PK id : integer
        rut : character varying
        cartera_id : bigint
        cliente_id : bigint
        nodo_id : bigint
        semana_inicio : date
        semana_fin : date
        lunes : boolean
        martes : boolean
        miercoles : boolean
        jueves : boolean
        viernes : boolean
        sabado : boolean
        domingo : boolean
        horas_estimadas : integer
        observaciones : text
        estado : character varying
        created_at : timestamp without time zone
        updated_at : timestamp without time zone
        created_by : character varying
        fecha_trabajo : date
        dia_semana : character varying
        horas_reales : integer
    }

    SEMANAS_TRABAJO {
        PK id : integer
        semana_inicio : date
        semana_fin : date
        año : integer
        semana_numero : integer
        activa : boolean
        created_at : timestamp without time zone
    }

    UBICACION_GEOGRAFICA {
        PK id : integer
        nombre : character varying
        tipo : character varying
        codigo : character varying
        activo : boolean
        fecha_creacion : timestamp without time zone
        fecha_actualizacion : timestamp without time zone
    }

    MANTENIMIENTO.PERSONAL_DISPONIBLE_BACKUP_20251128_081722 {
        rut : text
        sexo : character varying
        fecha_nacimiento : date
        licencia_conducir : character varying
        talla_zapatos : character varying
        talla_pantalones : character varying
        talla_poleras : character varying
        cargo : character varying
        estado_id : integer
        comentario_estado : text
        zona_geografica : text
        documentacion_id : bigint
        nombres : character varying
        id : integer
        estado_civil : character varying
        pais : character varying
        region : character varying
        comuna : character varying
        ciudad : character varying
        telefono : character varying
        correo_electronico : character varying
        correo_personal : character varying
        contacto_emergencia : text
        talla_ropa : character varying
        talla_pantalon : character varying
        talla_zapato : character varying
        id_centro_costo : character varying
        centro_costo : character varying
        sede : character varying
        created_at : timestamp without time zone
    }

    ACUERDOS {
        PK id : integer
        minimo_personal_id : integer
        tipo_acuerdo : character varying
        valor_modificacion : integer
        fecha_inicio : date
        fecha_fin : date
        motivo : text
        aprobado_por : character varying
        estado : character varying
        created_at : timestamp without time zone
        updated_at : timestamp without time zone
        created_by : character varying
    }

    CARTERAS {
        PK id : bigint
        name : text
        created_at : timestamp with time zone
    }

    CLIENTES {
        PK id : bigint
        nombre : text
        cartera_id : bigint
        created_at : timestamp with time zone
        region_id : bigint
    }

    IS {
        PK id : bigint
        engineer_name : text
        cartera_id : bigint
        created_at : timestamp with time zone
    }

    MINIMO_PERSONAL {
        PK id : integer
        cartera_id : integer
        cliente_id : integer
        nodo_id : integer
        minimo_base : integer
        descripcion : text
        activo : boolean
        created_at : timestamp without time zone
        updated_at : timestamp without time zone
        created_by : character varying
    }

    NODOS {
        PK id : bigint
        nombre : text
        cliente_id : bigint
        created_at : timestamp with time zone
    }

    UBICACION_GEOGRAFICA {
        PK id : bigint
        nombre : text
        created_at : timestamp with time zone
    }

    AUDITORIA_LOG {
        PK id : bigint
        tabla_afectada : character varying
        operacion : character varying
        registro_id : character varying
        datos_anteriores : jsonb
        datos_nuevos : jsonb
        usuario : character varying
        ip_address : inet
        user_agent : text
        timestamp : timestamp with time zone
        es_critico : boolean
        notificado : boolean
        contexto : text
        endpoint : character varying
    }

    CONFIGURACION_AUDITORIA {
        PK id : integer
        tabla : character varying
        auditar_insert : boolean
        auditar_update : boolean
        auditar_delete : boolean
        es_critico : boolean
        campos_sensibles : ARRAY
        notificar_usuarios : ARRAY
        activo : boolean
        created_at : timestamp with time zone
        updated_at : timestamp with time zone
    }

    NOTIFICACIONES {
        PK id : bigint
        auditoria_id : bigint
        tipo : character varying
        titulo : character varying
        mensaje : text
        usuario_destino : character varying
        leida : boolean
        timestamp : timestamp with time zone
        expira_en : timestamp with time zone
        metadata : jsonb
        es_critico : boolean
    }

    USUARIOS {
        PK id : bigint
        email : character varying
        password : character varying
        nombre : character varying
        apellido : character varying
        rol : character varying
        activo : boolean
        email_verificado : boolean
        ultimo_login : timestamp with time zone
        intentos_login_fallidos : integer
        bloqueado_hasta : timestamp with time zone
        token_reset_password : character varying
        token_reset_expires : timestamp with time zone
        created_at : timestamp with time zone
        updated_at : timestamp with time zone
        rut : character varying
        cargo : character varying
        cartera_id : integer
        profile_image_url : character varying
    }

    CURSOS ||--o{ PERSONAL_DISPONIBLE : "rut_persona"
    DOCUMENTOS ||--o{ PERSONAL_DISPONIBLE : "rut_persona"
    NODOS ||--o{ CLIENTES : "cliente_id"
    PERSONAL_DISPONIBLE ||--o{ ESTADOS : "estado_id"
    PERSONAL_ESTADOS ||--o{ PERSONAL_DISPONIBLE : "rut"
    PERSONAL_ESTADOS ||--o{ ESTADOS : "estado_id"
    ACUERDOS ||--o{ MINIMO_PERSONAL : "minimo_personal_id"
    CLIENTES ||--o{ UBICACION_GEOGRAFICA : "region_id"
    CLIENTES ||--o{ CARTERAS : "cartera_id"
    IS ||--o{ CARTERAS : "cartera_id"
    MINIMO_PERSONAL ||--o{ CARTERAS : "cartera_id"
    MINIMO_PERSONAL ||--o{ CLIENTES : "cliente_id"
    MINIMO_PERSONAL ||--o{ NODOS : "nodo_id"
    NODOS ||--o{ CLIENTES : "cliente_id"
    NOTIFICACIONES ||--o{ AUDITORIA_LOG : "auditoria_id"
```