#!/bin/bash
cd "$(dirname "$0")"

# 检查是否安装了 Python
if ! command -v python3 &> /dev/null; then
    echo "Python3 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3
    elif command -v brew &> /dev/null; then
        brew install python3
    else
        echo "无法自动安装 Python3，请手动安装后重试"
        read -p "按任意键继续..."
        exit 1
    fi
fi

# 检查是否安装了 pip
if ! command -v pip3 &> /dev/null; then
    echo "pip3 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3-pip
    elif command -v brew &> /dev/null; then
        curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
        python3 get-pip.py
        rm get-pip.py
    else
        echo "无法自动安装 pip3，请手动安装后重试"
        read -p "按任意键继续..."
        exit 1
    fi
fi

# 检查是否安装了 python3-venv
if command -v apt-get &> /dev/null; then
    if ! dpkg -l | grep -q python3-venv; then
        echo "正在安装 python3-venv..."
        sudo apt-get update
        sudo apt-get install -y python3-venv
    fi
elif command -v yum &> /dev/null; then
    if ! rpm -qa | grep -q python3-venv; then
        echo "正在安装 python3-venv..."
        sudo yum install -y python3-venv
    fi
fi

# 获取资源路径
RESOURCES_PATH="resources"
if [[ -f "Image Management.AppImage" ]]; then
    # AppImage运行时会自动挂载到/tmp/.mount_*目录
    MOUNT_PATH=$(mount | grep "Image Management.AppImage" | cut -d' ' -f3)
    if [[ ! -z "$MOUNT_PATH" ]]; then
        RESOURCES_PATH="$MOUNT_PATH/resources"
    fi
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