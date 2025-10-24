# Script de diagnóstico para problemas de conectividad VPN
# Uso: .\diagnostico-vpn.ps1 [IP_USUARIO_1] [IP_USUARIO_2]

param(
    [string]$IPUsuario1 = "172.27.232.5",
    [string]$IPUsuario2 = "172.27.232.6"
)

Write-Host "🔍 DIAGNÓSTICO DE CONECTIVIDAD VPN" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Obtener información de red local
Write-Host "📍 INFORMACIÓN DE RED LOCAL:" -ForegroundColor Cyan
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress | Select-Object -First 1
Write-Host "   IP Local: $localIP" -ForegroundColor White

# Obtener gateway
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object {$_.NextHop -ne "::"}).NextHop | Select-Object -First 1
Write-Host "   Gateway: $gateway" -ForegroundColor White

# Obtener DNS
$dns = (Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses.Count -gt 0}).ServerAddresses | Select-Object -First 2
Write-Host "   DNS: $($dns -join ', ')" -ForegroundColor White
Write-Host ""

# Verificar conectividad básica
Write-Host "🌐 VERIFICANDO CONECTIVIDAD:" -ForegroundColor Cyan

# Test 1: Ping a gateway
Write-Host "   1. Probando conectividad al gateway..." -ForegroundColor Yellow
$gatewayTest = Test-Connection -ComputerName $gateway -Count 2 -Quiet
if ($gatewayTest) {
    Write-Host "      ✅ Gateway accesible" -ForegroundColor Green
} else {
    Write-Host "      ❌ Gateway NO accesible" -ForegroundColor Red
}

# Test 2: Ping a DNS
Write-Host "   2. Probando conectividad a DNS..." -ForegroundColor Yellow
$dnsTest = Test-Connection -ComputerName $dns[0] -Count 2 -Quiet
if ($dnsTest) {
    Write-Host "      ✅ DNS accesible" -ForegroundColor Green
} else {
    Write-Host "      ❌ DNS NO accesible" -ForegroundColor Red
}

# Test 3: Ping a internet
Write-Host "   3. Probando conectividad a internet..." -ForegroundColor Yellow
$internetTest = Test-Connection -ComputerName "8.8.8.8" -Count 2 -Quiet
if ($internetTest) {
    Write-Host "      ✅ Internet accesible" -ForegroundColor Green
} else {
    Write-Host "      ❌ Internet NO accesible" -ForegroundColor Red
}
Write-Host ""

# Verificar conectividad VPN
Write-Host "🔗 VERIFICANDO CONECTIVIDAD VPN:" -ForegroundColor Cyan

# Test 4: Ping entre usuarios VPN
Write-Host "   4. Probando ping entre usuarios VPN..." -ForegroundColor Yellow
Write-Host "      De $IPUsuario1 a $IPUsuario2" -ForegroundColor White

$vpnTest1 = Test-Connection -ComputerName $IPUsuario2 -Count 3 -Quiet
if ($vpnTest1) {
    Write-Host "      ✅ Ping exitoso entre usuarios VPN" -ForegroundColor Green
} else {
    Write-Host "      ❌ Ping FALLIDO entre usuarios VPN" -ForegroundColor Red
    
    # Diagnóstico adicional
    Write-Host ""
    Write-Host "🔧 DIAGNÓSTICO ADICIONAL:" -ForegroundColor Yellow
    
    # Verificar tabla de rutas
    Write-Host "   5. Verificando tabla de rutas..." -ForegroundColor Yellow
    $routes = Get-NetRoute -DestinationPrefix "172.27.*" -ErrorAction SilentlyContinue
    if ($routes) {
        Write-Host "      ✅ Rutas VPN encontradas:" -ForegroundColor Green
        $routes | ForEach-Object {
            Write-Host "         Destino: $($_.DestinationPrefix) -> Gateway: $($_.NextHop)" -ForegroundColor White
        }
    } else {
        Write-Host "      ❌ No se encontraron rutas VPN" -ForegroundColor Red
    }
    
    # Verificar interfaces de red
    Write-Host "   6. Verificando interfaces de red..." -ForegroundColor Yellow
    $vpnInterfaces = Get-NetAdapter | Where-Object {$_.Name -like "*VPN*" -or $_.Name -like "*TAP*" -or $_.Name -like "*TUN*"}
    if ($vpnInterfaces) {
        Write-Host "      ✅ Interfaces VPN encontradas:" -ForegroundColor Green
        $vpnInterfaces | ForEach-Object {
            Write-Host "         Interface: $($_.Name) - Estado: $($_.Status)" -ForegroundColor White
        }
    } else {
        Write-Host "      ❌ No se encontraron interfaces VPN" -ForegroundColor Red
    }
    
    # Verificar firewall
    Write-Host "   7. Verificando configuración de firewall..." -ForegroundColor Yellow
    $firewallRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*VPN*" -or $_.DisplayName -like "*ICMP*"} | Select-Object -First 5
    if ($firewallRules) {
        Write-Host "      ✅ Reglas de firewall relacionadas con VPN:" -ForegroundColor Green
        $firewallRules | ForEach-Object {
            Write-Host "         Regla: $($_.DisplayName) - Estado: $($_.Enabled)" -ForegroundColor White
        }
    } else {
        Write-Host "      ⚠️  No se encontraron reglas específicas de VPN" -ForegroundColor Yellow
    }
}

Write-Host ""

# Verificar puertos específicos
Write-Host "🔌 VERIFICANDO PUERTOS:" -ForegroundColor Cyan
$ports = @(22, 80, 443, 3000, 8080)

foreach ($port in $ports) {
    Write-Host "   8. Probando puerto $port..." -ForegroundColor Yellow
    $portTest = Test-NetConnection -ComputerName $IPUsuario2 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($portTest) {
        Write-Host "      ✅ Puerto $port abierto" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Puerto $port cerrado o filtrado" -ForegroundColor Red
    }
}

Write-Host ""

# Recomendaciones
Write-Host "💡 RECOMENDACIONES:" -ForegroundColor Cyan
Write-Host "   1. Verificar que ambos usuarios estén conectados a la misma VPN" -ForegroundColor White
Write-Host "   2. Comprobar que el firewall de Windows permita tráfico ICMP" -ForegroundColor White
Write-Host "   3. Verificar que la VPN esté configurada para permitir comunicación entre clientes" -ForegroundColor White
Write-Host "   4. Comprobar que no haya reglas de firewall bloqueando el rango 172.27.*" -ForegroundColor White
Write-Host "   5. Verificar la configuración del servidor VPN (client-to-client)" -ForegroundColor White

Write-Host ""
Write-Host "🔧 COMANDOS DE SOLUCIÓN:" -ForegroundColor Cyan
Write-Host "   # Permitir ICMP en firewall:" -ForegroundColor White
Write-Host "   New-NetFirewallRule -DisplayName 'Allow ICMP' -Direction Inbound -Protocol ICMPv4 -Action Allow" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Verificar estado de VPN:" -ForegroundColor White
Write-Host "   Get-VpnConnection" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Verificar rutas VPN:" -ForegroundColor White
Write-Host "   Get-NetRoute -DestinationPrefix '172.27.*'" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Probar conectividad específica:" -ForegroundColor White
Write-Host "   Test-NetConnection -ComputerName $IPUsuario2 -Port 22" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Diagnóstico completado" -ForegroundColor Green
