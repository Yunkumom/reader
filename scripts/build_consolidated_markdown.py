import json
import os

materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\red-book'
processed_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content'
red_book_proc_dir = os.path.join(processed_dir, 'red-book')

manifest_path = os.path.join(materials_dir, 'manifest.json')

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

lines = []
lines.append(f"# {manifest['title']} （《{manifest['zhTitle']}》完整雙語典藏對照版）\n")
lines.append(f"> **原著 Author**: {manifest['author']}  \n")
lines.append(f"> **年份 Year**: {manifest['year']}  \n")
lines.append(f"> **頁數 Total Pages**: PDF {manifest['pdfTotalPages']} 頁  \n")
lines.append(f"> **專業心理學註解**: 採用榮格分析心理學 (Analytical Psychology) 經典學術譯名（含積極想像、自性、陰影、原型、死者七講與阿布拉克薩斯對照）  \n")
lines.append("\n---\n")

lines.append("## 全書目錄 (Table of Contents)\n")
for sec in manifest['sections']:
    idx = sec['chapterIndex']
    lines.append(f"- [{sec['enTitle']}｜{sec['zhTitle']}](#chapter-{idx:02d})")

lines.append("\n---\n")

for sec in manifest['sections']:
    idx = sec['chapterIndex']
    lines.append(f"\n<a id='chapter-{idx:02d}'></a>\n")
    lines.append(f"## 第 {idx + 1} 章：{sec['enTitle']}")
    lines.append(f"### {sec['zhTitle']}\n")

    for pair in sec['pairs']:
        lines.append(f"**[EN]** {pair['en']}\n")
        lines.append(f"**[ZH]** {pair['zh']}\n")
        lines.append("---\n")

full_md_content = "\n".join(lines)

# Write master consolidated markdown to processed_content/
master_md_path1 = os.path.join(processed_dir, "Red_Book_by_Carl_Jung_Complete.md")
master_md_path2 = os.path.join(red_book_proc_dir, "Red_Book_by_Carl_Jung_Complete.md")

with open(master_md_path1, 'w', encoding='utf-8') as f:
    f.write(full_md_content)

with open(master_md_path2, 'w', encoding='utf-8') as f:
    f.write(full_md_content)

print("[OK] Consolidated Master Markdown created successfully at:")
print(f"  - {master_md_path1}")
print(f"  - {master_md_path2}")
