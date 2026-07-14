import json
import sys

import argostranslate.package
import argostranslate.translate

SUPPORTED_LANGUAGE_CODES = {"en", "zh"}


def get_installed_language(language_code: str):
    return next(
        (
            language
            for language in argostranslate.translate.get_installed_languages()
            if language.code == language_code
        ),
        None,
    )


def ensure_package_available(from_code: str, to_code: str) -> None:
    if from_code not in SUPPORTED_LANGUAGE_CODES:
        raise RuntimeError(f"Unsupported source language: {from_code}")
    if to_code not in SUPPORTED_LANGUAGE_CODES:
        raise RuntimeError(f"Unsupported target language: {to_code}")

    from_language = get_installed_language(from_code)
    to_language = get_installed_language(to_code)

    if from_language and to_language:
        translation = from_language.get_translation(to_language)
        if translation:
            return

    available_packages = argostranslate.package.get_available_packages()
    package = next(
        (
            available_package
            for available_package in available_packages
            if available_package.from_code == from_code and available_package.to_code == to_code
        ),
        None,
    )

    if package is None:
        raise RuntimeError(f"Argos package {from_code}->{to_code} is not available")

    download_path = package.download()
    argostranslate.package.install_from_path(download_path)

    from_language = get_installed_language(from_code)
    to_language = get_installed_language(to_code)

    if from_language is None or to_language is None or from_language.get_translation(to_language) is None:
        raise RuntimeError(f"Argos package {from_code}->{to_code} did not install correctly")


def main() -> None:
    tags = json.loads(sys.argv[1])
    target_language = sys.argv[2]
    source_language = "zh" if target_language == "en" else "en"

    ensure_package_available(source_language, target_language)

    translated_tags = [
        argostranslate.translate.translate(tag, source_language, target_language)
        for tag in tags
    ]

    print(json.dumps({"success": True, "tags": translated_tags}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            json.dumps(
                {"success": False, "tags": [], "error": str(error)},
                ensure_ascii=False,
            )
        )
        sys.exit(1)
