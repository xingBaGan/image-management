#!/bin/bash
cd "$(dirname "$0")"

# --------------------------------------------------------
# 1. Check Python environment
# --------------------------------------------------------

echo "Checking Python environment..."

# Check Python3
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Attempting to install..."
    if command -v brew &> /dev/null; then
        brew install python3
    else
        echo "Please install Homebrew first, then retry."
        echo "Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        read -p "Press any key to continue..."
        exit 1
    fi
fi

# Check pip3
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Installing..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
    rm get-pip.py
fi

# Check Python version (>= 3.10)
python3 -c 'import sys as s; s.exit(0) if s.version_info >= (3,10) else s.exit(1)'
if [ $? -ne 0 ]; then
    echo "Please install Python 3.10 or a newer version."
    read -p "Press any key to continue..."
    exit 1
fi

# Check venv module
if ! python3 -c "import venv" &> /dev/null; then
    echo "Installing venv module..."
    pip3 install --upgrade pip
    pip3 install virtualenv
fi

# --------------------------------------------------------
# 2. Create and activate virtual environment, install base deps
# --------------------------------------------------------

echo "Creating virtual environment and installing base dependencies..."

if [ ! -d "venv" ]; then
    echo "Creating new virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r "requirements.txt"
    echo "Base environment setup completed successfully!"
else
    echo "Virtual environment already exists. Activating and updating dependencies..."
    source venv/bin/activate
    pip install -r "requirements.txt"
    echo "Base dependencies updated successfully!"
fi

# --------------------------------------------------------
# 3. Check GPU and install ONNX Runtime and CuPy
# --------------------------------------------------------

echo
echo "Checking for NVIDIA GPU to install optimized libraries..."
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected. Installing ONNX Runtime GPU version and CuPy..."
    pip install onnxruntime-gpu
    if [ $? -ne 0 ]; then
        echo "WARNING: onnxruntime-gpu installation failed. Continuing with CPU version..."
        pip install onnxruntime
    else
        echo "onnxruntime-gpu and CUDA dependencies installed."
    fi

    pip install cupy-cuda12x || echo "WARNING: CuPy installation failed. This might affect performance."
else
    echo "No NVIDIA GPU detected. Installing CPU-only version of ONNX Runtime."
    pip install onnxruntime || echo "INFO: onnxruntime may already be installed. Continuing..."
fi

# --------------------------------------------------------
# 4. Download AI models
# --------------------------------------------------------

echo
echo "Downloading AI model..."
python3 script/download_models.py
if [ $? -ne 0 ]; then
    echo "Model download failed!"
    read -p "Press any key to continue..."
    exit 1
fi

python3 script/download_models.py wd-v1-4-convnext-tagger-v2
if [ $? -ne 0 ]; then
    echo "Model download failed!"
    read -p "Press any key to continue..."
    exit 1
fi

python3 script/download_models.py wd-v1-4-convnextv2-tagger-v2
if [ $? -ne 0 ]; then
    echo "Model download failed!"
    read -p "Press any key to continue..."
    exit 1
fi

# --------------------------------------------------------
# 5. Done
# --------------------------------------------------------

echo
echo "Installation completed! You can now close this window and start the application."
read -p "Press any key to continue..." 