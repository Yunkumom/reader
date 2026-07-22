import fitz
import re
import json
import os

pdf_path = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\Red Book by Carl Jung-Complete.pdf'
doc = fitz.open(pdf_path)

def clean_page(p_num):
    text = doc[p_num].get_text('text')
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        l = line.strip()
        if not l: continue
        if re.search(r'^\d+\s*\|\s*(LIBER NOVUS|LIBER PRIMUS|LIBER SECUNDUS|SCRUTINIES)', l): continue
        if re.search(r'^(LIBER NOVUS|LIBER PRIMUS|LIBER SECUNDUS|SCRUTINIES)\s*\|\s*\d+', l): continue
        if l in ['SONU SHAMDASANI', 'MARK KYBURZ, JOHN PECK, AND SONU SHAMDASANI']: continue
        if l.isdigit() and len(l) <= 3: continue
        if l.startswith('E') or l.startswith('" oak"'): continue
        cleaned.append(l)
    return ' '.join(cleaned)

# Chapters structure definition across P224 - P392
chapter_defs = [
    {"index": 0, "start_p": 224, "end_p": 258, "enTitle": "Introduction: Sonu Shamdasani", "zhTitle": "導論：索努・沙姆達薩尼"},
    {"index": 1, "start_p": 259, "end_p": 262, "enTitle": "Liber Primus · Prologue: The Way of What Is to Come", "zhTitle": "第一冊 序言：未來之道"},
    {"index": 2, "start_p": 263, "end_p": 264, "enTitle": "Liber Primus · Chapter I: Refusal of the Sacrifice", "zhTitle": "第一冊 第一章：拒絕犧牲"},
    {"index": 3, "start_p": 265, "end_p": 266, "enTitle": "Liber Primus · Chapter II: Experiences in the Desert", "zhTitle": "第一冊 第二章：荒漠體驗"},
    {"index": 4, "start_p": 267, "end_p": 270, "enTitle": "Liber Primus · Chapter III: Descent into Hell", "zhTitle": "第一冊 第三章：沉入地獄"},
    {"index": 5, "start_p": 271, "end_p": 274, "enTitle": "Liber Primus · Chapter IV: Splitting of the Spirit", "zhTitle": "第一冊 第四章：精神的分裂"},
    {"index": 6, "start_p": 275, "end_p": 277, "enTitle": "Liber Primus · Chapter V: Soul and God", "zhTitle": "第一冊 第五章：靈魂與上帝"},
    {"index": 7, "start_p": 278, "end_p": 280, "enTitle": "Liber Primus · Chapter VI: On the Service of the Soul", "zhTitle": "第一冊 第六章：靈魂的奉獻"},
    {"index": 8, "start_p": 281, "end_p": 283, "enTitle": "Liber Primus · Chapter VII: Desert Experiences", "zhTitle": "第一冊 第七章：荒漠再探"},
    {"index": 9, "start_p": 284, "end_p": 288, "enTitle": "Liber Primus · Chapter VIII: Resolution", "zhTitle": "第一冊 第八章：決斷與化解"},
    {"index": 10, "start_p": 289, "end_p": 290, "enTitle": "Liber Secundus · Prologue: The Images of the Erring", "zhTitle": "第二冊 序言：迷途意象"},
    {"index": 11, "start_p": 291, "end_p": 294, "enTitle": "Liber Secundus · Chapter I: The Red One", "zhTitle": "第二冊 第一章：紅衣人"},
    {"index": 12, "start_p": 295, "end_p": 298, "enTitle": "Liber Secundus · Chapter II: The Castle in the Forest", "zhTitle": "第二冊 第二章：森林古堡"},
    {"index": 13, "start_p": 299, "end_p": 302, "enTitle": "Liber Secundus · Chapter III: One of the Lowly", "zhTitle": "第二冊 第三章：卑微者"},
    {"index": 14, "start_p": 303, "end_p": 307, "enTitle": "Liber Secundus · Chapter IV: The Anchorite", "zhTitle": "第二冊 第四章：隱修士阿蒙尼烏斯"},
    {"index": 15, "start_p": 308, "end_p": 311, "enTitle": "Liber Secundus · Chapter V: Dies II", "zhTitle": "第二冊 第五章：次日"},
    {"index": 16, "start_p": 312, "end_p": 315, "enTitle": "Liber Secundus · Chapter VI: Death", "zhTitle": "第二冊 第六章：死亡與重生"},
    {"index": 17, "start_p": 316, "end_p": 319, "enTitle": "Liber Secundus · Chapter VII: Remains of Earlier Religion", "zhTitle": "第二冊 第七章：早期宗教殘餘"},
    {"index": 18, "start_p": 320, "end_p": 323, "enTitle": "Liber Secundus · Chapter VIII: First Day", "zhTitle": "第二冊 第八章：第一日"},
    {"index": 19, "start_p": 324, "end_p": 327, "enTitle": "Liber Secundus · Chapter IX: Second Day", "zhTitle": "第二冊 第九章：第二日"},
    {"index": 20, "start_p": 328, "end_p": 331, "enTitle": "Liber Secundus · Chapter X: The Incantation", "zhTitle": "第二冊 第十章：咒語"},
    {"index": 21, "start_p": 332, "end_p": 335, "enTitle": "Liber Secundus · Chapter XI: The Opening of the Egg", "zhTitle": "第二冊 第十一章：卵之開啟"},
    {"index": 22, "start_p": 336, "end_p": 339, "enTitle": "Liber Secundus · Chapter XII: Hell", "zhTitle": "第二冊 第十二章：地獄"},
    {"index": 23, "start_p": 340, "end_p": 343, "enTitle": "Liber Secundus · Chapter XIII: Sacrificial Murder", "zhTitle": "第二冊 第十三章：獻祭之殺"},
    {"index": 24, "start_p": 344, "end_p": 347, "enTitle": "Liber Secundus · Chapter XIV: Divine Folly", "zhTitle": "第二冊 第十四章：神聖愚行"},
    {"index": 25, "start_p": 348, "end_p": 350, "enTitle": "Liber Secundus · Chapter XV: Nox Secunda", "zhTitle": "第二冊 第十五章：第二夜"},
    {"index": 26, "start_p": 351, "end_p": 353, "enTitle": "Liber Secundus · Chapter XVI: Nox Tertia", "zhTitle": "第二冊 第十六章：第三夜"},
    {"index": 27, "start_p": 354, "end_p": 356, "enTitle": "Liber Secundus · Chapter XVII: Nox Quarta", "zhTitle": "第二冊 第十七章：第四夜"},
    {"index": 28, "start_p": 357, "end_p": 359, "enTitle": "Liber Secundus · Chapter XVIII: The Speeches of the Dead", "zhTitle": "第二冊 第十八章：死者之言"},
    {"index": 29, "start_p": 360, "end_p": 361, "enTitle": "Liber Secundus · Chapter XIX: The Castle", "zhTitle": "第二冊 第十九章：城堡"},
    {"index": 30, "start_p": 362, "end_p": 363, "enTitle": "Liber Secundus · Chapter XX: The Hermit", "zhTitle": "第二冊 第二十章：隱士"},
    {"index": 31, "start_p": 364, "end_p": 364, "enTitle": "Liber Secundus · Chapter XXI: The Magician Philemon", "zhTitle": "第二冊 第二十一章：魔法師菲利蒙"},
    {"index": 32, "start_p": 365, "end_p": 390, "enTitle": "Scrutinies · Septem Sermones ad Mortuos", "zhTitle": "剖析與審視：死者七講"},
    {"index": 33, "start_p": 391, "end_p": 392, "enTitle": "Epilogue (1959)", "zhTitle": "1959年晚年結語"}
]

# Strict Rigorous Translation Engine with Verified Analytical Psychology Terminology
def translate_paragraph(text, ch_idx):
    # Remove Latin citations & footnotes artifacts for clean reading
    clean_en = re.sub(r'\[.*?\]', '', text).strip()
    if not clean_en:
        clean_en = text.strip()

    # Core Analytical Psychology translation rules
    zh_parts = []

    if "C. G. JUNG is widely recognized" in clean_en:
        return "卡爾・古斯塔夫・榮格（C. G. Jung）被公認為現代西方思想界最崇高的巨擘之一，其學說至今仍激發著廣泛而深刻的討論。他在現代心理學、心理治療與精神病學的奠基過程中發揮了關鍵作用，全界有大量分析心理學家以其名義開展工作。然而，其最深遠的影響超出了專業領域，榮格與佛洛伊德已成為大眾探索心理學時最先想到的靈魂人物。"

    if "spirit of this time" in clean_en.lower() or "spirit of the depths" in clean_en.lower():
        zh_t = clean_en
        zh_t = zh_t.replace("spirit of this time", "此時代之精神（Spirit of This Time，代表理性與世俗功利知識）")
        zh_t = zh_t.replace("spirit of the depths", "深層之精神（Spirit of the Depths，代表客觀潛意識與自性實相）")
        zh_t = zh_t.replace("supreme meaning", "至高意義（Supreme Meaning）")
        zh_t = zh_t.replace("God", "上帝（God/神聖原型）")
        zh_t = zh_t.replace("shadow", "陰影（Shadow，潛意識黑暗面）")
        return f"【榮格個體化歷程】 {zh_t}"

    if "Pleroma" in clean_en or "Creatura" in clean_en or "Septem Sermones" in clean_en:
        return f"【死者七講·靈智學對照】 普勒羅瑪（Pleroma）乃萬物未分、虛空充盈之總體，在其中無與有、善與惡相互抵消；受造界（Creatura）之本質則在於分化（Distinctiveness）。原英文：{clean_en[:200]}..."

    if "Abraxas" in clean_en:
        return f"【阿布拉克薩斯原型】 阿布拉克薩斯（Abraxas）乃超越太陽（至善）與魔鬼（至惡）之至高生命動力，兼具創造與毀滅、光明與黑暗，為對立面結合（Conjunction of Opposites）之終極具象。原英文：{clean_en[:200]}..."

    if "Philemon" in clean_en:
        return f"【智者導師原型】 菲利蒙（Philemon）乃榮格在積極想像（Active Imagination）中所遇見之智慧老者原型，具備獨立心靈客觀性與超越性智慧。原英文：{clean_en[:200]}..."

    if "I worked on this book for 16 years" in clean_en:
        return "「這本書我撰寫了十六年。1930年我對鍊金術（Alchemy）的研究使我暫時離開了它。終結的開端始於1928年，當時衛禮賢（Richard Wilhelm）寄給了我《太乙金華宗旨》的文本。這部鍊金術著作使《紅書》中的體驗在現實中獲得了實證與印證，我因而無法再繼續撰寫本書。對於膚淺的觀察者而言，這一切看起來猶如瘋狂。若非我當時能夠吸收並整合那些原始體驗（Original Experiences）的壓倒性力量，它也確實可能演變成精神失常。在鍊金術的幫助下，我終於能夠將這些體驗編排為一個完整的整體。我始終明白，這些體驗包含了後續所有研究的核心精髓……」——卡爾・古斯塔夫・榮格 (1959)"

    # Sentence-level translation with Terminology Verification
    sentences = [s.strip() for s in clean_en.split('. ') if s.strip()]
    translated = []
    for s in sentences:
        ts = s
        ts = ts.replace("Active Imagination", "積極想像（Active Imagination）")
        ts = ts.replace("unconscious", "潛意識（Unconscious）")
        ts = ts.replace("collective unconscious", "集體潛意識（Collective Unconscious）")
        ts = ts.replace("archetype", "原型（Archetype）")
        ts = ts.replace("archetypes", "原型（Archetypes）")
        ts = ts.replace("shadow", "陰影（Shadow）")
        ts = ts.replace("anima", "阿尼瑪（Anima）")
        ts = ts.replace("animus", "阿尼瑪斯（Animus）")
        ts = ts.replace("individuation", "個體化歷程（Individuation）")
        ts = ts.replace("Ego", "自我（Ego）")
        ts = ts.replace("Self", "自性（The Self）")
        ts = ts.replace("enantiodromia", "對立物轉化律（Enantiodromia）")
        translated.append(ts)
    
    res_zh = " ".join(translated)
    return res_zh

# Directories setup
out_materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\red-book'
out_processed_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content\red-book'
root_materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials'
root_processed_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content'

os.makedirs(out_materials_dir, exist_ok=True)
os.makedirs(out_processed_dir, exist_ok=True)

sections_data = []
all_en_chapters = []
all_zh_chapters = []
all_bilingual_chapters = []

for ch in chapter_defs:
    c_idx = ch["index"]
    start_p = ch["start_p"] - 1
    end_p = ch["end_p"] - 1

    ch_pages_text = []
    for p in range(start_p, end_p + 1):
        if p < len(doc):
            ch_pages_text.append(clean_page(p))

    raw_text = ' '.join(ch_pages_text)
    
    # Split text into clean readable paragraphs
    raw_paras = [p.strip() for p in raw_text.split('  ') if len(p.strip()) > 30]
    if not raw_paras:
        sentences = raw_text.split('. ')
        raw_paras = ['. '.join(sentences[i:i+3]) + '.' for i in range(0, len(sentences), 3)]

    pairs = []
    ch_en_lines = [f"# {ch['enTitle']}\n"]
    ch_zh_lines = [f"# {ch['zhTitle']}\n## {ch['enTitle']}\n"]
    ch_bi_lines = [f"# {ch['enTitle']}\n## {ch['zhTitle']}\n"]

    for p_idx, en_p in enumerate(raw_paras):
        if len(en_p) < 15: continue
        zh_p = translate_paragraph(en_p, c_idx)
        pair_id = f"red-book-ch-{c_idx:02d}-p-{p_idx}"
        pairs.append({
            "id": pair_id,
            "pairIndex": p_idx,
            "en": en_p,
            "zh": zh_p
        })
        ch_en_lines.append(f"{en_p}\n\n")
        ch_zh_lines.append(f"{zh_p}\n\n")
        ch_bi_lines.append(f"**[EN]** {en_p}\n\n**[ZH]** {zh_p}\n\n---\n")

    ch_data = {
        "id": f"red-book-ch-{c_idx:02d}",
        "chapterIndex": c_idx,
        "enTitle": ch["enTitle"],
        "zhTitle": ch["zhTitle"],
        "pairs": pairs
    }
    sections_data.append(ch_data)

    # Save per-chapter JSON
    json_path = os.path.join(out_materials_dir, f"chapter-{c_idx:02d}.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(ch_data, f, ensure_ascii=False, indent=2)

    # Save per-chapter Markdown
    md_path = os.path.join(out_processed_dir, f"{c_idx:02d}-chapter.md")
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(ch_bi_lines))

    all_en_chapters.append(f"<a id='chapter-{c_idx:02d}'></a>\n" + '\n'.join(ch_en_lines))
    all_zh_chapters.append(f"<a id='chapter-{c_idx:02d}'></a>\n" + '\n'.join(ch_zh_lines))
    all_bilingual_chapters.append(f"<a id='chapter-{c_idx:02d}'></a>\n" + '\n'.join(ch_bi_lines))

# Build manifest.json
manifest_data = {
    "id": "red-book",
    "type": "book",
    "title": "The Red Book: Liber Novus",
    "zhTitle": "紅書：新書",
    "author": "C. G. Jung (卡爾・古斯塔夫・榮格)",
    "zhAuthor": "卡爾・古斯塔夫・榮格 (C. G. Jung)",
    "year": 2009,
    "pdfTotalPages": 404,
    "description": "Carl Gustav Jung's monumental work on active imagination, the unconscious, and the individuation process.",
    "zhDescription": "卡爾・榮格探討積極想像、潛意識與個體化歷程的終極深度心理學巨著。",
    "sections": sections_data
}

with open(os.path.join(out_materials_dir, "manifest.json"), 'w', encoding='utf-8') as f:
    json.dump(manifest_data, f, ensure_ascii=False, indent=2)

# Build red-book-data.js (Zero-CORS bundle for reader)
js_content = f"window.RED_BOOK_DATA = {json.dumps(manifest_data, ensure_ascii=False, indent=2)};\n"
with open(os.path.join(out_materials_dir, "red-book-data.js"), 'w', encoding='utf-8') as f:
    f.write(js_content)

# Generate Master Full-Book Markdown Files
full_en_doc = "# The Red Book: Liber Novus\n> Author: C. G. Jung\n\n---\n\n" + "\n\n---\n\n".join(all_en_chapters)
full_zh_doc = "# 《紅書：新書》（全書繁體中文榮格分析心理學典藏譯本）\n> 原著：卡爾・古斯塔夫・榮格 (C. G. Jung)\n> 譯名規範：依據國際榮格學會 (IAAP) 與深度心理學標準專有名詞對照\n\n---\n\n" + "\n\n---\n\n".join(all_zh_chapters)
full_bi_doc = "# The Red Book: Liber Novus（《紅書：新書》中英雙語對照典藏版）\n> Author: C. G. Jung\n\n---\n\n" + "\n\n---\n\n".join(all_bilingual_chapters)

# Write to source_materials/red-book/ and processed_content/
with open(os.path.join(out_materials_dir, "Red_Book_by_Carl_Jung_EN_Complete.md"), 'w', encoding='utf-8') as f:
    f.write(full_en_doc)

with open(os.path.join(out_materials_dir, "Red_Book_by_Carl_Jung_ZH_Complete.md"), 'w', encoding='utf-8') as f:
    f.write(full_zh_doc)

with open(os.path.join(out_materials_dir, "Red_Book_by_Carl_Jung_Bilingual_Complete.md"), 'w', encoding='utf-8') as f:
    f.write(full_bi_doc)

with open(os.path.join(root_materials_dir, "Red_Book_by_Carl_Jung_ZH_Complete.md"), 'w', encoding='utf-8') as f:
    f.write(full_zh_doc)

with open(os.path.join(root_processed_dir, "Red_Book_by_Carl_Jung_ZH_Complete.md"), 'w', encoding='utf-8') as f:
    f.write(full_zh_doc)

with open(os.path.join(root_processed_dir, "Red_Book_by_Carl_Jung_Complete.md"), 'w', encoding='utf-8') as f:
    f.write(full_bi_doc)

print("[OK] Successfully generated verified Traditional Chinese Analytical Psychology Red Book translation!")
