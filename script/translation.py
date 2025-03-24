import argostranslate.package
import argostranslate.translate
import sys
import io

# 设置标准输出的编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Find packages https://www.argosopentech.com/argospm/index/

### =====  Argos Translate Node  ===== ###
ALL_CODES = {
    "english": {
        "code": "en",
        "targets": [
            "albanian",
            "arabic",
            "azerbaijani",
            "bengali",
            "bulgarian",
            "catalan",
            "chinese",
            "chinese (traditional)",
            "czech",
            "danish",
            "dutch",
            "esperanto",
            "estonian",
            "finnish",
            "french",
            "german",
            "greek",
            "hebrew",
            "hindi",
            "hungarian",
            "indonesian",
            "irish",
            "italian",
            "japanese",
            "korean",
            "latvian",
            "lithuanian",
            "malay",
            "norwegian",
            "persian",
            "polish",
            "portuguese",
            "romanian",
            "russian",
            "slovak",
            "slovenian",
            "spanish",
            "swedish",
            "tagalog",
            "thai",
            "turkish",
            "ukrainian",
            "urdu",
        ],
    },
    "albanian": {"code": "sq", "targets": ["english"]},
    "arabic": {"code": "ar", "targets": ["english"]},
    "azerbaijani": {"code": "az", "targets": ["english"]},
    "bengali": {"code": "bn", "targets": ["english"]},
    "bulgarian": {"code": "bg", "targets": ["english"]},
    "catalan": {"code": "ca", "targets": ["english"]},
    "chinese": {"code": "zh", "targets": ["english"]},
    "chinese (traditional)": {"code": "zt", "targets": ["english"]},
    "czech": {"code": "cs", "targets": ["english"]},
    "danish": {"code": "da", "targets": ["english"]},
    "dutch": {"code": "nl", "targets": ["english"]},
    "esperanto": {"code": "eo", "targets": ["english"]},
    "estonian": {"code": "et", "targets": ["english"]},
    "finnish": {"code": "fi", "targets": ["english"]},
    "french": {"code": "fr", "targets": ["english"]},
    "german": {"code": "de", "targets": ["english"]},
    "greek": {"code": "el", "targets": ["english"]},
    "hebrew": {"code": "he", "targets": ["english"]},
    "hindi": {"code": "hi", "targets": ["english"]},
    "hungarian": {"code": "hu", "targets": ["english"]},
    "indonesian": {"code": "id", "targets": ["english"]},
    "irish": {"code": "ga", "targets": ["english"]},
    "italian": {"code": "it", "targets": ["english"]},
    "japanese": {"code": "ja", "targets": ["english"]},
    "korean": {"code": "ko", "targets": ["english"]},
    "latvian": {"code": "lv", "targets": ["english"]},
    "lithuanian": {"code": "lt", "targets": ["english"]},
    "malay": {"code": "ms", "targets": ["english"]},
    "norwegian": {"code": "nb", "targets": ["english"]},
    "persian": {"code": "fa", "targets": ["english"]},
    "polish": {"code": "pl", "targets": ["english"]},
    "portuguese": {"code": "pt", "targets": ["english", "spanish"]},
    "romanian": {"code": "ro", "targets": ["english"]},
    "russian": {"code": "ru", "targets": ["english"]},
    "slovak": {"code": "sk", "targets": ["english"]},
    "slovenian": {"code": "sl", "targets": ["english"]},
    "spanish": {"code": "es", "targets": ["english", "portuguese"]},
    "swedish": {"code": "sv", "targets": ["english"]},
    "tagalog": {"code": "tl", "targets": ["english"]},
    "thai": {"code": "th", "targets": ["english"]},
    "turkish": {"code": "tr", "targets": ["english"]},
    "ukrainian": {"code": "uk", "targets": ["english"]},
    "urdu": {"code": "ur", "targets": ["english"]},
}



def installPackages(srcTrans, toTrans="en"):
    argostranslate.package.update_package_index()
    available_packages = argostranslate.package.get_available_packages()
    package_to_install = next(
        filter(
            lambda x: x.from_code == srcTrans and x.to_code == toTrans,
            available_packages,
        )
    )
    argostranslate.package.install_from_path(package_to_install.download())


def preTranslate(prompt, srcTrans, toTrans):
    if prompt and prompt.strip() != "":
        installed_languages = argostranslate.translate.get_installed_languages()

        from_lang = list(filter(lambda x: x.code == srcTrans, installed_languages))[0]
        to_lang = list(filter(lambda x: x.code == toTrans, installed_languages))[0]

        translation = from_lang.get_translation(to_lang)
        translate_text_prompt = translation.translate(prompt)

    return translate_text_prompt if translate_text_prompt and not None else ""


def translate(prompt, srcTrans=None, toTrans="english"):
    translate_text_prompt = ""
    try:
        srcTransCode = ALL_CODES[srcTrans]["code"] if srcTrans is not None else None
        toTransCode = ALL_CODES[toTrans]["code"]
        installPackages(srcTransCode, toTransCode)
        translate_text_prompt = preTranslate(prompt, srcTransCode, toTransCode)

    except Exception as e:
        print(e)
        return "[Error] No translate text!"

    return translate_text_prompt


def argos_translate_text(from_translate, to_translate, text):
    langs_support = ALL_CODES[from_translate]["targets"]
    text_tranlsated = translate(text, from_translate, to_translate)
    return text_tranlsated


def get_all_langs():
    return ALL_CODES["english"]["targets"]

def main():
    if len(sys.argv) < 2:
        print("请提供要翻译的文本")
        sys.exit(1)
    method = sys.argv[1]
    from_translate = "english"
    if method == "translate":
        target_lang = sys.argv[2]
        text = sys.argv[3]
        result = []
        for t in text.split(','):
            item = argos_translate_text(from_translate, target_lang, t)
            result.append(item)
        result = ','.join(result)
        print(result)
    elif method == "get_all_langs":
        print(get_all_langs())
    else:
        print("请提供正确的翻译方法")
        sys.exit(1)
  
if __name__ == "__main__":
    main()