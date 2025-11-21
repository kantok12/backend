param(
    [string]$ApiBase = 'http://localhost:3000/api',
    [int]$ClienteId = 1,
    [string[]]$Ruts = @('16924504-5'),
    [string]$Token = ''
)
Get-Content prereq-integration-output.txt -Raw
param(
    [string]$ApiBase = 'http://localhost:3000/api',
    [int]$ClienteId = 1,
    [string[]]$Ruts = @('16924504-5'),
    [string]$Token = ''
)

function Add-HeaderIfNeeded {
    param($headers)
    if ($Token -and $Token.Trim() -ne '') {
        if (-not $headers) { $headers = @{ } }
        $headers['Authorization'] = "Bearer $Token"
    }
    return $headers
}

$headers = Add-HeaderIfNeeded @{}
$log = @()
function Log($title, $obj) {
    $log += "== $title =="
    if ($null -eq $obj) {
        $log += "(null)"
        return
    }
    try {
        $log += ($obj | ConvertTo-Json -Depth 6)
    } catch {
        $log += "(could not convert to json) $obj"
    }
}

Write-Output "Running prereq integration checks against $ApiBase (ClienteId=$ClienteId, Ruts=$($Ruts -join ','))"

# 1) Health
try {
    $h = Invoke-RestMethod -Uri "$ApiBase/health" -Method Get -Headers $headers -ErrorAction Stop
    Log '/health' $h
} catch {
    Log '/health ERROR' $_.Exception.Message
}

# 2) GET prerrequisitos (correct endpoint: /api/prerrequisitos/cliente/:cliente_id )
try {
    $prGet = Invoke-RestMethod -Uri "$ApiBase/prerrequisitos/cliente/$ClienteId" -Method Get -Headers $headers -ErrorAction Stop
    Log "/prerrequisitos/cliente/$ClienteId" $prGet
} catch {
    Log "/prerrequisitos/cliente/$ClienteId ERROR" $_.Exception.Response.Content.RawContentText 2>$null
}

# 3) POST match
try {
    $payload = @{ ruts = $Ruts; requireAll = $true; includeGlobal = $true } | ConvertTo-Json -Depth 6
    $match = Invoke-RestMethod -Uri "$ApiBase/prerrequisitos/clientes/$ClienteId/match" -Method Post -Body $payload -ContentType 'application/json' -Headers $headers -ErrorAction Stop
    Log "/prerrequisitos/clientes/$ClienteId/match" $match
} catch {
    Log "/prerrequisitos/clientes/$ClienteId/match ERROR" $_.Exception.Message
}

# 4) GET documentos por RUT (usar primera rut si hay array)
try {
    $firstRut = $Ruts[0]
    $docs = Invoke-RestMethod -Uri "$ApiBase/documentos/persona/$firstRut" -Method Get -Headers $headers -ErrorAction Stop
    Log "/documentos/persona/$firstRut" $docs
} catch {
    Log "/documentos/persona/$firstRut ERROR" $_.Exception.Message
}

# 5) GET cumplen
try {
    $cumplen = Invoke-RestMethod -Uri "$ApiBase/prerrequisitos/clientes/$ClienteId/cumplen?includeGlobal=true&limit=500" -Method Get -Headers $headers -ErrorAction Stop
    Log "/prerrequisitos/clientes/$ClienteId/cumplen" $cumplen
} catch {
    Log "/prerrequisitos/clientes/$ClienteId/cumplen ERROR" $_.Exception.Message
}

# Write to file and also print
$outFile = Join-Path -Path (Get-Location) -ChildPath 'prereq-integration-output.txt'
$log | Out-File -FilePath $outFile -Encoding utf8
Write-Output "WROTE $outFile"
Get-Content -Path $outFile -Raw
param(
  [string]$ApiBase = 'http://localhost:3000/api',
  [int]$ClienteId = 1,
  [string]$Rut = '16924504-5',
  [string]$Token = ''
)

function Invoke($method, $uri, $body = $null) {
  $headers = @{}
  if ($Token -and $Token.Trim().Length -gt 0) {
    $headers['Authorization'] = "Bearer $Token"
  }
  try {
    if ($method -eq 'GET') {
      return Invoke-RestMethod -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
    } elseif ($method -eq 'POST') {
      return Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body ($body | ConvertTo-Json -Depth 6) -ContentType 'application/json' -ErrorAction Stop
    } else {
      throw "Unsupported method: $method"
    }
  } catch {
    return @{ error = $_.Exception.Message }
  }
}

$log = @()
$log += "== Script de integración de prerrequisitos =="
$log += "ApiBase: $ApiBase"
$log += "ClienteId: $ClienteId"
$log += "Rut: $Rut"
$log += "Token: " + (if ($Token) { 'PROVIDED' } else { 'NONE' })

# /health
$log += "`n== /health =="
$health = Invoke 'GET' ("$ApiBase/health")
$log += (if ($health.error) { "HEALTH ERROR: $($health.error)" } else { ($health | ConvertTo-Json -Depth 6) })

# GET prerrequisitos (nota: ruta es singular 'cliente')
$log += "`n== GET /api/prerrequisitos/cliente/$ClienteId =="
$pr = Invoke 'GET' ("$ApiBase/prerrequisitos/cliente/$ClienteId")
$log += (if ($pr.error) { "PREREQ GET ERROR: $($pr.error)" } else { ($pr | ConvertTo-Json -Depth 6) })

# POST match (batch)
$log += "`n== POST /api/prerrequisitos/clientes/$ClienteId/match =="
$payload = @{ ruts = @($Rut); requireAll = $true; includeGlobal = $true }
$match = Invoke 'POST' ("$ApiBase/prerrequisitos/clientes/$ClienteId/match") $payload
$log += (if ($match.error) { "PREREQ MATCH ERROR: $($match.error)" } else { ($match | ConvertTo-Json -Depth 6) })

# GET documentos por RUT
$log += "`n== GET /api/documentos/persona/$Rut =="
$docs = Invoke 'GET' ("$ApiBase/documentos/persona/$Rut")
$log += (if ($docs.error) { "DOCUMENTS ERROR: $($docs.error)" } else { ($docs | ConvertTo-Json -Depth 6) })

# Output
$log | Out-File prereq-integration-output.txt -Encoding utf8
Write-Output "WROTE prereq-integration-output.txt"
Get-Content prereq-integration-output.txt -Raw
