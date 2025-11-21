<#
PowerShell script: check_prereq_for_rut.ps1
Prueba endpoints relacionados a prerrequisitos/documentos para un RUT dado.
Uso:
  pwsh ./scripts/check_prereq_for_rut.ps1 -ClientId 28 -Rut '20.011.078-1' -BaseUrl 'http://localhost:3001'

El script pide un token opcional (si el backend requiere Authorization).
La salida se guarda en `scripts/check_prereq_for_rut_output.txt` en el repo.
#>
param(
    [int]$ClientId = 28,
    [string]$Rut = '20.011.078-1',
    [string]$BaseUrl = 'http://localhost:3001'
)

$OutputFile = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath 'check_prereq_for_rut_output.txt'
"Script started at $(Get-Date -Format o)" | Out-File -FilePath $OutputFile -Encoding utf8
"ClientId: $ClientId, Rut: $Rut, BaseUrl: $BaseUrl" | Out-File -FilePath $OutputFile -Append

# Leer token opcional
$token = Read-Host -Prompt 'Paste Bearer token (or press Enter to skip)'
$headers = @{}
if ($token -and $token.Trim() -ne '') { $headers['Authorization'] = "Bearer $token" }

function Save-Result($label, $status, $content) {
    "--- $label ---" | Out-File -FilePath $OutputFile -Append
    "Status: $status" | Out-File -FilePath $OutputFile -Append
    if ($content) { $content | Out-File -FilePath $OutputFile -Append }
    "" | Out-File -FilePath $OutputFile -Append
}

# Helper to perform GET with robust error capture
function Do-Get($path) {
    $uri = "$BaseUrl$path"
    Write-Host "GET $uri"
    try {
        $resp = Invoke-WebRequest -Uri $uri -Method Get -Headers $headers -UseBasicParsing -ErrorAction Stop
        Save-Result $uri $resp.StatusCode $resp.Content
    } catch {
        $err = $_.Exception.Response
        if ($err -ne $null) {
            $status = $err.StatusCode.Value__
            $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
            $body = $reader.ReadToEnd()
            Save-Result $uri "Error $status" $body
        } else {
            Save-Result $uri "Request failed" $_.Exception.Message
        }
    }
}

# Helper to perform POST
function Do-Post($path, $bodyObj) {
    $uri = "$BaseUrl$path"
    $body = $bodyObj | ConvertTo-Json
    Write-Host "POST $uri -> body: $body"
    try {
        $resp = Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
        Save-Result $uri $resp.StatusCode $resp.Content
    } catch {
        $err = $_.Exception.Response
        if ($err -ne $null) {
            $status = $err.StatusCode.Value__
            $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
            $body = $reader.ReadToEnd()
            Save-Result $uri "Error $status" $body
        } else {
            Save-Result $uri "Request failed" $_.Exception.Message
        }
    }
}

# 1) GET prerrequisitos del cliente
Do-Get "/api/prerrequisitos/cliente/$ClientId"

# 2) POST match con el RUT (formato con puntos y sin puntos)
$normalizedRut = $Rut
$altRut = $Rut -replace '\.', ''
$postBody = @{ ruts = @($normalizedRut, $altRut) }
Do-Post "/api/prerrequisitos/clientes/$ClientId/match" $postBody

# 3) GET documentos de la persona (por rut)
Do-Get "/api/documentos/persona/$normalizedRut"
Do-Get "/api/documentos/persona/$altRut"

# 4) GET cumplen (personas que cumplen)
Do-Get "/api/prerrequisitos/clientes/$ClientId/cumplen"

"Script finished at $(Get-Date -Format o)" | Out-File -FilePath $OutputFile -Append
Write-Host "Done. Output written to $OutputFile"
