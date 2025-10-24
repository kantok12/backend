# Script para configurar firewall para comunicación VPN
# Uso: .\configurar-firewall-vpn.ps1

Write-Host "🔥 CONFIGURANDO FIREWALL PARA VPN" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "   Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Ejecutándose como Administrador" -ForegroundColor Green
Write-Host ""

# Función para crear regla de firewall
function New-FirewallRule {
    param(
        [string]$Name,
        [string]$Direction,
        [string]$Protocol,
        [string]$LocalPort,
        [string]$RemoteAddress,
        [string]$Action = "Allow"
    )
    
    try {
        # Verificar si la regla ya existe
        $existingRule = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
        
        if ($existingRule) {
            Write-Host "   ⚠️  Regla '$Name' ya existe" -ForegroundColor Yellow
            return $true
        }
        
        # Crear la regla
        $params = @{
            DisplayName = $Name
            Direction = $Direction
            Protocol = $Protocol
            Action = $Action
            Enabled = $true
        }
        
        if ($LocalPort) {
            $params.LocalPort = $LocalPort
        }
        
        if ($RemoteAddress) {
            $params.RemoteAddress = $RemoteAddress
        }
        
        New-NetFirewallRule @params | Out-Null
        Write-Host "   ✅ Regla '$Name' creada exitosamente" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ Error creando regla '$Name': $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Configurar reglas de firewall para VPN
Write-Host "🔧 CONFIGURANDO REGLAS DE FIREWALL:" -ForegroundColor Cyan

# Regla 1: Permitir ICMP (ping) desde red VPN
Write-Host "   1. Configurando regla para ICMP (ping)..." -ForegroundColor Yellow
$icmpResult = New-FirewallRule -Name "VPN-ICMP-Inbound" -Direction "Inbound" -Protocol "ICMPv4" -RemoteAddress "172.27.0.0/16"

# Regla 2: Permitir ICMP saliente hacia red VPN
Write-Host "   2. Configurando regla para ICMP saliente..." -ForegroundColor Yellow
$icmpOutResult = New-FirewallRule -Name "VPN-ICMP-Outbound" -Direction "Outbound" -Protocol "ICMPv4" -RemoteAddress "172.27.0.0/16"

# Regla 3: Permitir tráfico TCP desde red VPN
Write-Host "   3. Configurando regla para TCP desde VPN..." -ForegroundColor Yellow
$tcpInResult = New-FirewallRule -Name "VPN-TCP-Inbound" -Direction "Inbound" -Protocol "TCP" -RemoteAddress "172.27.0.0/16"

# Regla 4: Permitir tráfico TCP hacia red VPN
Write-Host "   4. Configurando regla para TCP hacia VPN..." -ForegroundColor Yellow
$tcpOutResult = New-FirewallRule -Name "VPN-TCP-Outbound" -Direction "Outbound" -Protocol "TCP" -RemoteAddress "172.27.0.0/16"

# Regla 5: Permitir tráfico UDP desde red VPN
Write-Host "   5. Configurando regla para UDP desde VPN..." -ForegroundColor Yellow
$udpInResult = New-FirewallRule -Name "VPN-UDP-Inbound" -Direction "Inbound" -Protocol "UDP" -RemoteAddress "172.27.0.0/16"

# Regla 6: Permitir tráfico UDP hacia red VPN
Write-Host "   6. Configurando regla para UDP hacia VPN..." -ForegroundColor Yellow
$udpOutResult = New-FirewallRule -Name "VPN-UDP-Outbound" -Direction "Outbound" -Protocol "UDP" -RemoteAddress "172.27.0.0/16"

# Regla 7: Permitir puerto específico de la aplicación (3000)
Write-Host "   7. Configurando regla para puerto 3000..." -ForegroundColor Yellow
$appResult = New-FirewallRule -Name "VPN-App-Port-3000" -Direction "Inbound" -Protocol "TCP" -LocalPort "3000" -RemoteAddress "172.27.0.0/16"

Write-Host ""

# Verificar estado del firewall
Write-Host "🔍 VERIFICANDO ESTADO DEL FIREWALL:" -ForegroundColor Cyan
$firewallProfiles = Get-NetFirewallProfile
foreach ($profile in $firewallProfiles) {
    Write-Host "   Perfil: $($profile.Name) - Estado: $($profile.Enabled)" -ForegroundColor White
}
Write-Host ""

# Mostrar reglas creadas
Write-Host "📋 REGLAS DE FIREWALL CREADAS:" -ForegroundColor Cyan
$vpnRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "VPN-*"}
foreach ($rule in $vpnRules) {
    Write-Host "   $($rule.DisplayName) - $($rule.Direction) - $($rule.Protocol) - $($rule.Action)" -ForegroundColor White
}
Write-Host ""

# Configurar Windows Defender Firewall para permitir comunicación entre clientes VPN
Write-Host "🛡️ CONFIGURANDO WINDOWS DEFENDER FIREWALL:" -ForegroundColor Cyan

# Habilitar reglas para permitir comunicación entre clientes VPN
try {
    # Configurar perfil de dominio
    Set-NetFirewallProfile -Profile Domain -DefaultInboundAction Allow -DefaultOutboundAction Allow -ErrorAction SilentlyContinue
    Write-Host "   ✅ Perfil de dominio configurado" -ForegroundColor Green
    
    # Configurar perfil privado
    Set-NetFirewallProfile -Profile Private -DefaultInboundAction Allow -DefaultOutboundAction Allow -ErrorAction SilentlyContinue
    Write-Host "   ✅ Perfil privado configurado" -ForegroundColor Green
    
    # Configurar perfil público (más restrictivo)
    Set-NetFirewallProfile -Profile Public -DefaultInboundAction Block -DefaultOutboundAction Allow -ErrorAction SilentlyContinue
    Write-Host "   ✅ Perfil público configurado" -ForegroundColor Green
    
} catch {
    Write-Host "   ⚠️  Error configurando perfiles de firewall: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Verificar conectividad después de la configuración
Write-Host "🧪 PROBANDO CONECTIVIDAD DESPUÉS DE LA CONFIGURACIÓN:" -ForegroundColor Cyan
$testIP = "172.27.232.6"
Write-Host "   Probando ping a $testIP..." -ForegroundColor Yellow

$pingTest = Test-Connection -ComputerName $testIP -Count 3 -Quiet
if ($pingTest) {
    Write-Host "   ✅ Ping exitoso después de configurar firewall" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ping aún falla - verificar configuración del servidor VPN" -ForegroundColor Red
}

Write-Host ""

# Recomendaciones adicionales
Write-Host "💡 RECOMENDACIONES ADICIONALES:" -ForegroundColor Cyan
Write-Host "   1. Verificar que el servidor VPN tenga habilitado 'client-to-client'" -ForegroundColor White
Write-Host "   2. Comprobar que ambos usuarios estén en la misma red VPN" -ForegroundColor White
Write-Host "   3. Verificar que no haya reglas de firewall adicionales bloqueando" -ForegroundColor White
Write-Host "   4. Considerar deshabilitar temporalmente el antivirus para pruebas" -ForegroundColor White
Write-Host "   5. Verificar la configuración de enrutamiento en el servidor VPN" -ForegroundColor White

Write-Host ""
Write-Host "🔧 COMANDOS ÚTILES PARA VERIFICACIÓN:" -ForegroundColor Cyan
Write-Host "   # Ver todas las reglas VPN:" -ForegroundColor White
Write-Host "   Get-NetFirewallRule | Where-Object {\$_.DisplayName -like 'VPN-*'}" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Eliminar reglas VPN (si es necesario):" -ForegroundColor White
Write-Host "   Get-NetFirewallRule | Where-Object {\$_.DisplayName -like 'VPN-*'} | Remove-NetFirewallRule" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Verificar estado del firewall:" -ForegroundColor White
Write-Host "   Get-NetFirewallProfile" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Configuración de firewall completada" -ForegroundColor Green
