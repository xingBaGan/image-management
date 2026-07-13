import json
import sys

import argostranslate.package
import argostranslate.translate


def ensure_package_available(from_code: str, to_code: str) -> None:
    installed_languages = argostranslate.translate.get_installed_languages()
    from_language = next((language for language in installed_languages if language.code == from_code), None)

    if from_language:
        translation = from_language.get_translation(to_code)
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


def main() -> None:
    tags = json.loads(sys.argv[1])
    target_language = sys.argv[2]

    ensure_package_available("en", target_language)

    translated_tags = [
        argostranslate.translate.translate(tag, "en", target_language)
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
