import os
from datasets import load_dataset
from datasets.utils.logging import set_verbosity_info
import logging

# 设置详细日志
set_verbosity_info()
logging.basicConfig(level=logging.INFO)

size = 20000
def load_and_process_dataset():
    try:
        # 使用 streaming=True 来启用流式加载
        ds = load_dataset(
            "latentcat/animesfw",
            streaming=True,
            split="train"
        )
        
        # 创建保存目录
        save_dir = r"K:\dataset2\animesfw"
        os.makedirs(save_dir, exist_ok=True)
        
        # 使用迭代器处理数据
        for idx, item in enumerate(ds):
            if idx > size:
                break
            try:
                # 获取图片数据
                image = item['image']
                tags = item['tags']
                
                # 过滤掉包含 "nsfw" 的标签
                if "nsfw" in tags:
                    continue
                # 过滤掉包含近似 "breasts" medium breasts 的标签
                if "breasts" in tags or "medium breasts" in tags:
                    continue
                # 保存图片
                image_path = os.path.join(save_dir, f"image_{idx}.jpg")
                image.save(image_path)
                
                # 每100张图片打印进度
                if (idx + 1) % 100 == 0:
                    print(f"已处理 {idx + 1} 张图片")
                    
            except Exception as e:
                print(f"处理第 {idx} 张图片时出错: {str(e)}")
                continue
                
    except Exception as e:
        print(f"加载数据集时出错: {str(e)}")

if __name__ == "__main__":
    load_and_process_dataset()
    print("处理完成！")