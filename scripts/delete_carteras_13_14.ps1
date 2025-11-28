<#
Interactive deletion script for carteras 13 and 14.
It performs backups (via psql \copy), shows dry-run counts, asks for explicit confirmation,
and if confirmed runs the transactional delete using the SQL file at
`scripts/sql/cascade_delete_carteras_13_14.sql`.

USAGE:
  1) Edit the connection variables below (Host, User, Db, PsqlPath, Password).
  2) From PowerShell run (if needed allow execution):
       Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
     then:
       .\scripts\delete_carteras_13_14.ps1

WARNING: This will permanently delete rows. Make sure backups complete successfully.
#>

param()

# --- Configuration: edit these before running ---
$PsqlPath = 'C:\Program Files\PostgreSQL\14\bin\psql.exe'    # full path to psql.exe
$Host = 'mydb.example.com'
$User = 'dbuser'
$Db = 'mydb'
$Password = 'Belray0108'   # consider prompting instead of hardcoding
$Carteras = '13,14'
$SqlFile = '.\\scripts\\sql\\cascade_delete_carteras_13_14.sql'

function Run-PsqlCommand {
    param(
        [string]$Command
    )
    $env:PGPASSWORD = $Password
    try {
        & $PsqlPath -h $Host -U $User -d $Db -c $Command
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Run-PsqlFile {
    param(
        [string]$FilePath
    )
    $env:PGPASSWORD = $Password
    try {
        & $PsqlPath -h $Host -U $User -d $Db -f $FilePath
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

Write-Host "Using psql at: $PsqlPath"
Write-Host "Target carteras: $Carteras"

if (-not (Test-Path $PsqlPath)) {
    Write-Error "psql not found at path: $PsqlPath. Update the variable at top of this script."
    exit 1
}

Write-Host "1) Dry-run counts (how many rows will be affected):" -ForegroundColor Cyan
Run-PsqlCommand "SELECT 'nodos_to_delete' AS what, COUNT(*) FROM servicios.nodos n WHERE n.cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN ($Carteras));"
Run-PsqlCommand "SELECT 'clientes_to_delete' AS what, COUNT(*) FROM servicios.clientes WHERE cartera_id IN ($Carteras);"
Run-PsqlCommand "SELECT 'carteras_to_delete' AS what, COUNT(*) FROM servicios.carteras WHERE id IN ($Carteras);"

Write-Host "\n2) Running backups (writing CSV files to C:\temp)" -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $Password
    & $PsqlPath -h $Host -U $User -d $Db -c "\copy (SELECT * FROM servicios.carteras WHERE id IN ($Carteras)) TO 'C:\\temp\\carteras_backup_13_14.csv' CSV HEADER"
    & $PsqlPath -h $Host -U $User -d $Db -c "\copy (SELECT * FROM servicios.clientes WHERE cartera_id IN ($Carteras)) TO 'C:\\temp\\clientes_cartera_13_14_backup.csv' CSV HEADER"
    & $PsqlPath -h $Host -U $User -d $Db -c "\copy (SELECT * FROM servicios.nodos WHERE cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN ($Carteras))) TO 'C:\\temp\\nodos_carteras_13_14_backup.csv' CSV HEADER"
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Backups attempted. Please verify the files in C:\temp before proceeding." -ForegroundColor Yellow

$confirm = Read-Host "Type YES to proceed with permanent deletion of nodes->clients->carteras"
if ($confirm -ne 'YES') {
    Write-Host "Aborting — no destructive actions performed." -ForegroundColor Green
    exit 0
}

Write-Host "Executing deletion transaction file: $SqlFile" -ForegroundColor Red
Run-PsqlFile $SqlFile

Write-Host "Done. Run the post-check queries to verify no rows remain." -ForegroundColor Green
Run-PsqlCommand "SELECT COUNT(*) AS remaining_carteras FROM servicios.carteras WHERE id IN ($Carteras);"
Run-PsqlCommand "SELECT COUNT(*) AS remaining_clientes FROM servicios.clientes WHERE cartera_id IN ($Carteras);"
Run-PsqlCommand "SELECT COUNT(*) AS remaining_nodos FROM servicios.nodos WHERE cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN ($Carteras));"

Write-Host "If everything looks good, consider vacuuming affected tables later." -ForegroundColor Cyan
