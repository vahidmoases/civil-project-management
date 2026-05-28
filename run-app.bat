@echo off
title Flowza Civil System
echo Loading database and starting server offline...
start /b npm run dev -- --webpack
timeout /t 4 >nul
start http://localhost:3000/invoices
exit