import os
import sys
import json
import argparse
import requests
from typing import Dict
from tqdm import tqdm
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

MODEL_SOURCES: Dict[str, Dict[str, str]] = {
    "wd-v1-4-moat-tagger-v2": {
        "repo": "honmo/wd14-collection",
        "onnx": "wd-v1-4-moat-tagger-v2.onnx",
        "csv": "wd-v1-4-moat-tagger-v2.csv",
    },
    "wd-v1-4-convnext-tagger-v2": {
        "repo": "honmo/wd14-collection",
        "onnx": "wd-v1-4-convnext-tagger-v2.onnx",
        "csv": "wd-v1-4-convnext-tagger-v2.csv",
    },
    "wd-v1-4-convnextv2-tagger-v2": {
        "repo": "honmo/wd14-collection",
        "onnx": "wd-v1-4-convnextv2-tagger-v2.onnx",
        "csv": "wd-v1-4-convnextv2-tagger-v2.csv",
    },
    "wd-swinv2-tagger-v3": {
        "repo": "SmilingWolf/wd-swinv2-tagger-v3",
        "onnx": "model.onnx",
        "csv": "selected_tags.csv",
    },
    "wd-eva02-large-tagger-v3": {
        "repo": "SmilingWolf/wd-eva02-large-tagger-v3",
        "onnx": "model.onnx",
        "csv": "selected_tags.csv",
    },
}

def get_country_code() -> str:
    """
    获取当前IP所在的国家代码
    Returns:
        str: 国家代码（例如：'CN'）
    """
    try:
        response = requests.get('https://ipapi.co/country/', timeout=5)
        return response.text.strip()
    except:
        # 如果请求失败，默认返回中国
        return 'CN'

def get_base_url(country_code: str, repo: str) -> str:
    """
    根据国家代码返回合适的下载基础URL
    """
    if country_code == 'CN':
        return f"https://hf-mirror.com/{repo}/resolve/main"
    else:
        return f"https://huggingface.co/{repo}/resolve/main"

def get_model_source(model_name: str) -> Dict[str, str]:
    if model_name in MODEL_SOURCES:
        return MODEL_SOURCES[model_name]

    return {
        "repo": "honmo/wd14-collection",
        "onnx": f"{model_name}.onnx",
        "csv": f"{model_name}.csv",
    }

def emit_progress(model_name: str, local_filename: str, percentage: int, status: str) -> None:
    print(json.dumps({
        "event": "download_progress",
        "modelName": model_name,
        "file": local_filename,
        "percentage": percentage,
        "status": status,
    }), flush=True)

def download_model(model_name: str, models_dir: str = "models", progress_json: bool = False) -> bool:
    """
    根据地区从HuggingFace或HF-Mirror下载模型文件
    
    Args:
        model_name: 模型名称（不包含扩展名）
        models_dir: 模型存储目录
            
    Returns:
        bool: 下载是否成功
    """
    models_dir = os.path.abspath(models_dir)

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"创建模型目录: {models_dir}")

    print(f"使用模型目录: {models_dir}")

    country_code = get_country_code()
    model_source = get_model_source(model_name)
    base_url = get_base_url(country_code, model_source["repo"])
    print(f"当前地区: {country_code}, 使用下载源: {base_url}")

    files_to_download = [
        (model_source["onnx"], f"{model_name}.onnx"),
        (model_source["csv"], f"{model_name}.csv"),
    ]

    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))

    try:
        total_files = len(files_to_download)
        for file_index, (remote_filename, local_filename) in enumerate(files_to_download):
            model_path = os.path.join(models_dir, local_filename)

            if os.path.exists(model_path):
                print(f"文件已存在: {local_filename}")
                if progress_json:
                    emit_progress(model_name, local_filename, round(((file_index + 1) / total_files) * 100), "exists")
                continue

            url = f"{base_url}/{remote_filename}?download=true"
            print(f"下载文件: {remote_filename} -> {local_filename}")

            response = session.get(url, stream=True, timeout=30)
            if response.status_code == 404:
                print(f"文件不存在: {remote_filename}")
                return False

            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))
            block_size = 1024

            progress_bar = None if progress_json else tqdm(
                total=total_size,
                unit='iB',
                unit_scale=True,
                desc=local_filename,
                ascii=True
            )

            downloaded = 0
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(block_size):
                    downloaded += len(chunk)
                    if progress_bar:
                        progress_bar.update(len(chunk))
                    if progress_json and total_size > 0:
                        file_progress = downloaded / total_size
                        percentage = round(((file_index + file_progress) / total_files) * 100)
                        emit_progress(model_name, local_filename, percentage, "downloading")
                    f.write(chunk)

            if progress_bar:
                progress_bar.close()

            if total_size != 0 and downloaded != total_size:
                print(f"下载错误: {local_filename} 文件大小不匹配")
                return False

            print(f"成功下载: {local_filename}")
            if progress_json:
                emit_progress(model_name, local_filename, round(((file_index + 1) / total_files) * 100), "complete")

        return True

    except Exception as e:
        print(f"下载失败: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Download WD tagger model files.")
    parser.add_argument("model_name", nargs="?", default="wd-v1-4-moat-tagger-v2")
    parser.add_argument("--models-dir", default="models")
    parser.add_argument("--progress-json", action="store_true")
    args = parser.parse_args()

    default_model = "wd-v1-4-moat-tagger-v2"
    model_name = args.model_name or default_model

    print(f"开始下载模型: {model_name}")
    success = download_model(model_name, models_dir=args.models_dir, progress_json=args.progress_json)

    if success:
        print("模型下载完成!")
    else:
        print("模型下载失败!")
        sys.exit(1)

if __name__ == "__main__":
    main()
