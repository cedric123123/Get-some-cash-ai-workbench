@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [搞钱事务所] 未检测到 Node.js。
  echo 请先安装 Node.js 18 或更高版本，然后重新运行此文件。
  pause
  exit /b 1
)

start "搞钱事务所" http://127.0.0.1:4173
node server.js
