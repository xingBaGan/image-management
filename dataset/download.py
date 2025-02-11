import os
from datasets import load_dataset, load_from_disk
from datasets.download.download_config import DownloadConfig

# 设置下载缓存目录
cache_dir = r"K:\dataset\.cache"

# 创建保存目录
save_dir = r"K:\dataset\animesfw"

os.makedirs(save_dir, exist_ok=True)

# 加载数据集
ds = load_dataset("latentcat/animesfw", data_dir=r"K:\dataset")


# 加载数据集
# ds = load_from_disk(dataset_path=os.path.join(r"K:\dataset", "data"))


# 遍历数据集并保存图片
for idx, item in enumerate(ds['train']):
    # 获取图片数据
    image = item['image']
    # 保存图片
    image_path = os.path.join(save_dir, f"image_{idx}.jpg")
    image.save(image_path)
    
    # 每100张图片打印进度
    if (idx + 1) % 100 == 0:
        print(f"已下载 {idx + 1} 张图片")

print("下载完成！")