# 🌐 Configuración para Acceso en Red Local

Este documento explica cómo configurar el servidor para que sea accesible desde otros equipos en la red local.

## 📋 Cambios Realizados

### 1. **Servidor configurado para escuchar en todas las interfaces**
- El servidor ahora escucha en `0.0.0.0` en lugar de solo `localhost`
- Detecta automáticamente la IP local de la máquina
- Muestra tanto la URL local como la de red al iniciar

### 2. **CORS configurado para red local**
- Permite conexiones desde cualquier IP de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- Mantiene la seguridad bloqueando IPs externas

### 3. **Scripts de inicio**
- Scripts para facilitar el inicio del servidor en modo red

## 🚀 Cómo Usar

### **Opción 1: Scripts NPM**
```bash
# Para desarrollo con acceso de red
npm run dev:network

# Para producción con acceso de red
npm run start:network
```

### **Opción 2: Script de PowerShell (Windows)**
```powershell
# Ejecutar el script de PowerShell
.\start-network.ps1
```

### **Opción 3: Script de Bash (Linux/Mac)**
```bash
# Ejecutar el script de bash
./start-network.sh
```

### **Opción 4: Manual**
```bash
# Establecer variable de entorno y ejecutar
set HOST=0.0.0.0
npm run dev
```

## 📱 Acceso desde Otros Dispositivos

Una vez iniciado el servidor, verás en la consola algo como:
```
🚀 Servidor ejecutándose en el puerto 3000
📊 Ambiente: development
🔗 URL Local: http://localhost:3000
🌐 URL Red Local: http://192.168.1.100:3000
🏥 Health check: http://192.168.1.100:3000/api/health

📱 Para acceder desde otros dispositivos en la red, usa: http://192.168.1.100:3000
```

### **Endpoints disponibles desde la red:**
- **API Base:** `http://[TU_IP]:3000`
- **Health Check:** `http://[TU_IP]:3000/api/health`
- **Personal Disponible:** `http://[TU_IP]:3000/api/personal-disponible`
- **Nombres:** `http://[TU_IP]:3000/api/nombres`
- **Cursos:** `http://[TU_IP]:3000/api/cursos`

## 🔥 Configuración del Firewall

### **Windows**
1. Abre "Windows Defender Firewall"
2. Clic en "Configuración avanzada"
3. Clic en "Reglas de entrada" → "Nueva regla"
4. Selecciona "Puerto" → "TCP" → "Puertos específicos locales: 3000"
5. Selecciona "Permitir la conexión"
6. Aplica a todos los perfiles
7. Dale un nombre como "Node.js Server Port 3000"

### **macOS**
```bash
# Verificar si está bloqueado
sudo pfctl -s all | grep 3000

# Si está bloqueado, permitir el puerto
sudo pfctl -f /etc/pf.conf
```

### **Linux (Ubuntu/Debian)**
```bash
# Permitir el puerto 3000
sudo ufw allow 3000

# Verificar estado
sudo ufw status
```

## 🧪 Probar la Conexión

### **Desde otro equipo en la red:**
```bash
# Verificar conectividad básica
ping [IP_DEL_SERVIDOR]

# Probar el endpoint de salud
curl http://[IP_DEL_SERVIDOR]:3000/api/health
```

### **Desde el navegador:**
Abre en cualquier navegador: `http://[IP_DEL_SERVIDOR]:3000`

## 📋 Ejemplo de Formulario

Una vez accesible, puedes usar la API desde otros dispositivos:

```javascript
// Ejemplo de POST para crear personal disponible
fetch('http://192.168.1.100:3000/api/personal-disponible', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rut: '12345678-9',
    sexo: 'M',
    fecha_nacimiento: '1990-01-15',
    licencia_conducir: 'B',
    cargo: 'Técnico',
    estado_id: 1,
    talla_zapatos: '42',
    talla_pantalones: 'L',
    talla_poleras: 'M',
    zona_geografica: 'Norte'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔍 Resolución de Problemas

### **No puedo acceder desde otros dispositivos:**
1. ✅ Verifica que el firewall permite el puerto 3000
2. ✅ Confirma que ambos dispositivos están en la misma red
3. ✅ Prueba hacer ping a la IP del servidor
4. ✅ Verifica que no hay proxy o VPN bloqueando

### **Error de CORS:**
- El sistema está configurado para permitir IPs de red local automáticamente
- Si tienes problemas, revisa que la IP está en el rango permitido

### **¿Cómo encuentro mi IP local?**
```bash
# Windows (PowerShell)
ipconfig | findstr "IPv4"

# Windows (CMD)
ipconfig

# Linux/Mac
ip addr show
# o
ifconfig
```

## ⚡ Performance

Para mejor rendimiento en red:
- Usa `npm run start:network` en lugar de `dev:network` para producción
- Considera configurar un servidor proxy (nginx) para entornos de producción
- Monitorea el uso de red con herramientas como `netstat` o `ss`


