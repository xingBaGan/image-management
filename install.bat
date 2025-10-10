@echo off
cd /d "%~dp0"

REM --------------------------------------------------------
REM --- 1. Check Python environment ---
REM --------------------------------------------------------

echo Checking Python environment...

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python is not installed. Please download and install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Check Python version (requires 3.10 or newer)
python -c "import sys; sys.exit(0) if sys.version_info >= (3,10) else sys.exit(1)"
if %errorlevel% neq 0 (
    echo Please install Python 3.10 or a newer version.
    pause
    exit /b 1
)

REM Check if pip is installed
where pip >nul 2>nul
if %errorlevel% neq 0 (
    echo pip is not installed. Please check your environment variables.
    pause
    exit /b 1
)

REM --------------------------------------------------------
REM --- 2. Create and activate virtual environment, install base dependencies ---
REM --------------------------------------------------------

echo Creating virtual environment and installing base dependencies...

REM Check if venv module is available
python -c "import venv" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing venv module...
    python -m pip install --upgrade pip
    pip install virtualenv
    if %errorlevel% neq 0 (
        REM Re-run pip install and capture output to detect real errors vs satisfied
        pip install onnxruntime 2>&1 | findstr /i "ERROR"
        if %errorlevel% equ 0 (
            echo ERROR: onnxruntime CPU version installation failed!
            pause
            exit /b 1
        ) else (
            REM Assume non-zero exit code due to "Requirement already satisfied"
            echo ONNX Runtime CPU version is already installed or minor warning occurred. Continuing...
        )
    )
)

if not exist "venv" (
    echo Creating new virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r "%~dp0\requirements.txt"
    echo Base environment setup completed successfully!
) else (
    echo Virtual environment already exists. Activating and updating dependencies...
    call venv\Scripts\activate
    pip install -r "%~dp0\requirements.txt"
    echo Base dependencies updated successfully!
)

REM --------------------------------------------------------
REM --- 3. Check GPU and install ONNX Runtime and CuPy ---
REM --------------------------------------------------------

echo.
echo Checking for NVIDIA GPU to install optimized libraries...
where nvidia-smi >nul 2>nul
if %errorlevel% equ 0 (
    echo NVIDIA GPU detected. Installing ONNX Runtime GPU version and CuPy...

    REM Install ONNX Runtime GPU version (adjust version if needed)
    REM Note: you may need to change version to match your environment
    pip install onnxruntime-gpu
    if %errorlevel% neq 0 (
        echo WARNING: onnxruntime-gpu installation failed. Continuing with CPU version...
        pip install onnxruntime
    ) else (
        echo onnxruntime-gpu and CUDA dependencies installed.
    )

    REM Install CuPy (CUDA 12.x build)
    pip install cupy-cuda12x
    if %errorlevel% neq 0 (
        echo WARNING: CuPy installation failed. This might affect performance.
    )

) else (
    echo No NVIDIA GPU detected. Installing CPU-only version of ONNX Runtime.

    REM Install CPU-only version
    pip install onnxruntime
    if %errorlevel% neq 0 (
        REM Re-run pip install and capture output to detect real errors vs satisfied
        pip install onnxruntime 2>&1 | findstr /i "ERROR"
        if %errorlevel% equ 0 (
            echo ERROR: onnxruntime CPU version installation failed!
            pause
            exit /b 1
        ) else (
            REM Assume non-zero exit code due to "Requirement already satisfied"
            echo ONNX Runtime CPU version is already installed or minor warning occurred. Continuing...
        )
    )
)

REM --------------------------------------------------------
REM --- 4. Download AI models ---
REM --------------------------------------------------------

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

REM --------------------------------------------------------
REM --- 5. Done ---
REM --------------------------------------------------------

echo.
echo Installation completed! You can now close this window and start the application.
pause