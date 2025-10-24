#!/bin/bash

# Script para configurar Security Groups en AWS para VPN
# Ejecutar con AWS CLI configurado

echo "🔧 CONFIGURANDO SECURITY GROUPS EN AWS PARA VPN"
echo "=============================================="

# Variables (ajustar según tu configuración)
VPC_ID="vpc-074a54e4254d4dd0e"
SUBNET_ID="subnet-03576a78e96da8d13"
INSTANCE_ID="i-0dd088e51052edd12"

echo "📍 Configurando para:"
echo "   VPC: $VPC_ID"
echo "   Subnet: $SUBNET_ID"
echo "   Instancia: $INSTANCE_ID"
echo ""

# Crear Security Group para VPN
echo "🔧 Creando Security Group para VPN..."
VPN_SG_ID=$(aws ec2 create-security-group \
    --group-name "vpn-server-sg" \
    --description "Security group para servidor VPN con client-to-client" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

echo "✅ Security Group creado: $VPN_SG_ID"

# Regla 1: Permitir OpenVPN (puerto 1194 UDP)
echo "🔧 Configurando regla para OpenVPN (puerto 1194 UDP)..."
aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol udp \
    --port 1194 \
    --cidr 0.0.0.0/0

# Regla 2: Permitir tráfico entre clientes VPN (rango 172.27.232.0/24)
echo "🔧 Configurando regla para comunicación entre clientes VPN..."
aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol all \
    --source-group $VPN_SG_ID

# Regla 3: Permitir SSH (puerto 22)
echo "🔧 Configurando regla para SSH..."
aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# Regla 4: Permitir HTTP/HTTPS para la aplicación
echo "🔧 Configurando regla para aplicación web..."
aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Regla 5: Permitir ICMP (ping) para diagnóstico
echo "🔧 Configurando regla para ICMP (ping)..."
aws ec2 authorize-security-group-ingress \
    --group-id $VPN_SG_ID \
    --protocol icmp \
    --port -1 \
    --cidr 0.0.0.0/0

# Asignar Security Group a la instancia
echo "🔧 Asignando Security Group a la instancia..."
aws ec2 modify-instance-attribute \
    --instance-id $INSTANCE_ID \
    --groups $VPN_SG_ID

echo ""
echo "✅ CONFIGURACIÓN DE SECURITY GROUPS COMPLETADA"
echo ""
echo "📋 Resumen de configuración:"
echo "   Security Group ID: $VPN_SG_ID"
echo "   Puerto OpenVPN: 1194 (UDP)"
echo "   Puerto SSH: 22 (TCP)"
echo "   Puerto Aplicación: 3000 (TCP)"
echo "   Comunicación entre clientes: Habilitada"
echo ""
echo "🔍 Para verificar la configuración:"
echo "   aws ec2 describe-security-groups --group-ids $VPN_SG_ID"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Ejecuta el script de configuración del servidor VPN"
echo "   2. Configura los clientes VPN con los certificados generados"
echo "   3. Prueba la conectividad entre clientes"

