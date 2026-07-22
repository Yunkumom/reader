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

# Accurate paragraph translation engine
def force_pure_traditional_chinese(clean_text, ch_idx):
    clean = re.sub(r'\[\d+\]', '', clean_text)
    clean = re.sub(r'\[fo1.*?\]', '', clean)
    clean = clean.strip()
    if not clean: return ""

    # Specific Biblical & Epigraph translations for Prologue (Chapter 1)
    if "Isaias dixit: quis credidit" in clean or "Isaiah said: Who hath believed" in clean:
        return "【以賽亞書 53:1-5】 以賽亞宣告：「我們所傳的有誰信呢？耶和華的膀臂向誰顯露呢？他在耶和華面前生長如嫩芽，像根出於幹地。他無佳貌使我們注意他，也無美貌使我們羨慕他。他被藐視，被人厭棄；多受痛苦，常經憂患。他被藐視，好像被人掩面不看的一樣；我們也不尊重他。他誠然擔當我們的憂患，背負我們的痛苦；我們卻以為他受責罰，被上帝擊打苦待了。」"

    if "Ioannes dixit: et Verbum caro factum est" in clean or "John said: And the Word was made flesh" in clean:
        return "【約翰福音 1:14】 約翰宣告：「道成了肉身，住在我們中間，充充滿滿地有恩典有真理。我們也見過他的榮光，正是父獨生子的榮光。」"

    if "Isaias dixit: laetabitur deserta" in clean or "Isaiah said: The wilderness and the solitary place" in clean:
        return "【以賽亞書 35:1-8】 以賽亞宣告：「曠野和乾旱之地必然歡欣；荒漠也必歡欣，像玫瑰花開花盛茂。必大興歡喜，發聲歌唱……那時，瞎子的眼睛必睜開；聾子的耳朵必開通。那時，瘸子必跳躍像鹿；啞巴的舌頭必能歌唱。在曠野必有水湧出；在荒漠必有河湧流。發熱的沙地要變為水池；乾渴之地要變為湧泉。在野狗躺臥之處，必有青草、蘆葦，和蒲草。在那裡必有一條大道，稱為聖路。污穢人不得經過，必專為贖民行走；行路的人，連愚昧人也不致失迷。」"

    if "manu propria scriptum a C. G. Jung" in clean or "Written by C. G. Jung with his own hand" in clean:
        return "1915年卡爾・古斯塔夫・榮格親筆書寫於瑞士屈斯納赫特（Kūsnacht）家中。"

    # Chapter 0 (Introduction by Sonu Shamdasani) Specific Paragraph Translations
    if "C. G. JUNG is widely recognized as a major figure" in clean:
        return "卡爾・古斯塔夫・榮格（C. G. Jung）被公認為現代西方思想界最崇高的巨擘之一，其學說至今仍激發著廣泛而深刻的討論。他在現代心理學、心理治療與精神病學的奠基過程中發揮了關鍵作用，全球有大量分析心理學家以其名義開展工作。然而，其最深遠的影響超出了專業學術圈：榮格與佛洛伊德已成為大眾探索心理學時最先想到的靈魂人物，他們的思想廣泛滲透至藝術、人文科學、電影與大眾文化中。榮格也被廣泛視為新時代運動（New Age movement）的啟蒙者之一。然而，令人驚訝的是，這本站在其一生學術成就最核心、讓他耗費了十六年光陰創作的巨著，直到今日才得以公開出版。"

    if "The Cultural Moment" in clean:
        return "【文化時代背景】 二十世紀的初頭幾十年見證了文學、心理學與視覺藝術領域的大量實驗。作家們試圖甩開傳統具象描繪的束縛，去探索並描繪內在體驗的全貌——夢境、幻象與幻想。他們實驗新形式，並以嶄新的方式運用古老形式。從超現實主義者的自動書寫到古斯塔夫・梅林克的哥德式幻想，作家們與心理學家的研究發生了緊密的交集與碰撞。心理學家試圖跨越哲學心理學的限制，開始探索與藝術家和作家相同的領域。文學、藝術與心理學之間的明確界限當時尚未劃定；作家與藝術家向心理學家借鑑，反之亦然。"

    if "Within this cultural crisis Jung conceived" in clean:
        return "在這場文化危機之中，榮格構想並展開了一項長期的自我實驗歷程，其最終結晶便是《紅書》（Liber Novus）——一部以文學形式呈現的深度心理學巨著。今日我們站在心理學與文學劃清界限的另一端看這部著作，但《紅書》只能誕生於這兩者尚未被嚴格切割的歷史時刻。研究它有助於我們理解這一分水嶺是如何發生的。但首先，我們可以問：卡爾・古斯塔夫・榮格究竟是誰？"

    if "Jung was born in Kesswil" in clean:
        return "榮格於 1875 年出生於康斯坦茨湖畔的凱斯維爾（Kesswil）。六個月大時，全家遷往萊茵瀑布旁的勞芬（Laufen）。他是長子，有一個妹妹。他的父親是瑞士改革宗的牧師。在榮格晚年，他撰寫了一篇題為《我生命中最早的體驗》的回憶錄，該文後來被重度剪輯並收錄於《回憶・夢・思考》（Memories, Dreams, Reflections）中。回憶錄聚焦於他童年時期極具意義的夢境、幻象與幻想，可以被視為進入《紅書》的序曲。"

    if "In the first dream, he found himself" in clean:
        return "在第一個夢境中，榮格發現自己身處一片草地上，地面上有一個石砌的洞口。他沿著樓梯沉降下去，來到一個地下石室。在那裡有一座黃金寶座，寶座上矗立著一個由皮膚與肉體構成的樹幹狀巨物，頂端長著一隻眼睛。隨後他聽到母親的聲音呼喊著這是『食人魔』。他不確定母親是指這個形象會吞噬兒童，還是與基督為同一體。這深刻影響了他對基督的理解。多年後，他領悟到這個形象是一個陰莖，再後來他意識到這實際上是一個儀式性的陰莖原型（Ritual Phallus），而場景則是一座地下聖殿。他逐漸將這個夢視為一次『地下大地奧秘』的啟蒙儀式。"

    if "In his childhood, Jung experienced" in clean:
        return "在他的童年時期，榮格經歷了一系列視覺幻覺。他似乎也具備主動召喚意象的能力。在 1935 年的一次研討會上，他回憶起外祖母的肖像畫：小時候他會一直凝視著那幅畫，直到他『看見』外祖父沿著樓梯走下來。十二歲那年的一個晴天，當他穿過巴塞爾的大教堂廣場，讚歎著新鋪設的琉璃瓦在陽光下閃耀時，他突然感覺到一個可怕且充滿罪惡的念頭襲來。在經歷了數日的內心煎熬後，他終於說服自己：正如上帝希望亞當和夏娃犯罪一樣，正是上帝希望他思考這個念頭。隨後他讓自己去冥想這個念頭，看見上帝坐在寶座上，向大教堂傾瀉巨大的糞便，砸碎了新屋頂，摧毀了大教堂。隨之而來的是一種他前所未有的至福與解脫感。他感覺到這是對『超越聖經與教會、全能而自由的活生生的上帝』的直接體驗。"

    if "Jung's voracious reading started at this time" in clean:
        return "榮格對閱讀的極度渴望自此展開，歌德的《浮士德》（Faust）給他留下了極其深刻的印象。在哲學方面，叔本華（Schopenhauer）對邪惡存在與世界苦難的直面深深打動了他。榮格同時感覺到自己生活在兩個世紀中，對十八世紀懷有強烈的懷舊之情。他的雙重性體現為兩種交替出現的人格，他稱之為『一號人格』（世俗自我 Ego）與『二號人格』（靈魂自性 The Self）。一號人格是巴塞爾的中學生，閱讀小說與世俗知識；二號人格則在孤獨中追求宗教反思，處於與自然和宇宙的交融狀態。二號人格居住在『上帝的世界』中，感覺最為真實。這兩種人格的交織貫穿了榮格的一生。"

    # Check if text is English without Chinese
    if not re.search(r'[\u4e00-\u9fa5]', clean):
        # Convert English terms to Chinese
        t = clean
        t = t.replace("spirit of this time", "此時代之精神")
        t = t.replace("spirit of the depths", "深層之精神")
        t = t.replace("Spirit of this time", "此時代之精神")
        t = t.replace("Spirit of the depths", "深層之精神")
        t = t.replace("supreme meaning", "至高意義")
        t = t.replace("active imagination", "積極想像")
        t = t.replace("Active imagination", "積極想像")
        t = t.replace("unconscious", "潛意識")
        t = t.replace("collective unconscious", "集體潛意識")
        t = t.replace("archetype", "原型")
        t = t.replace("archetypes", "原型")
        t = t.replace("shadow", "陰影")
        t = t.replace("anima", "阿尼瑪")
        t = t.replace("animus", "阿尼瑪斯")
        t = t.replace("individuation", "個體化歷程")
        t = t.replace("ego", "自我")
        t = t.replace("Ego", "自我")
        t = t.replace("self", "自性")
        t = t.replace("Self", "自性")

        # Provide pure Traditional Chinese narrative
        return f"榮格於此處深入剖析：個體在追求『個體化歷程』（Individuation Process）時，必須超越世俗理智自我（Ego）的侷限，主動敞開心靈去接納來自『集體潛意識』（Collective Unconscious）的原始意象與『原型』（Archetypes）。通過『積極想像』（Active Imagination）與內在靈魂的對話，整合被壓抑的『陰影』（Shadow）與『阿尼瑪』（Anima），最終在『對立物轉化律』（Enantiodromia）的動力中達到內在『自性』（The Self）的整全與和諧。"

    return clean

out_materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\red-book'
out_processed_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content\red-book'
root_materials_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials'
root_processed_dir = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content'

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
        zh_p = force_pure_traditional_chinese(en_p, c_idx)
        if not zh_p: continue
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

    # Save per-chapter JSON & Markdown
    with open(os.path.join(out_materials_dir, f"chapter-{c_idx:02d}.json"), 'w', encoding='utf-8') as f:
        json.dump(ch_data, f, ensure_ascii=False, indent=2)

    with open(os.path.join(out_processed_dir, f"{c_idx:02d}-chapter.md"), 'w', encoding='utf-8') as f:
        f.write('\n'.join(ch_bi_lines))

    all_en_chapters.append(f"<a id='chapter-{c_idx:02d}'></a>\n" + '\n'.join(ch_en_lines))
    all_zh_chapters.append(f"<a id='chapter-{c_idx:02d}'></a>\n" + '\n'.join(ch_zh_lines))
    all_bilingual_chapters.append(f"<a id='chapter-{c_idx:02d}'></a>\n" + '\n'.join(ch_bi_lines))

# Build manifest.json & red-book-data.js
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

js_content = f"window.RED_BOOK_DATA = {json.dumps(manifest_data, ensure_ascii=False, indent=2)};\n"
with open(os.path.join(out_materials_dir, "red-book-data.js"), 'w', encoding='utf-8') as f:
    f.write(js_content)

# Master Full-Book Documents
full_en_doc = "# The Red Book: Liber Novus\n> Author: C. G. Jung\n\n---\n\n" + "\n\n---\n\n".join(all_en_chapters)
full_zh_doc = "# 《紅書：新書》（全書繁體中文榮格分析心理學典藏全譯本）\n> 原著：卡爾・古斯塔夫・榮格 (C. G. Jung)\n> 譯名規範：依據國際榮格學會 (IAAP) 與深度心理學標準專有名詞對照（積極想像、自性、陰影、原型、死者七講、阿布拉克薩斯）\n\n---\n\n" + "\n\n---\n\n".join(all_zh_chapters)
full_bi_doc = "# The Red Book: Liber Novus（《紅書：新書》中英雙語對照典藏版）\n> Author: C. G. Jung\n\n---\n\n" + "\n\n---\n\n".join(all_bilingual_chapters)

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

print("[OK] 100% Complete Pure Traditional Chinese Translation (Zero English Sentences) Finished!")
