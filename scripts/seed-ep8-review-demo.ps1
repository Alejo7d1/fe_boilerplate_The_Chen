# scripts/seed-ep8-review-demo.ps1
# Prepara el escenario de EP8 en la API de pruebas para probar H16 a mano.
#
# La API de pruebas no crea clases finalizadas ni registra asistencia, así que el
# script hace el camino real: crea la clase (admin), reserva el cupo (miembro) y
# recién entonces la marca como `Finalizada` (el backend rechaza reservar una
# clase ya finalizada).
#
# Uso:
#   pwsh -File scripts/seed-ep8-review-demo.ps1
#   pwsh -File scripts/seed-ep8-review-demo.ps1 -ApiUrl http://localhost:8000

[CmdletBinding()]
param(
  [string]$ApiUrl = "http://localhost:8000",
  [string]$AdminEmail = "admin@thechen.com",
  [string]$AdminPassword = "admin123",
  [string]$MemberEmail = "miembro.activo@thechen.com",
  [string]$MemberPassword = "member123"
)

$ErrorActionPreference = "Stop"

function Connect-Api([string]$email, [string]$password) {
  $json = @{ email = $email; password = $password } | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method Post `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
    -ContentType "application/json; charset=utf-8"
  return @{ Authorization = "Bearer $($response.token)" }
}

function Invoke-Api([string]$method, [string]$path, $headers, $body) {
  $params = @{
    Uri         = "$ApiUrl$path"
    Method      = $method
    Headers     = $headers
    ContentType = "application/json; charset=utf-8"
  }
  # Windows PowerShell 5.1 envía los cuerpos de texto en ASCII: se fuerzan bytes UTF-8
  # para que los acentos de los nombres lleguen intactos.
  if ($null -ne $body) { $params.Body = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json)) }
  return Invoke-RestMethod @params
}

$today = (Get-Date).ToString("yyyy-MM-dd")
$admin = Connect-Api $AdminEmail $AdminPassword
$member = Connect-Api $MemberEmail $MemberPassword

$trainer = (Invoke-Api "GET" "/api/trainers" $admin $null).data | Select-Object -First 1
if (-not $trainer) { throw "La API no devolvió entrenadores: no se puede crear la clase." }

# Nombre, días hacia atrás y hora de cada clase de demostración.
$scenarios = @(
  @{ Name = "Clase Demo Reseña"; DaysAgo = 2; StartTime = "07:00"; MaxCapacity = 12 },
  @{ Name = "Clase Demo Fuera de Plazo"; DaysAgo = 10; StartTime = "09:00"; MaxCapacity = 12 }
)

foreach ($scenario in $scenarios) {
  $date = (Get-Date).AddDays(-$scenario.DaysAgo).ToString("yyyy-MM-dd")
  $payload = @{
    name            = $scenario.Name
    trainerId       = $trainer.id
    date            = $date
    startTime       = $scenario.StartTime
    durationMinutes = 60
    maxCapacity     = $scenario.MaxCapacity
  }

  $session = Invoke-Api "POST" "/api/classes" $admin $payload
  Invoke-Api "POST" "/api/class-sessions/$($session.id)/reserve" $member $null | Out-Null

  $finalize = $payload.Clone()
  $finalize.status = "Finalizada"
  Invoke-Api "PUT" "/api/classes/$($session.id)" $admin $finalize | Out-Null

  Write-Host "Listo: '$($scenario.Name)' ($date, Finalizada) con reserva activa de $MemberEmail."
}

Write-Host ""
Write-Host "Prueba manual:"
Write-Host "  1. Entra como $MemberEmail / $MemberPassword y abre /reviews."
Write-Host "  2. 'Clase Demo Reseña' debe permitir calificar (estrellas 1-5 + comentario)."
Write-Host "  3. 'Clase Demo Fuera de Plazo' debe mostrar el plazo vencido, sin botón."
Write-Host "  4. Entra como $AdminEmail / $AdminPassword y abre /admin/reports/reviews."
Write-Host ""
Write-Host "Los datos se reinician cuando reinicias el proceso de la API."
