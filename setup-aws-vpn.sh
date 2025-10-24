#!/bin/bash

# Script de configuración para AWS VPN (Linux/Mac)
# Uso: ./setup-aws-vpn.sh [VPN_IP] [VPN_PORT]

VPN_IP=${1:-""}
VPN_PORT=${2:-"3000"}

echo "🌐 Configurando aplicación para AWS VPN..."

# Obtener la IP local actual
LOCAL_IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null || ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="127.0.0.1"
fi

echo "📍 IP Local detectada: $LOCAL_IP"

# Si no se proporciona IP de VPN, usar la IP local
if [ -z "$VPN_IP" ]; then
    VPN_IP=$LOCAL_IP
    echo "🔧 Usando IP local como VPN IP: $VPN_IP"
fi

echo "🌐 VPN IP configurada: $VPN_IP"
echo "🔌 Puerto configurado: $VPN_PORT"

# Configurar variables de entorno
export HOST="0.0.0.0"
export PORT=$VPN_PORT
export NODE_ENV="production"
export VPN_ENABLED="true"

echo ""
echo "🚀 Iniciando servidor para AWS VPN..."
echo ""
echo "📱 URLs de acceso:"
echo "   Local: http://localhost:$VPN_PORT"
echo "   VPN: http://$VPN_IP:$VPN_PORT"
echo "   Health: http://$VPN_IP:$VPN_PORT/api/health"
echo ""
echo "⚠️  Asegúrate de configurar:"
echo "   1. Security Groups en AWS (puerto $VPN_PORT)"
echo "   2. Firewall del servidor (puerto $VPN_PORT)"
echo "   3. Rutas de VPN en AWS"
echo ""

# Iniciar el servidor
npm start


