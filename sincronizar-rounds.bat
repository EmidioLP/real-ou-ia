@echo off
title REAL OU IA? - sincronizar rodadas
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sincronizar-rounds.ps1"
echo.
pause
