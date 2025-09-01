# Script de PowerShell para iniciar el servidor en la red local
# Ejecutar con: .\start-network.ps1

Write-Host "🌐 Configurando servidor para acceso en red local..." -ForegroundColor Green

# Obtener la IP local
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress | Select-Object -First 1

if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown"}).IPAddress | Select-Object -First 1
}

Write-Host "📍 IP Local detectada: $localIP" -ForegroundColor Yellow
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Para acceder desde otros dispositivos en la red:" -ForegroundColor Cyan
Write-Host "   http://$localIP:3000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Asegúrate de que el firewall permite conexiones en el puerto 3000" -ForegroundColor Red
Write-Host ""

# Establecer la variable de entorno y ejecutar el servidor
$env:HOST = "0.0.0.0"
npm run dev


