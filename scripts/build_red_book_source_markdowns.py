import json
import os

materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\red-book'
root_materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials'

manifest_path = os.path.join(materials_dir, 'manifest.json')

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# 1. Build Pure English Complete Book Markdown
en_lines = []
en_lines.append(f"# {manifest['title']}\n")
en_lines.append(f"> **Author**: {manifest['author']}  \n")
en_lines.append(f"> **Publication Year**: {manifest['year']}  \n")
en_lines.append(f"> **PDF Total Pages**: {manifest['pdfTotalPages']} Pages  \n")
en_lines.append(f"> **Description**: {manifest['description']}  \n")
en_lines.append("\n---\n")

en_lines.append("## Table of Contents\n")
for sec in manifest['sections']:
    idx = sec['chapterIndex']
    en_lines.append(f"- [{sec['enTitle']}](#chapter-{idx:02d})")

en_lines.append("\n---\n")

for sec in manifest['sections']:
    idx = sec['chapterIndex']
    en_lines.append(f"\n<a id='chapter-{idx:02d}'></a>\n")
    en_lines.append(f"## Chapter {idx + 1}: {sec['enTitle']}\n")
    for pair in sec['pairs']:
        en_lines.append(f"{pair['en']}\n\n")

en_content = "\n".join(en_lines)


# 2. Build Pure Traditional Chinese (Analytical Psychology) Complete Book Markdown
zh_lines = []
zh_lines.append(f"# 《{manifest['zhTitle']}》（全書繁體中文典藏版）\n")
zh_lines.append(f"# {manifest['title']}\n\n")
zh_lines.append(f"> **原著 Author**: {manifest['zhAuthor']}  \n")
zh_lines.append(f"> **出版年份 Year**: {manifest['year']} 年  \n")
zh_lines.append(f"> **頁數 Total Pages**: PDF {manifest['pdfTotalPages']} 頁  \n")
zh_lines.append(f"> **專業心理學譯名**: 榮格分析心理學 (Analytical Psychology) 經典學術用語（含積極想像、自性、陰影、原型、阿布拉克薩斯、死者七講對照）  \n")
zh_lines.append(f"> **導讀與簡介**: {manifest['zhDescription']}  \n")
zh_lines.append("\n---\n")

zh_lines.append("## 全書中文目錄 (Table of Contents)\n")
for sec in manifest['sections']:
    idx = sec['chapterIndex']
    zh_lines.append(f"- [{sec['zhTitle']} ({sec['enTitle']})](#chapter-{idx:02d})")

zh_lines.append("\n---\n")

for sec in manifest['sections']:
    idx = sec['chapterIndex']
    zh_lines.append(f"\n<a id='chapter-{idx:02d}'></a>\n")
    zh_lines.append(f"## 第 {idx + 1} 章：{sec['zhTitle']}")
    zh_lines.append(f"### {sec['enTitle']}\n")
    for pair in sec['pairs']:
        zh_lines.append(f"{pair['zh']}\n\n")

zh_content = "\n".join(zh_lines)


# 3. Build Bilingual Paragraph-Aligned Complete Book Markdown
bi_lines = []
bi_lines.append(f"# {manifest['title']} （《{manifest['zhTitle']}》中英雙語對照全書典藏版）\n")
bi_lines.append(f"> **原著 Author**: {manifest['author']}  \n")
bi_lines.append(f"> **年份 Year**: {manifest['year']}  \n")
bi_lines.append(f"> **頁數 Total Pages**: PDF {manifest['pdfTotalPages']} 頁  \n")
bi_lines.append(f"> **專業心理學譯名**: 榮格分析心理學 (Analytical Psychology) 經典學術用語對照  \n")
bi_lines.append("\n---\n")

bi_lines.append("## 全書雙語對照目錄 (Table of Contents)\n")
for sec in manifest['sections']:
    idx = sec['chapterIndex']
    bi_lines.append(f"- [{sec['enTitle']}｜{sec['zhTitle']}](#chapter-{idx:02d})")

bi_lines.append("\n---\n")

for sec in manifest['sections']:
    idx = sec['chapterIndex']
    bi_lines.append(f"\n<a id='chapter-{idx:02d}'></a>\n")
    bi_lines.append(f"## 第 {idx + 1} 章：{sec['enTitle']}")
    bi_lines.append(f"### {sec['zhTitle']}\n")
    for pair in sec['pairs']:
        bi_lines.append(f"**[EN]** {pair['en']}\n")
        bi_lines.append(f"**[ZH]** {pair['zh']}\n")
        bi_lines.append("---\n")

bi_content = "\n".join(bi_lines)


# Write files to source_materials/red-book/ and source_materials/
files_to_write = [
    (os.path.join(materials_dir, "Red_Book_by_Carl_Jung_EN_Complete.md"), en_content),
    (os.path.join(materials_dir, "Red_Book_by_Carl_Jung_ZH_Complete.md"), zh_content),
    (os.path.join(materials_dir, "Red_Book_by_Carl_Jung_Bilingual_Complete.md"), bi_content),
    (os.path.join(root_materials_dir, "Red_Book_by_Carl_Jung_EN_Complete.md"), en_content),
    (os.path.join(root_materials_dir, "Red_Book_by_Carl_Jung_ZH_Complete.md"), zh_content),
    (os.path.join(root_materials_dir, "Red_Book_by_Carl_Jung_Bilingual_Complete.md"), bi_content),
]

for filepath, content in files_to_write:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[OK] Created full book Markdown: {filepath}")
