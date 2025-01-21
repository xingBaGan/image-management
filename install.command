#!/bin/bash
cd "$(dirname "$0")"

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
echo "Installation completed! You can now close this window and start the application." 