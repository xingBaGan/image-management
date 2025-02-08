@echo off
cd /d "%~dp0"

REM 检查是否安装了 Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python 未安装，请访问 https://www.python.org/downloads/ 下载并安装 Python
    echo 安装时请确保勾选 "Add Python to PATH"
    pause
    exit /b 1
)

REM 检查 Python 版本
python -c "import sys; sys.exit(0) if sys.version_info >= (3,7) else sys.exit(1)"
if %errorlevel% neq 0 (
    echo 请安装 Python 3.7 或更高版本
    pause
    exit /b 1
)

REM 检查是否安装了 pip
where pip >nul 2>nul
if %errorlevel% neq 0 (
    echo pip 未安装，正在安装...
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python get-pip.py
    del get-pip.py
    if %errorlevel% neq 0 (
        echo pip 安装失败！
        pause
        exit /b 1
    )
)

REM 检查是否可以创建虚拟环境
python -c "import venv" >nul 2>nul
if %errorlevel% neq 0 (
    echo 正在安装 venv 模块...
    python -m pip install --upgrade pip
    pip install virtualenv
    if %errorlevel% neq 0 (
        echo venv 安装失败！
        pause
        exit /b 1
    )
)

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