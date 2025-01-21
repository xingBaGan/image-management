@echo off
cd /d "%~dp0"

echo Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    call venv\Scripts\activate
    pip install -r "%~dp0\requirements.txt"
    echo Environment setup completed successfully!
) else (
    echo Virtual environment already exists.
    call venv\Scripts\activate
    pip install -r "%~dp0\requirements.txt"
    echo Dependencies updated successfully!
)

echo.
echo Installation completed! You can now close this window and start the application. 