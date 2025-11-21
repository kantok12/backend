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
    Log "/prerrequisitos/cliente/$ClienteId ERROR" $_.Exception.Message
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
