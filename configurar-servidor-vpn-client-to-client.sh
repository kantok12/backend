#!/bin/bash

# Script para configurar servidor VPN con client-to-client
# Ejecutar en el servidor AWS EC2

echo "🔧 CONFIGURANDO SERVIDOR VPN PARA CLIENT-TO-CLIENT"
echo "================================================="

# Verificar si OpenVPN está instalado
if ! command -v openvpn &> /dev/null; then
    echo "❌ OpenVPN no está instalado. Instalando..."
    
    # Instalar OpenVPN (Ubuntu/Debian)
    sudo apt update
    sudo apt install -y openvpn easy-rsa
    
    # O para Amazon Linux
    # sudo yum install -y openvpn easy-rsa
fi

# Crear directorio de configuración
sudo mkdir -p /etc/openvpn/server
cd /etc/openvpn/server

# Configurar Easy-RSA
sudo make-cadir /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa

# Configurar variables
sudo tee vars << EOF
export KEY_COUNTRY="US"
export KEY_PROVINCE="CA"
export KEY_CITY="SanFrancisco"
export KEY_ORG="MyOrg"
export KEY_EMAIL="admin@myorg.com"
export KEY_OU="MyOrgUnit"
export KEY_NAME="server"
EOF

# Inicializar PKI
sudo source vars
sudo ./clean-all
sudo ./build-ca --batch
sudo ./build-key-server --batch server
sudo ./build-dh

# Generar certificados para clientes
sudo ./build-key --batch client1
sudo ./build-key --batch client2

# Crear configuración del servidor
sudo tee /etc/openvpn/server.conf << EOF
# Configuración del servidor OpenVPN
port 1194
proto udp
dev tun

# Certificados
ca /etc/openvpn/easy-rsa/keys/ca.crt
cert /etc/openvpn/easy-rsa/keys/server.crt
key /etc/openvpn/easy-rsa/keys/server.key
dh /etc/openvpn/easy-rsa/keys/dh2048.pem

# Configuración de red
server 172.27.232.0 255.255.255.0
ifconfig-pool-persist ipp.txt

# IMPORTANTE: Permitir comunicación entre clientes
client-to-client

# Configuración de rutas
push "route 172.27.232.0 255.255.255.0"
push "redirect-gateway def1 bypass-dhcp"

# DNS
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Configuración de seguridad
keepalive 10 120
cipher AES-256-CBC
user nobody
group nogroup
persist-key
persist-tun

# Logs
status /var/log/openvpn-status.log
log-append /var/log/openvpn.log
verb 3

# Configuración adicional para AWS
explicit-exit-notify 1
EOF

# Habilitar IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configurar iptables para NAT
sudo iptables -t nat -A POSTROUTING -s 172.27.232.0/24 -o eth0 -j MASQUERADE
sudo iptables -A INPUT -i tun+ -j ACCEPT
sudo iptables -A FORWARD -i tun+ -j ACCEPT
sudo iptables -A FORWARD -i tun+ -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o tun+ -m state --state RELATED,ESTABLISHED -j ACCEPT

# Guardar reglas de iptables
sudo iptables-save > /etc/iptables/rules.v4

# Iniciar y habilitar OpenVPN
sudo systemctl start openvpn@server
sudo systemctl enable openvpn@server

# Verificar estado
echo ""
echo "🔍 VERIFICANDO ESTADO DEL SERVIDOR VPN:"
sudo systemctl status openvpn@server

echo ""
echo "📋 INFORMACIÓN DE CONEXIÓN:"
echo "   Servidor: $(curl -s ifconfig.me)"
echo "   Puerto: 1194"
echo "   Protocolo: UDP"
echo "   Red VPN: 172.27.232.0/24"

echo ""
echo "✅ CONFIGURACIÓN COMPLETADA"
echo ""
echo "📁 Archivos de configuración de clientes:"
echo "   Cliente 1: /etc/openvpn/easy-rsa/keys/client1.crt"
echo "   Cliente 2: /etc/openvpn/easy-rsa/keys/client2.crt"
echo "   CA: /etc/openvpn/easy-rsa/keys/ca.crt"
echo ""
echo "🔧 Para crear más clientes:"
echo "   cd /etc/openvpn/easy-rsa"
echo "   sudo ./build-key --batch nombre_cliente"

