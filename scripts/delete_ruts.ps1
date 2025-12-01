$ruts = @(
  '16924504-5',
  '16944848-5',
  '18539810-2',
  '18841612-8',
  '20062278-2',
  '20647833-0',
  '26258374-0'
)

foreach($r in $ruts){
  Write-Host "\n--- Deleting: $r ---"
  try{
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/personal-disponible/$r" -Method Delete -ErrorAction Stop
    $json = $res | ConvertTo-Json -Depth 4
    Write-Host $json
  } catch {
    Write-Host ("ERROR deleting " + $r)
    if ($_.Exception -and $_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      Write-Host $reader.ReadToEnd()
    } else {
      Write-Host ($_ | Format-List * -Force | Out-String)
    }
  }
}
