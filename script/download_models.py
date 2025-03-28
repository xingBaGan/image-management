import os
import sys
import requests
from typing import List, Optional
from tqdm import tqdm
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

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

def get_base_url(country_code: str) -> str:
    """
    根据国家代码返回合适的下载基础URL
    """
    if country_code == 'CN':
        return "https://hf-mirror.com/honmo/wd14-collection/resolve/main"
    else:
        return "https://huggingface.co/honmo/wd14-collection/resolve/main"

def download_model(model_name: str, models_dir: str = "models") -> bool:
    """
    根据地区从HuggingFace或HF-Mirror下载模型文件
    
    Args:
        model_name: 模型名称（不包含扩展名）
        models_dir: 模型存储目录
            
    Returns:
        bool: 下载是否成功
    """
    # 使用绝对路径
    models_dir = os.path.abspath(models_dir)
    
    # 确保模型目录存在
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"创建模型目录: {models_dir}")
    
    print(f"使用模型目录: {models_dir}")
    
    # 获取国家代码并选择相应的下载源
    country_code = get_country_code()
    base_url = get_base_url(country_code)
    print(f"当前地区: {country_code}, 使用下载源: {base_url}")
    
    files_to_download = [f"{model_name}.onnx", f"{model_name}.csv"]
    
    # 配置重试策略
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    try:
        for filename in files_to_download:
            model_path = os.path.join(models_dir, filename)
            
            # 如果文件已存在，跳过下载
            if os.path.exists(model_path):
                print(f"文件已存在: {filename}")
                continue
            
            # 下载文件
            url = f"{base_url}/{filename}?download=true"
            print(f"下载文件: {filename}")
            
            response = session.get(url, stream=True, timeout=30)
            if response.status_code == 404:
                print(f"文件不存在: {filename}")
                return False
            
            response.raise_for_status()
            
            # 获取文件大小
            total_size = int(response.headers.get('content-length', 0))
            block_size = 1024  # 1 KB
            
            # 创建进度条
            progress_bar = tqdm(
                total=total_size,
                unit='iB',
                unit_scale=True,
                desc=filename,
                ascii=True  # 使用 ASCII 字符而不是 Unicode 字符
            )
            
            # 保存文件
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(block_size):
                    progress_bar.update(len(chunk))
                    f.write(chunk)
            
            progress_bar.close()
            
            if total_size != 0 and progress_bar.n != total_size:
                print(f"下载错误: {filename} 文件大小不匹配")
                return False
            
            print(f"成功下载: {filename}")
        
        return True
        
    except Exception as e:
        print(f"下载失败: {str(e)}")
        return False

def main():
    # 默认模型
    default_model = "wd-v1-4-moat-tagger-v2"
    
    # 如果提供了命令行参数，使用第一个参数作为模型名称
    model_name = sys.argv[1] if len(sys.argv) > 1 else default_model
    
    print(f"开始下载模型: {model_name}")
    success = download_model(model_name)
    
    if success:
        print("模型下载完成!")
    else:
        print("模型下载失败!")
        sys.exit(1)

if __name__ == "__main__":
    main() 