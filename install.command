#!/bin/bash
cd "$(dirname "$0")"

# --------------------------------------------------------
# 1. Check Python environment and ensure compatibility with onnxruntime
# --------------------------------------------------------

echo "Checking Python environment..."

# Function to find or install a compatible Python version (<= 3.13)
find_compatible_python() {
    # Try Python 3.13 first
    if command -v python3.13 &> /dev/null; then
        echo "python3.13"
        return 0
    fi
    
    # Try Python 3.12 if 3.13 not available
    if command -v python3.12 &> /dev/null; then
        echo "python3.12"
        return 0
    fi
    
    # Try Python 3.11 if 3.12 not available
    if command -v python3.11 &> /dev/null; then
        echo "python3.11"
        return 0
    fi
    
    # Check if we're on macOS
    if [ "$(uname)" = "Darwin" ]; then
        # If no compatible version found, install Python 3.13 using Homebrew
        echo "No compatible Python version found. Installing Python 3.13..."
        
        # Check if Homebrew is installed
        if ! command -v brew &> /dev/null; then
            echo "ERROR: Homebrew is not installed. Please install Homebrew first: https://brew.sh/"
            return 1
        fi
        
        # Install Python 3.13 with verbose output to show progress
        brew install --verbose python@3.13
        if [ $? -eq 0 ]; then
            # Add brew Python to PATH for this session
            export PATH="/usr/local/opt/python@3.13/bin:$PATH"
            echo "python3.13"
            return 0
        else
            echo "ERROR: Homebrew installation of Python 3.13 failed."
            return 1
        fi
    else
        # For non-macOS systems, just inform the user
        echo "ERROR: No compatible Python version found. Please install Python 3.11, 3.12, or 3.13 manually."
        return 1
    fi
}

# Find or install compatible Python version
COMPATIBLE_PYTHON=$(find_compatible_python)
if [ $? -ne 0 ]; then
    read -p "Press any key to continue..."
    exit 1
fi

# Get corresponding pip command
COMPATIBLE_PIP=$(echo $COMPATIBLE_PYTHON | sed 's/python/pip/')

echo "Using compatible Python: $($COMPATIBLE_PYTHON --version)"
echo "Using corresponding pip: $($COMPATIBLE_PIP --version)"

# Check pip for compatible Python
if ! command -v $COMPATIBLE_PIP &> /dev/null; then
    echo "pip for $COMPATIBLE_PYTHON is not installed. Installing..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    $COMPATIBLE_PYTHON get-pip.py
    rm get-pip.py
fi

# Check venv module for compatible Python
if ! $COMPATIBLE_PYTHON -c "import venv" &> /dev/null; then
    echo "Installing venv module for $COMPATIBLE_PYTHON..."
    $COMPATIBLE_PIP install --upgrade pip
    $COMPATIBLE_PIP install virtualenv
fi

# --------------------------------------------------------
# 2. Create and activate virtual environment, install base deps
# --------------------------------------------------------

echo "Creating virtual environment and installing base dependencies..."

# Check if existing venv uses compatible Python version
VENV_USABLE=false
if [ -d "venv" ]; then
    VENV_PYTHON_VERSION=$(venv/bin/python --version 2>&1)
    if echo "$VENV_PYTHON_VERSION" | grep -q "3.1[1-3]"; then
        echo "Existing virtual environment uses compatible Python version: $VENV_PYTHON_VERSION"
        VENV_USABLE=true
    else
        echo "Existing virtual environment uses incompatible Python version: $VENV_PYTHON_VERSION"
        echo "Removing and creating new virtual environment..."
        rm -rf venv
    fi
fi

# Create virtual environment if not exists or not usable
if [ "$VENV_USABLE" = false ]; then
    echo "Creating new virtual environment with $COMPATIBLE_PYTHON..."
    $COMPATIBLE_PYTHON -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment with $COMPATIBLE_PYTHON"
        read -p "Press any key to continue..."
        exit 1
    fi
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
echo "Activated virtual environment: $(python --version)"
pip install --upgrade pip
pip install -r "requirements.txt"
echo "Base dependencies installed successfully!"

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

# Ensure we're using the virtual environment's Python for model downloads
source venv/bin/activate

python script/download_models.py
if [ $? -ne 0 ]; then
    echo "Model download failed!"
    read -p "Press any key to continue..."
    exit 1
fi

python script/download_models.py wd-v1-4-convnext-tagger-v2
if [ $? -ne 0 ]; then
    echo "Model download failed!"
    read -p "Press any key to continue..."
    exit 1
fi

python script/download_models.py wd-v1-4-convnextv2-tagger-v2
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