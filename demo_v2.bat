@echo off
echo ==========================================
echo  AE Automation v2.0 - Agent Demo
echo  IndyDevDan Patterns Integrated
echo ==========================================
echo.

REM Create test environment
echo [1] Creating test environment...
mkdir agents\generated 2>nul

REM Test the agent system
echo [2] Testing agent system...
python agents\base_agent.py

echo.
echo ==========================================
echo  Demo Complete!
echo ==========================================
pause