@echo off
cd /d "%~dp0"
title AI Background Studio - Dev
echo Starting AI Background Studio...
echo.
echo The browser will open at:
echo http://localhost:5173
echo.
npm.cmd run dev -- --open
