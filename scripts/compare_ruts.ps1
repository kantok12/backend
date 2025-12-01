# compare_ruts.ps1
# Lee temp_ruts_filtered.txt (una columna con RUTs normalizados), obtiene RUTs desde API y escribe los extras en temp_ruts_extras.txt

$inputFile = "temp_ruts_filtered.txt"
$outputFile = "temp_ruts_extras.txt"
$apiUrl = "http://localhost:3000/api/personal-disponible?limit=10000"

if (-not (Test-Path $inputFile)) {
  Write-Error "No se encontró $inputFile"
  exit 1
}

$input = Get-Content $inputFile | ForEach-Object { ($_.Trim() -replace '\.','' -replace '\s','').ToUpper() } | Where-Object { $_ -ne '' } | Select-Object -Unique

try {
  $resp = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop
} catch {
  Write-Error "Error llamando al API: $($_.Exception.Message)"
  exit 2
}

if ($resp.data -and $resp.data.registros) { $dbList = $resp.data.registros } elseif ($resp.registros) { $dbList = $resp.registros } else { Write-Error "Formato de respuesta inesperado"; exit 3 }

$dbRuts = $dbList | ForEach-Object { ($_.rut -replace '\.','' -replace '\s','').ToUpper() } | Select-Object -Unique

$extras = $input | Where-Object { $dbRuts -notcontains $_ } | Select-Object -Unique

$extras | Set-Content $outputFile -Force

Write-Output "Input count: $($input.Count)"
Write-Output "DB count: $($dbRuts.Count)"
Write-Output "Extras count: $($extras.Count)"
Write-Output "Wrote extras to $outputFile"
