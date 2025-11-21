$BaseUrl = 'http://localhost:3001'
$ClientId = 28
$Rut = '20.011.078-1'
$AltRut = $Rut -replace '\.', ''

function DoGet($path) {
    $uri = "$BaseUrl$path"
    Write-Host "\n=== GET $uri ==="
    try {
        $r = Invoke-WebRequest -Uri $uri -Method Get -UseBasicParsing -ErrorAction Stop
        Write-Host "Status:" $r.StatusCode
        Write-Host "Body:" $r.Content
    } catch {
        if ($_.Exception.Response) {
            $code = $_.Exception.Response.StatusCode.Value__
            Write-Host "Status (err):" $code
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Body (err):"
            Write-Host $sr.ReadToEnd()
        } else {
            Write-Host "Request failed:" $_.Exception.Message
        }
    }
}

function DoPost($path, $bodyObj) {
    $uri = "$BaseUrl$path"
    Write-Host "\n=== POST $uri ==="
    $body = $bodyObj | ConvertTo-Json
    Write-Host "Request body: $body"
    try {
        $r = Invoke-WebRequest -Uri $uri -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
        Write-Host "Status:" $r.StatusCode
        Write-Host "Body:" $r.Content
    } catch {
        if ($_.Exception.Response) {
            $code = $_.Exception.Response.StatusCode.Value__
            Write-Host "Status (err):" $code
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Body (err):"
            Write-Host $sr.ReadToEnd()
        } else {
            Write-Host "Request failed:" $_.Exception.Message
        }
    }
}

DoGet "/api/prerrequisitos/cliente/$ClientId"
DoPost "/api/prerrequisitos/clientes/$ClientId/match" (@{ ruts = @($Rut,$AltRut) })
DoGet "/api/documentos/persona/$Rut"
DoGet "/api/documentos/persona/$AltRut"
DoGet "/api/prerrequisitos/clientes/$ClientId/cumplen"

Write-Host "\nAll checks done."
