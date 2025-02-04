from sklearn.cluster import KMeans
import os
import sys
from PIL import Image
import numpy as np


def get_dominant_colors_kmeans(image_path, num_colors=5):
    # 打开图片
    img = Image.open(image_path)
    img = img.convert('RGB')
    
    # 转换为numpy数组
    img_array = np.array(img)
    pixels = img_array.reshape(-1, 3)
    
    # 使用K-means聚类
    kmeans = KMeans(n_clusters=num_colors, random_state=0)
    kmeans.fit(pixels)
    
    # 获取聚类中心（主要颜色）
    colors = kmeans.cluster_centers_
    
    # 计算每个颜色的占比
    labels = kmeans.labels_
    total_pixels = len(pixels)
    color_percentages = []
    
    for i in range(num_colors):
        count = np.sum(labels == i)
        percentage = (count / total_pixels) * 100
        color_percentages.append(percentage)
    
    # 将颜色值转换为整数
    colors = colors.round().astype(int)
    
    # 按照占比排序
    sorted_indices = np.argsort(color_percentages)[::-1]
    colors = colors[sorted_indices]
    color_percentages = [color_percentages[i] for i in sorted_indices]
    
    # 将颜色转换为十六进制格式并添加百分比
    result = []
    for color, percentage in zip(colors, color_percentages):
        hex_color = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
        result.append({
            'color': hex_color,
            'percentage': round(percentage, 2)
        })
    
    return result

def main():
    if len(sys.argv) < 2:
        print("请提供图片路径")
        sys.exit(1)
        
    image_path = sys.argv[1]

    # 确保图片路径存在
    if not os.path.exists(image_path):
        print(f"图片不存在: {image_path}")
        sys.exit(1)
        
    colors = get_dominant_colors_kmeans(image_path, 10)
    print(colors)

if __name__ == "__main__":
    main()

# colors = get_dominant_colors_kmeans("C:\\Users\\jzj\\Pictures\\姿势\\甘雨.png")
# print(colors)
