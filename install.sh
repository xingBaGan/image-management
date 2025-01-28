#!/bin/bash
cd "$(dirname "$0")"

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

echo
echo "Installation completed! You can now close this window and start the application."
read -p "Press any key to continue..." 