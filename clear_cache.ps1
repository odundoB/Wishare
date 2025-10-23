# VS Code Cache Cleaner Script
# Run this script to clear VS Code cache and fix phantom TypeScript errors

Write-Host "🧹 Clearing VS Code Cache..." -ForegroundColor Yellow

# Clear workspace storage
$workspaceStorage = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $workspaceStorage) {
    Get-ChildItem $workspaceStorage | Where-Object { $_.Name -like "*wioshare*" -or $_.Name -like "*WIOSHARE*" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared workspace storage" -ForegroundColor Green
}

# Clear logs
$logsPath = "$env:APPDATA\Code\logs"
if (Test-Path $logsPath) {
    Remove-Item -Recurse -Force $logsPath -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared logs" -ForegroundColor Green
}

# Clear cached extensions
$cachedExt = "$env:APPDATA\Code\CachedExtensions"
if (Test-Path $cachedExt) {
    Remove-Item -Recurse -Force $cachedExt -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared cached extensions" -ForegroundColor Green
}

# Clear TypeScript cache in project
$tsCache = "c:\Users\user\Desktop\WIOSHARE\frontend\node_modules\.cache"
if (Test-Path $tsCache) {
    Remove-Item -Recurse -Force $tsCache -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared project TypeScript cache" -ForegroundColor Green
}

Write-Host "🎉 Cache clearing complete!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart VS Code" -ForegroundColor White
Write-Host "   2. Open your project" -ForegroundColor White
Write-Host "   3. Press Ctrl+Shift+P and run TypeScript Restart TS Server" -ForegroundColor White