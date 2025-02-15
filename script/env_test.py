import onnxruntime as ort
import sys
import numpy as np

print(f"Python 版本: {sys.version}")
print(f"ONNX Runtime 版本: {ort.__version__}")
print(f"可用的执行提供程序: {ort.get_available_providers()}")

try:
    # 尝试创建一个使用 CUDA 的会话
    session = ort.InferenceSession(
        r"../models/wd-v1-4-moat-tagger-v2.onnx",  # 替换为实际的模型路径
        providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
    )
    print("成功创建 CUDA 会话")
except Exception as e:
    print(f"创建会话时出错: {str(e)}")