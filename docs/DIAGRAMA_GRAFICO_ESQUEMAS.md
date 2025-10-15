# Diagrama Gráfico de Esquemas de Base de Datos

## 🎨 Vista Gráfica del Sistema

```mermaid
graph TB
    %% ESQUEMA MANTENIMIENTO
    subgraph MANTENIMIENTO["🔧 ESQUEMA MANTENIMIENTO"]
        direction TB
        
        subgraph PERSONAL["👥 GESTIÓN DE PERSONAL"]
            PD[personal_disponible<br/>📋 RUT, nombres, cargo]
            PE[personal_estados<br/>📊 Estados del personal]
            EST[estados<br/>🏷️ Tipos de estados]
        end
        
        subgraph DOCUMENTOS["📄 GESTIÓN DE DOCUMENTOS"]
            DOC[documentos<br/>📁 Archivos por RUT]
        end
        
        subgraph ASIGNACIONES["🔗 ASIGNACIONES"]
            PC[personal_carteras<br/>🏢 Asignación a carteras]
            PCLI[personal_clientes<br/>🏪 Asignación a clientes]
            PN[personal_nodos<br/>📍 Asignación a nodos]
        end
        
        subgraph PROGRAMACION["📅 PROGRAMACIÓN"]
            PS[programacion_semanal<br/>🗓️ Programación semanal]
        end
        
        subgraph PRERREQUISITOS["📋 PRERREQUISITOS"]
            PRC[prerrequisitos_clientes<br/>✅ Requisitos por cliente]
        end
        
        subgraph SISTEMA_ANTIGUO["🔄 SISTEMA ANTIGUO"]
            CAR_OLD[carteras<br/>🏢 Carteras antiguas]
            IS[ingenieria_servicios<br/>👨‍💼 Ingenieros]
            NOD_OLD[nodos<br/>📍 Nodos antiguos]
            SP[servicios_programados<br/>⚙️ Servicios programados]
        end
    end
    
    %% ESQUEMA SERVICIOS
    subgraph SERVICIOS["🏢 ESQUEMA SERVICIOS"]
        direction TB
        
        subgraph CARTERAS["💼 CARTERAS"]
            CAR[carteras<br/>🏢 COSTA-PUERTO, BAKERY-CARNES, etc.]
        end
        
        subgraph CLIENTES["🏪 CLIENTES"]
            CLI[clientes<br/>👥 Clientes por cartera]
        end
        
        subgraph NODOS["📍 NODOS"]
            NOD[nodos<br/>📍 Ubicaciones por cliente]
        end
        
        subgraph ACUERDOS["📋 ACUERDOS"]
            ACU[acuerdos<br/>📄 Contratos comerciales]
        end
        
        subgraph MINIMO["👥 MÍNIMO PERSONAL"]
            MP[minimo_personal<br/>📊 Requerimientos mínimos]
        end
    end
    
    %% CONEXIONES PRINCIPALES
    PD -->|"RUT"| DOC
    PD -->|"RUT"| PE
    PD -->|"RUT"| PC
    PD -->|"RUT"| PCLI
    PD -->|"RUT"| PN
    PD -->|"RUT"| PS
    PD -->|"RUT"| IS
    
    EST -->|"estado_id"| PE
    
    %% CONEXIONES ENTRE ESQUEMAS
    CAR -->|"cartera_id"| CLI
    CLI -->|"cliente_id"| NOD
    CLI -->|"cliente_id"| ACU
    CLI -->|"cliente_id"| MP
    CLI -->|"cliente_id"| PRC
    
    CAR -->|"cartera_id"| ACU
    CAR -->|"cartera_id"| MP
    CAR -->|"cartera_id"| PC
    CAR -->|"cartera_id"| PS
    
    NOD -->|"nodo_id"| ACU
    NOD -->|"nodo_id"| MP
    NOD -->|"nodo_id"| PN
    NOD -->|"nodo_id"| PS
    
    %% CONEXIONES SISTEMA ANTIGUO
    CAR_OLD -->|"cartera_id"| NOD_OLD
    CAR_OLD -->|"cartera_id"| SP
    IS -->|"ingeniero_id"| SP
    NOD_OLD -->|"nodo_id"| SP
    
    %% ESTILOS
    classDef mantenimiento fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef servicios fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef personal fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef documentos fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef asignaciones fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef programacion fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef antiguo fill:#f5f5f5,stroke:#424242,stroke-width:2px
    
    class PD,PE,EST personal
    class DOC documentos
    class PC,PCLI,PN,PRC asignaciones
    class PS programacion
    class CAR_OLD,IS,NOD_OLD,SP antiguo
    class CAR,CLI,NOD,ACU,MP servicios
```

---

## 🎯 **Flujo de Datos Principal**

```mermaid
flowchart LR
    subgraph ENTRADA["📥 ENTRADA DE DATOS"]
        A[👤 Personal<br/>RUT, nombres, cargo]
        B[📄 Documentos<br/>Archivos por RUT]
        C[🏢 Carteras<br/>COSTA-PUERTO, etc.]
        D[🏪 Clientes<br/>Por cartera]
        E[📍 Nodos<br/>Por cliente]
    end
    
    subgraph PROCESO["⚙️ PROCESAMIENTO"]
        F[🔗 Asignaciones<br/>Personal ↔ Servicios]
        G[📅 Programación<br/>Semanal]
        H[📋 Prerrequisitos<br/>Validaciones]
        I[👥 Mínimo Personal<br/>Requerimientos]
    end
    
    subgraph SALIDA["📤 SALIDA DE DATOS"]
        J[📊 Reportes<br/>Estados y asignaciones]
        K[🗓️ Programación<br/>Semanal]
        L[📁 Carpetas<br/>Documentos organizados]
        M[✅ Validaciones<br/>Prerrequisitos cumplidos]
    end
    
    A --> F
    B --> L
    C --> F
    D --> F
    E --> F
    
    F --> G
    F --> H
    F --> I
    
    G --> K
    H --> M
    I --> J
    F --> J
```

---

## 🏗️ **Arquitectura del Sistema**

```mermaid
graph TB
    subgraph FRONTEND["🖥️ FRONTEND"]
        WEB[🌐 Aplicación Web<br/>React/TypeScript]
        MOBILE[📱 Aplicación Móvil<br/>Acceso remoto]
    end
    
    subgraph BACKEND["⚙️ BACKEND"]
        API[🔌 API REST<br/>Express.js]
        AUTH[🔐 Autenticación<br/>Middleware]
        UPLOAD[📤 Upload Files<br/>Multer]
    end
    
    subgraph DATABASE["🗄️ BASE DE DATOS"]
        PG[(🐘 PostgreSQL)]
        
        subgraph SCHEMAS["📊 ESQUEMAS"]
            MANT[🔧 mantenimiento<br/>Personal y documentos]
            SERV[🏢 servicios<br/>Carteras y clientes]
        end
    end
    
    subgraph STORAGE["💾 ALMACENAMIENTO"]
        LOCAL[📁 Local Storage<br/>uploads/documentos]
        DRIVE[☁️ Google Drive<br/>G:\Unidades compartidas]
    end
    
    subgraph EXTERNAL["🌐 SERVICIOS EXTERNOS"]
        EMAIL[📧 Email Service<br/>Notificaciones]
        BACKUP[💾 Backup Service<br/>Respaldo automático]
    end
    
    %% CONEXIONES
    WEB --> API
    MOBILE --> API
    
    API --> AUTH
    API --> UPLOAD
    API --> PG
    
    PG --> MANT
    PG --> SERV
    
    UPLOAD --> LOCAL
    API --> DRIVE
    
    API --> EMAIL
    API --> BACKUP
    
    %% ESTILOS
    classDef frontend fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef backend fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef database fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef storage fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class WEB,MOBILE frontend
    class API,AUTH,UPLOAD backend
    class PG,MANT,SERV database
    class LOCAL,DRIVE storage
    class EMAIL,BACKUP external
```

---

## 📊 **Estadísticas Visuales**

```mermaid
pie title Distribución de Tablas por Esquema
    "mantenimiento" : 12
    "servicios" : 5
    "sistema_antiguo" : 4
```

```mermaid
pie title Tipos de Endpoints
    "Gestión Personal" : 8
    "Gestión Servicios" : 6
    "Documentos" : 4
    "Programación" : 3
    "Otros" : 5
```

---

## 🔄 **Flujo de Migración de Documentos**

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant DB as 🗄️ Base de Datos
    participant FS as 💾 Sistema de Archivos
    
    U->>F: Solicita migración
    F->>B: POST /api/migrar-documentos/ejecutar
    B->>DB: Consulta documentos existentes
    DB-->>B: Lista de documentos
    B->>FS: Lee archivos en uploads/documentos
    FS-->>B: Contenido de archivos
    
    loop Para cada documento
        B->>DB: Busca personal por RUT
        DB-->>B: Información del personal
        B->>FS: Crea carpeta personal
        B->>FS: Crea subcarpetas (documentos/cursos)
        B->>FS: Mueve archivo a nueva ubicación
        B->>DB: Actualiza ruta en base de datos
    end
    
    B-->>F: Resultado de migración
    F-->>U: Confirmación de migración
```

---

## 📋 **Resumen Visual**

### **🎯 Características Principales:**
- **2 Esquemas** principales (mantenimiento + servicios)
- **21 Tablas** en total
- **26 Endpoints** API
- **Sistema híbrido** (local + Google Drive)
- **Migración automática** de documentos

### **🔗 Conexiones Clave:**
- Personal ↔ Servicios (asignaciones)
- Documentos ↔ Personal (por RUT)
- Programación ↔ Ambos esquemas
- Carpetas ↔ Google Drive

### **📊 Funcionalidades:**
- ✅ Gestión completa de personal
- ✅ Sistema de documentos organizados
- ✅ Programación semanal
- ✅ Validación de prerrequisitos
- ✅ Asignaciones flexibles
- ✅ Migración automática

---

*Diagramas generados el 15 de octubre de 2025*
