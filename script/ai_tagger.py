import os
import csv
import numpy as np
import sys
import io
from PIL import Image
from typing import List, Tuple

# Safe import for onnxruntime with actionable error message
try:
    import onnxruntime as ort
except Exception as import_error:  # noqa: F401
    ort = None

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

class AITagger:
    def __init__(self, models_dir: str = "models"):
        """
        Initialize AI image tagger
        
        Args:
            models_dir: Directory to store model files
        """
        # Use absolute path for model directory
        self.models_dir = os.path.abspath(models_dir)
        
        # Validate onnxruntime availability early with helpful guidance
        if ort is None:
            raise RuntimeError(
                "Failed to import onnxruntime. Ensure your Python (64-bit) matches the installed onnxruntime, "
                "and that the Microsoft Visual C++ Redistributable is installed. On Windows, prefer 'onnxruntime' "
                "for CPU or 'onnxruntime-gpu' for CUDA builds."
            )
        
        # Dynamically detect available providers and prefer GPU/accelerated backends when present
        available = set(ort.get_available_providers())
        preferred_order = ["CUDAExecutionProvider", "DmlExecutionProvider", "CPUExecutionProvider"]
        self.providers = [p for p in preferred_order if p in available]
        if not self.providers:
            raise RuntimeError(
                f"No ONNX Runtime execution providers are available. Detected: {list(available)}"
            )
        
        # Ensure model directory exists
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)
            print(f"创建模型目录: {self.models_dir}")
        
        print(f"使用模型目录: {self.models_dir}")
            
        # 默认配置
        self.defaults = {
            "model": "wd-v1-4-moat-tagger-v2",
            "threshold": 0.35,
            "character_threshold": 0.85,
            "replace_underscore": False,
            "trailing_comma": False,
            "exclude_tags": ""
        }

    def get_available_models(self) -> List[str]:
        """获取可用的模型列表"""
        models = []
        for f in os.listdir(self.models_dir):
            if f.endswith(".onnx"):
                model_name = os.path.splitext(f)[0]
                if os.path.exists(os.path.join(self.models_dir, f"{model_name}.csv")):
                    models.append(model_name)
        return models

    def resize_image_if_needed(self, image, max_size=2048):
        """
        如果图片太大，将其缩放到合适大小
        """
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(x * ratio) for x in image.size)
            return image.resize(new_size, Image.LANCZOS)
        return image

    def tag_image(self, 
                 image_path: str,
                 model_name: str = None,
                 threshold: float = None,
                 character_threshold: float = None,
                 exclude_tags: str = None,
                 replace_underscore: bool = None,
                 trailing_comma: bool = None
                 ) -> Tuple[List[Tuple[str, float]], str]:
        """
        为图片打标签
        
        Args:
            image_path: 图片路径
            model_name: 模型名称,默认使用self.defaults["model"]
            threshold: 普通标签阈值,默认使用self.defaults["threshold"] 
            character_threshold: 角色标签阈值,默认使用self.defaults["character_threshold"]
            exclude_tags: 排除的标签,默认使用self.defaults["exclude_tags"]
            replace_underscore: 是否替换下划线,默认使用self.defaults["replace_underscore"]
            trailing_comma: 是否添加尾随逗号,默认使用self.defaults["trailing_comma"]
            
        Returns:
            (tags_with_scores, tags_text): 包含(标签,置信度)的列表和格式化后的标签文本
        """
        # 使用默认值
        model_name = model_name or self.defaults["model"]
        threshold = threshold or self.defaults["threshold"]
        character_threshold = character_threshold or self.defaults["character_threshold"]
        exclude_tags = exclude_tags or self.defaults["exclude_tags"]
        replace_underscore = replace_underscore if replace_underscore is not None else self.defaults["replace_underscore"]
        trailing_comma = trailing_comma if trailing_comma is not None else self.defaults["trailing_comma"]

        # Load model
        model_path = os.path.join(self.models_dir, f"{model_name}.onnx")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"模型文件不存在: {model_path}")
            
        # Validate file size
        if os.path.getsize(model_path) == 0:
            raise ValueError(f"模型文件损坏或为空: {model_path}")
            
        try:
            model = ort.InferenceSession(model_path, providers=self.providers)
        except Exception as e:
            # Retry with CPU as a fallback if available and not already used
            try:
                if "CPUExecutionProvider" in ort.get_available_providers() and self.providers != ["CPUExecutionProvider"]:
                    model = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
                else:
                    raise
            except Exception:
                raise RuntimeError(
                    "加载模型失败: "
                    + str(e)
                    + " | 提示: 检查 onnxruntime 安装是否匹配当前环境 (Python 位数/版本), 并确认 GPU 依赖 (如 CUDA/cuDNN 或 DML) 已正确安装。"
                )
        
        # 加载和预处理图片
        image = Image.open(image_path)
        image = self.resize_image_if_needed(image)
        input_name = model.get_inputs()[0].name
        height = model.get_inputs()[0].shape[1]
        
        # 调整图片大小并填充
        ratio = float(height)/max(image.size)
        new_size = tuple([int(x*ratio) for x in image.size])
        image = image.resize(new_size, Image.LANCZOS)
        square = Image.new("RGB", (height, height), (255, 255, 255))
        square.paste(image, ((height-new_size[0])//2, (height-new_size[1])//2))
        
        # 转换为模型输入格式
        image = np.array(square).astype(np.float32)
        image = image[:, :, ::-1]  # RGB -> BGR
        image = np.expand_dims(image, 0)

        # 读取标签
        tags = []
        general_index = None
        character_index = None
        
        with open(os.path.join(self.models_dir, f"{model_name}.csv")) as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                if general_index is None and row[2] == "0":
                    general_index = reader.line_num - 2
                elif character_index is None and row[2] == "4":
                    character_index = reader.line_num - 2
                if replace_underscore:
                    tags.append(row[1].replace("_", " "))
                else:
                    tags.append(row[1])

        # 运行推理
        label_name = model.get_outputs()[0].name
        probs = model.run([label_name], {input_name: image})[0]
        
        # 处理结果
        result = list(zip(tags, probs[0]))
        general = [item for item in result[general_index:character_index] if item[1] > threshold]
        character = [item for item in result[character_index:] if item[1] > character_threshold]
        
        all_tags = character + general
        
        # 排除指定标签
        if exclude_tags:
            remove = [s.strip() for s in exclude_tags.lower().split(",")]
            all_tags = [tag for tag in all_tags if tag[0] not in remove]
            
        # 格式化输出文本
        tags_text = ("" if trailing_comma else ", ").join(
            (item[0].replace("(", "\\(").replace(")", "\\)") + 
             (", " if trailing_comma else "") for item in all_tags)
        )
        
        return all_tags, tags_text 
    
    
def main():
    if len(sys.argv) < 2:
        print("error:请提供图片路径")
        sys.exit(1)
        
    image_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "wd-v1-4-moat-tagger-v2"
    model_dir_path = sys.argv[3] if len(sys.argv) > 3 else "models"
    
    try:
        tagger = AITagger(model_dir_path)
        # 确保图片路径存在
        if not os.path.exists(image_path):
            print(f"error:图片不存在: {image_path}")
            sys.exit(1)
            
        print(f"处理图片: {image_path}")
        tags, tags_text = tagger.tag_image(image_path, model_name=model_name)
        print(tags_text)
    except Exception as e:
        print(f"error:{str(e)}")
        sys.exit(1)


def test_tag_image(image_path):
    tagger = AITagger('models')
    tags, tags_text = tagger.tag_image(image_path, "wd-v1-4-moat-tagger-v2")
    print(tags_text)

def multi_tag_image():
    dir_path = r"K:\dataset2\animesfw"
    files = [os.path.join(dir_path, file) for file in os.listdir(dir_path)[:100] if file.endswith(".jpg") or file.endswith(".png")]
    
    from multiprocessing import Pool
    with Pool(processes=10) as pool:
        pool.map(test_tag_image, files)

if __name__ == "__main__":
    # multi_tag_image()
    main()