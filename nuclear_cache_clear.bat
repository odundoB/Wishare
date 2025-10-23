@echo off
echo 🧹 Nuclear VS Code Cache Clear...

REM Kill any running VS Code processes
taskkill /f /im "Code.exe" >nul 2>&1

REM Clear all VS Code caches
echo Clearing VS Code workspace storage...
rmdir /s /q "%APPDATA%\Code\User\workspaceStorage" >nul 2>&1

echo Clearing VS Code logs...
rmdir /s /q "%APPDATA%\Code\logs" >nul 2>&1

echo Clearing VS Code cached extensions...
rmdir /s /q "%APPDATA%\Code\CachedExtensions" >nul 2>&1

echo Clearing VS Code extension host cache...
rmdir /s /q "%APPDATA%\Code\User\globalStorage" >nul 2>&1

REM Clear project caches
echo Clearing project VS Code settings...
rmdir /s /q ".vscode" >nul 2>&1

echo Clearing Vite cache...
rmdir /s /q "frontend\node_modules\.vite" >nul 2>&1

echo Clearing Node cache...
rmdir /s /q "frontend\node_modules\.cache" >nul 2>&1

echo ✅ All caches cleared!
echo.
echo 📝 Next steps:
echo 1. Restart VS Code
echo 2. Open your project
echo 3. Press Ctrl+Shift+P and run "TypeScript: Restart TS Server"
echo.
pause