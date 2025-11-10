<#
  migrate_to_container.ps1
  Usage:
    .\scripts\migrate_to_container.ps1 -DumpPath C:\temp\medusa_dump.sql -Format sql
    .\scripts\migrate_to_container.ps1 -DumpPath C:\temp\medusa_dump.dump -Format custom
#>

param(
  [Parameter(Mandatory=$true)] [string]$DumpPath,
  [ValidateSet('sql','custom')] [string]$Format = 'sql'
)

if (-not (Test-Path $DumpPath)) {
  Write-Error "Dump file not found: $DumpPath"
  exit 1
}

Write-Host "Finding postgres container..."
$containerId = docker compose -f docker-compose.dev.yml ps -q postgres
if (-not $containerId) {
  Write-Error "Postgres container not found. Ensure docker compose is running (docker compose -f docker-compose.dev.yml up -d)"
  exit 1
}

Write-Host "Copying dump into container $containerId..."
docker cp "$DumpPath" "$containerId:/tmp/$(Split-Path $DumpPath -Leaf)"

$remotePath = "/tmp/$(Split-Path $DumpPath -Leaf)"
if ($Format -eq 'sql') {
  Write-Host "Restoring plain SQL dump into database 'medusa' as user 'medusa'..."
  docker compose -f docker-compose.dev.yml exec -T postgres bash -c "psql -U medusa -d medusa -f $remotePath"
} else {
  Write-Host "Restoring custom-format dump into database 'medusa' as user 'medusa'..."
  docker compose -f docker-compose.dev.yml exec -T postgres bash -c "pg_restore --verbose --clean --no-acl --no-owner -U medusa -d medusa $remotePath"
}

Write-Host "Restore finished."
