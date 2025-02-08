#!/bin/bash
cd "$(dirname "$0")"

# 检查是否安装了 Python
if ! command -v python3 &> /dev/null; then
    echo "Python3 未安装，正在安装..."
    if command -v brew &> /dev/null; then
        brew install python3
    else
        echo "请先安装 Homebrew，然后重试"
        echo "安装命令: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        read -p "按任意键继续..."
        exit 1
    fi
fi

# 检查是否安装了 pip
if ! command -v pip3 &> /dev/null; then
    echo "pip3 未安装，正在安装..."
    if command -v brew &> /dev/null; then
        brew install python3-pip
    else
        curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
        python3 get-pip.py
        rm get-pip.py
    fi
fi

# 检查是否可以创建虚拟环境
if ! python3 -c "import venv" &> /dev/null; then
    echo "正在安装 venv 模块..."
    if command -v brew &> /dev/null; then
        brew install python3-venv
    else
        pip3 install virtualenv
    fi
fi

# 获取应用程序包内的资源路径
if [[ -d "Image Management.app" ]]; then
    RESOURCES_PATH="Image Management.app/Contents/Resources"
else
    RESOURCES_PATH="resources"
fi

echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r "requirements.txt"
    echo "Environment setup completed successfully!"
else
    echo "Virtual environment already exists."
    source venv/bin/activate
    pip install -r "requirements.txt"
    echo "Dependencies updated successfully!"
fi

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

echo
echo "Installation completed! You can now close this window and start the application."
read -p "Press any key to continue..." 