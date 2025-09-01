#!/bin/bash
# Script para iniciar el servidor en la red local
# Ejecutar con: ./start-network.sh

echo "🌐 Configurando servidor para acceso en red local..."

# Obtener la IP local
LOCAL_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+' 2>/dev/null || ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    # Fallback para macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

echo "📍 IP Local detectada: $LOCAL_IP"
echo "🚀 Iniciando servidor..."
echo ""
echo "📱 Para acceder desde otros dispositivos en la red:"
echo "   http://$LOCAL_IP:3000"
echo ""
echo "⚠️  Asegúrate de que el firewall permite conexiones en el puerto 3000"
echo ""

# Establecer la variable de entorno y ejecutar el servidor
export HOST=0.0.0.0
npm run dev


