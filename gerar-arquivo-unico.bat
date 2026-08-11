@echo off
title REAL OU IA? - gerar arquivo unico
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gerar-arquivo-unico.ps1"
echo.
pause
