# Script de configuración para AWS VPN
# Uso: .\setup-aws-vpn.ps1 [VPN_IP] [VPN_PORT]

param(
    [string]$VpnIP = "172.27.232.5",
    [string]$VpnPort = "3000"
)

Write-Host "🌐 Configurando aplicación para AWS VPN..." -ForegroundColor Green

# Obtener la IP local actual
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress | Select-Object -First 1

if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown"}).IPAddress | Select-Object -First 1
}

Write-Host "📍 IP Local detectada: $localIP" -ForegroundColor Yellow

# Si no se proporciona IP de VPN, usar la IP local
if (-not $VpnIP) {
    $VpnIP = $localIP
    Write-Host "🔧 Usando IP local como VPN IP: $VpnIP" -ForegroundColor Yellow
}

Write-Host "🌐 VPN IP configurada: $VpnIP" -ForegroundColor Cyan
Write-Host "🔌 Puerto configurado: $VpnPort" -ForegroundColor Cyan

# Actualizar variables de entorno
$env:HOST = "0.0.0.0"
$env:PORT = $VpnPort
$env:NODE_ENV = "production"
$env:VPN_ENABLED = "true"

Write-Host ""
Write-Host "🚀 Iniciando servidor para AWS VPN..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 URLs de acceso:" -ForegroundColor Cyan
Write-Host "   Local: http://localhost:$VpnPort" -ForegroundColor White
Write-Host "   VPN: http://$VpnIP:$VpnPort" -ForegroundColor White
Write-Host "   Health: http://$VpnIP:$VpnPort/api/health" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Asegúrate de configurar:" -ForegroundColor Red
Write-Host "   1. Security Groups en AWS (puerto $VpnPort)" -ForegroundColor Yellow
Write-Host "   2. Firewall del servidor (puerto $VpnPort)" -ForegroundColor Yellow
Write-Host "   3. Rutas de VPN en AWS" -ForegroundColor Yellow
Write-Host ""

# Iniciar el servidor
npm start
