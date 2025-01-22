from PIL import Image, ImageDraw, ImageFont
import os
from math import sin, cos, pi

def create_gradient_background(size):
    # 创建渐变背景
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # 使用更现代的配色方案
    color1 = (88, 86, 214)  # 深紫色
    color2 = (45, 149, 214)  # 天蓝色
    
    # 创建对角线渐变
    for y in range(size):
        for x in range(size):
            # 计算渐变比例
            ratio = (x + y) / (size * 2)
            # 计算当前位置的颜色
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.point((x, y), fill=(r, g, b, 255))
    
    return image

def create_base_icon(size, text="迹"):
    # 创建基础图像
    image = create_gradient_background(size)
    draw = ImageDraw.Draw(image)
    
    # 计算字体大小（图像大小的50%）
    font_size = int(size * 0.5)
    
    try:
        # 尝试使用系统字体，如果失败则使用默认字体
        font = ImageFont.truetype("msyh.ttc", font_size)  # Windows 微软雅黑
    except:
        try:
            font = ImageFont.truetype("PingFang.ttc", font_size)  # macOS 苹方
        except:
            font = ImageFont.load_default()
    
    # 获取文本大小
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    # 计算文本位置，使其居中
    x = (size - text_width) / 2
    y = (size - text_height) / 2
    
    # 添加白色阴影效果
    shadow_offset = max(1, int(size * 0.01))
    draw.text((x + shadow_offset, y + shadow_offset), text, fill=(255, 255, 255, 100), font=font)
    
    # 绘制主文本（使用白色）
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # 添加圆角
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = int(size * 0.2)  # 圆角半径
    mask_draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius, fill=255)
    
    # 应用圆角
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(image, mask=mask)
    
    return output

def add_shine_effect(image):
    # 添加光泽效果
    size = image.size[0]
    shine = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shine)
    
    # 创建一个从左上到右下的渐变透明效果
    for y in range(size):
        for x in range(size):
            # 计算距离图标中心的距离
            dx = (x - size/2) / (size/2)
            dy = (y - size/2) / (size/2)
            distance = (dx*dx + dy*dy) ** 0.5
            
            # 创建光泽效果
            alpha = int(max(0, min(255, 255 * (1 - distance))))
            if y < size/2:  # 只在上半部分添加光泽
                draw.point((x, y), fill=(255, 255, 255, alpha//4))
    
    # 将光泽效果叠加到原图上
    return Image.alpha_composite(image, shine)

def create_windows_ico():
    # 创建 ICO 文件需要的尺寸
    sizes = [16, 32, 48, 64, 128, 256]
    icons = []
    
    for size in sizes:
        icon = create_base_icon(size)
        if size >= 64:  # 只对较大尺寸添加光泽效果
            icon = add_shine_effect(icon)
        icons.append(icon)
    
    # 确保 build 目录存在
    os.makedirs("build", exist_ok=True)
    
    # 保存为 ICO 文件
    icons[0].save("build/favicon.ico", format="ICO", sizes=[(s, s) for s in sizes], append_images=icons[1:])
    # 同时保存到 public 目录
    os.makedirs("public", exist_ok=True)
    icons[0].save("public/favicon.ico", format="ICO", sizes=[(s, s) for s in sizes], append_images=icons[1:])

def create_mac_icns():
    # 创建 1024x1024 的图标
    icon = create_base_icon(1024)
    icon = add_shine_effect(icon)
    
    # 保存为 PNG，然后可以使用 iconutil 转换为 icns
    os.makedirs("build/icon.iconset", exist_ok=True)
    
    # 创建不同尺寸的图标
    scales = [16, 32, 64, 128, 256, 512, 1024]
    for size in scales:
        resized = icon.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(f"build/icon.iconset/icon_{size}x{size}.png")
        # 对于 @2x 版本
        if size <= 512:
            resized = icon.resize((size * 2, size * 2), Image.Resampling.LANCZOS)
            resized.save(f"build/icon.iconset/icon_{size}x{size}@2x.png")

def create_linux_icons():
    # Linux 需要的尺寸
    sizes = [16, 32, 48, 64, 128, 256, 512]
    
    # 创建 icons 目录
    os.makedirs("build/icons", exist_ok=True)
    
    # 为每个尺寸创建 PNG 文件
    icon = create_base_icon(512)
    icon = add_shine_effect(icon)
    
    for size in sizes:
        resized = icon.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(f"build/icons/{size}x{size}.png")

def main():
    # 创建所有平台的图标
    create_windows_ico()
    create_mac_icns()
    create_linux_icons()
    
    print("图标文件生成完成！")
    print("Windows: build/favicon.ico 和 public/favicon.ico")
    print("macOS: build/icon.iconset/")
    print("Linux: build/icons/")
    print("\n注意：对于 macOS，你需要运行以下命令来生成 .icns 文件：")
    print("iconutil -c icns build/icon.iconset")

if __name__ == "__main__":
    main() 