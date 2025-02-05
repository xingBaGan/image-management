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
echo Downloading AI model...
python script\download_models.py
if errorlevel 1 (
    echo Model download failed!
    pause
    exit /b 1
)

python script\download_models.py wd-v1-4-convnext-tagger-v2
if errorlevel 1 (
    echo Model download failed!
    pause
    exit /b 1
)

python script\download_models.py wd-v1-4-convnextv2-tagger-v2
if errorlevel 1 (
    echo Model download failed!
    pause
    exit /b 1
)

echo.
echo Installation completed! You can now close this window and start the application.
pause 