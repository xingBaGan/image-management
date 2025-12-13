import os
import sys
import json
import io

# 设置标准输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

try:
    from sd_parsers import ParserManager
    from sd_parsers.data import PromptInfo, Sampler
except ImportError as e:
    print(json.dumps({"error": f"Failed to import sd_parsers: {str(e)}. Please install it with: pip install sd-parsers"}))
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "请提供图片路径"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        # 检查文件是否存在
        if not os.path.exists(image_path):
            print(json.dumps({"error": f"图片不存在: {image_path}"}))
            sys.exit(1)
        
        # 创建解析器管理器
        parser_manager = ParserManager()
        
        # 解析图片元数据
        prompt_info = parser_manager.parse(image_path)
        raw_parameters = prompt_info.raw_parameters
        json_string = json.dumps(raw_parameters, ensure_ascii=False, default=str)
        attributes = extract_attributes(json_string, ["ckpt_name"])
        generator = getattr(prompt_info, "generator", None).value
        if prompt_info and generator == "ComfyUI":
            # 将 PromptInfo 对象转换为字典
            try:
                model_info = {}
                if attributes.get("ckpt_name"):
                    model_info["name"] = attributes["ckpt_name"]

                positive_prompt = getattr(prompt_info, "prompts", [])[0]
                positive_prompt_array = getattr(positive_prompt, "value", "").split(',')
                negative_prompt = getattr(prompt_info, "prompts", [])[1]
                negative_prompt_array = getattr(negative_prompt, "value", "").split(',')
                result = {
                    # 1. 生成器信息
                    "generator": generator,

                    # 2. 汇总提示词
                    "positive_prompt": positive_prompt_array,
                    "negative_prompt": negative_prompt_array,
                    "model": model_info or {},
                    # # 5. 采样器详细信息
                    "samplers": [
                        {
                            "name": getattr(s, "name", None),
                            "parameters": getattr(s, "parameters", {}) or {},
                        }
                        for s in getattr(prompt_info, "samplers", [])
                    ],                   
                }
                result.update(attributes)
                try:
                    models = getattr(prompt_info, "models", None)
                except Exception:
                    models = None  # 访问失败就当没有

                if models:
                    # 如果访问成功，再按你需要的结构塞进 result
                    result["models"] = [
                        {
                            "model": getattr(m, "model", None),
                            "parameters": getattr(m, "parameters", {}) or {},
                        }
                        for m in models
                    ]

                with open('result.json', 'w') as f:
                    f.write(json.dumps(result, ensure_ascii=False, default=str))
                print(json.dumps(result, ensure_ascii=False, default=str))
            except Exception:
                # 如果转换失败，返回 null
                print(json.dumps(None))
        elif generator == "AUTOMATIC1111":
            try:
                positive_prompts = getattr(prompt_info, "prompts", []) or []
                positive_prompt_value = (
                    getattr(positive_prompts[0], "value", "") if positive_prompts else ""
                )
                positive_prompt_array = [
                    item.strip() for item in positive_prompt_value.split(",") if item.strip()
                ]

                negative_prompts_attr = getattr(prompt_info, "negative_prompts", []) or []
                if negative_prompts_attr:
                    negative_prompt_value = getattr(negative_prompts_attr[0], "value", "")
                elif len(positive_prompts) > 1:
                    negative_prompt_value = getattr(positive_prompts[1], "value", "")
                else:
                    negative_prompt_value = ""
                negative_prompt_array = [
                    item.strip() for item in negative_prompt_value.split(",") if item.strip()
                ]

                samplers_list = getattr(prompt_info, "samplers", []) or []
                sampler = samplers_list[0] if samplers_list else None
                sampler_name = getattr(sampler, "name", None) if sampler else None
                sampler_params = getattr(sampler, "parameters", {}) or {}
                model_info = getattr(sampler, "model", None) if sampler else None

                result = {
                    "generator": generator,
                    "model": model_info or {},
                    "samplers": {
                        "name": sampler_name,
                        "parameters": sampler_params,
                    },
                    "positive_prompts": positive_prompt_array,
                    "negative_prompts": negative_prompt_array,
                }

                with open('result.json', 'w') as f:
                    f.write(json.dumps(result, ensure_ascii=False, default=str))
                print(json.dumps(result, ensure_ascii=False, default=str))
            except Exception:
                print(json.dumps(None))
        else:
            # 如果没有找到元数据，返回 null
            print(json.dumps(None))
            
    except Exception as e:
        # 如果解析失败，返回 null 而不是抛出错误
        # 这样可以避免影响图片导入流程
        print(json.dumps(None))


# 根据json string提取属性, regex 匹配 key: value 格式
import re

def extract_attributes(json_string, keys: list[str]):
    """Extract the first level of given keys using a non-greedy pattern."""
    attributes: dict[str, str] = {}
    if not keys:
        return attributes

    pattern = r'\\"({})\\":\s*\\"(.*?)\\"'.format('|'.join(map(re.escape, keys)))
    matches = re.findall(pattern, json_string)
    for key, value in matches:
        # Handle double-escaped unicode sequences like \\uXXXX
        cleaned = value.replace("\\\\u", "\\u")
        attributes[key] = cleaned.encode("utf-8").decode("unicode_escape")
    return attributes

if __name__ == "__main__":
    main()

