# Script para obtener SHA-1 fingerprint para Google Sign In
# Ejecuta este script desde la carpeta raíz del proyecto

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Obteniendo SHA-1 Fingerprint" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio android
Set-Location android

Write-Host "Ejecutando gradlew signingReport..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar signingReport y capturar salida
$output = .\gradlew.bat signingReport 2>&1 | Out-String

# Extraer SHA-1
$sha1Pattern = "SHA1:\s+([A-F0-9:]+)"
$matches = [regex]::Matches($output, $sha1Pattern)

if ($matches.Count -gt 0) {
    Write-Host "✓ SHA-1 Fingerprints encontrados:" -ForegroundColor Green
    Write-Host ""
    
    $debugSHA1 = $null
    $releaseSHA1 = $null
    
    # Buscar debug y release
    foreach ($match in $matches) {
        $sha1 = $match.Groups[1].Value
        
        # Determinar si es debug o release basado en contexto
        $contextStart = [Math]::Max(0, $match.Index - 200)
        $contextLength = [Math]::Min(400, $output.Length - $contextStart)
        $context = $output.Substring($contextStart, $contextLength)
        
        if ($context -match "Variant: debug" -and $null -eq $debugSHA1) {
            $debugSHA1 = $sha1
        } elseif ($context -match "Variant: release" -and $null -eq $releaseSHA1) {
            $releaseSHA1 = $sha1
        }
    }
    
    if ($null -ne $debugSHA1) {
        Write-Host "📱 DEBUG SHA-1 (para desarrollo):" -ForegroundColor Cyan
        Write-Host $debugSHA1 -ForegroundColor White
        Write-Host ""
    }
    
    if ($null -ne $releaseSHA1) {
        Write-Host "🚀 RELEASE SHA-1 (para producción):" -ForegroundColor Magenta
        Write-Host $releaseSHA1 -ForegroundColor White
        Write-Host ""
    }
    
    # Si solo hay uno, mostrarlo
    if ($null -eq $debugSHA1 -and $null -eq $releaseSHA1 -and $matches.Count -gt 0) {
        Write-Host "SHA-1:" -ForegroundColor Cyan
        Write-Host $matches[0].Groups[1].Value -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "  Próximos pasos:" -ForegroundColor Yellow
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Copia el SHA-1 DEBUG (arriba)" -ForegroundColor White
    Write-Host "2. Ve a Firebase Console:" -ForegroundColor White
    Write-Host "   https://console.firebase.google.com/" -ForegroundColor Blue
    Write-Host "3. Selecciona tu proyecto" -ForegroundColor White
    Write-Host "4. Ve a ⚙️ Configuración > Tus apps" -ForegroundColor White
    Write-Host "5. Selecciona la app Android" -ForegroundColor White
    Write-Host "6. Baja a 'Huellas digitales de certificado SHA'" -ForegroundColor White
    Write-Host "7. Haz clic en 'Agregar huella digital'" -ForegroundColor White
    Write-Host "8. Pega el SHA-1 y guarda" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "✗ No se pudo encontrar SHA-1" -ForegroundColor Red
    Write-Host ""
    Write-Host "Salida completa:" -ForegroundColor Yellow
    Write-Host $output
}

# Volver al directorio raíz
Set-Location ..

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
