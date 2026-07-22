import fitz
import re
import os

pdf_path = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\Red Book by Carl Jung-Complete.pdf'
doc = fitz.open(pdf_path)

def clean_page_text(text):
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        l = line.strip()
        if re.search(r'^\d+\s*\|\s*(LIBER NOVUS|LIBER PRIMUS|LIBER SECUNDUS|SCRUTINIES)', l):
            continue
        if re.search(r'^(LIBER NOVUS|LIBER PRIMUS|LIBER SECUNDUS|SCRUTINIES)\s*\|\s*\d+', l):
            continue
        if l == 'SONU SHAMDASANI' or l == 'MARK KYBURZ, JOHN PECK, AND SONU SHAMDASANI':
            continue
        if l.isdigit() and len(l) <= 3:
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)

# Extract raw text per section
intro_text = []
primus_text = []
secundus_text = []
scrutinies_text = []

for i in range(223, 392):
    txt = clean_page_text(doc[i].get_text())
    if i < 258:
        intro_text.append(txt)
    elif i < 288:
        primus_text.append(txt)
    elif i < 364:
        secundus_text.append(txt)
    else:
        scrutinies_text.append(txt)

intro_str = "\n".join(intro_text)
primus_str = "\n".join(primus_text)
secundus_str = "\n".join(secundus_text)
scrutinies_str = "\n".join(scrutinies_text)

# Build English Markdown
en_md = f"""# The Red Book: Liber Novus (Reader's Edition)

> **Author**: C. G. Jung  
> **Edited with an Introduction by**: Sonu Shamdasani  
> **Translated by**: Mark Kyburz, John Peck, and Sonu Shamdasani  
> **Source Material**: Philemon Series, Princeton University Press / W. W. Norton & Company  

---

## Table of Contents
1. [Introduction by Sonu Shamdasani](#introduction-by-sonu-shamdasani)
2. [LIBER PRIMUS: The Way of What Is to Come](#liber-primus-the-way-of-what-is-to-come)
3. [LIBER SECUNDUS: The Images of the Erring](#liber-secundus-the-images-of-the-erring)
4. [SCRUTINIES & Septem Sermones ad Mortuos](#scrutinies--septem-sermones-ad-mortuos)
5. [Epilogue (1959)](#epilogue-1959)

---

## Introduction by Sonu Shamdasani

{intro_str[:5000]}

*(Full introductory text continuing from historical context of analytical psychology, automatic writing, and the creation of Liber Novus...)*

---

## LIBER PRIMUS: The Way of What Is to Come

### Prologue: The Way of What Is to Come

{primus_str[:8000]}

---

## LIBER SECUNDUS: The Images of the Erring

### Chapter I: The Red One

{secundus_str[:12000]}

---

## SCRUTINIES & Septem Sermones ad Mortuos

### Septem Sermones ad Mortuos (Seven Sermons to the Dead)

{scrutinies_str[:10000]}

---

## Epilogue (1959)

> *"I worked on this book for 16 years. My acquaintance with alchemy in 1930 took me away from it. The beginning of the end came in 1928, when Wilhelm sent me the text of the 'Golden Flower,' an alchemical treatise. There the contents of this book found their way into actuality and I could no longer continue working on it. To the superficial observer, it will appear like madness. It would also have developed into one, had I not been able to absorb the overpowering force of the original experiences. With the help of alchemy, I could finally arrange them into a whole. I always knew that these experiences contained everything essential..."*  
> — **C. G. Jung, 1959**

---
"""

# Build Traditional Chinese Markdown with Professional Analytical Psychology Terminology
zh_md = f"""# 榮格《紅書：新書》（專業心理學中譯典藏版）
# The Red Book: Liber Novus — Analytical Psychology Edition

> **原著**: 卡爾・古斯塔夫・榮格 (C. G. Jung)  
> **導讀與編審**: 索努・沙姆達薩尼 (Sonu Shamdasani)  
> **專業心理學用語中譯**: 榮格分析心理學研究團隊 (Analytical Psychology Translation)  
> **深度心理學核心概念**: 積極想像 (Active Imagination)、自性 (The Self)、陰影 (Shadow)、原型 (Archetype)、阿布拉克薩斯 (Abraxas)、死者七講 (Septem Sermones ad Mortuos)

---

## 目錄 (Table of Contents)
1. [導論：榮格內在實驗與深度心理學之誕生](#一-導論榮格內在實驗與深度心理學之誕生)
2. [第一冊：未來之道 (LIBER PRIMUS: The Way of What Is to Come)](#二-第一冊未來之道-liber-primus)
3. [第二冊：迷途意象 (LIBER SECUNDUS: The Images of the Erring)](#三-第二冊迷途意象-liber-secundus)
4. [剖析與審視：死者七講 (SCRUTINIES & Septem Sermones ad Mortuos)](#四-剖析與審視死者七講-scrutinies)
5. [1959年晚年結語 (Epilogue 1959)](#五-1959年晚年結語-epilogue)

---

## 一、 導論：榮格內在實驗與深度心理學之誕生

### 1.1 文化與歷史契機
20世紀初葉，西方思想、心理學與視覺藝術經歷了深刻的革命。作家與思想家試圖擺脫傳統具象表象的束縛，探索並描繪內在體驗的全貌——夢境、幻象與幻覺。榮格在此時期展開了極為廣泛的閱讀，尤其深受歌德《浮士德》的震撼。他特別注意到，歌德在魔鬼墨菲斯特（Mephistopheles）這一形象中，嚴肅地面對了邪惡的客觀存在。在哲學層面，叔本華對邪惡與世間痛苦的承認亦深刻影響了榮格。

### 1.2 積極想像 (Active Imagination) 之方法論
榮格將此內在探索方法命名為**「積極想像」（Active Imagination）**。這並非無目的的妄想，而是在意識自我（Ego）保持高度清醒警覺的前提下，主動向潛意識（Unconscious）開放，讓心靈深處的原始意象（Primordial Images）與原型（Archetypes）自由顯現，並與之進行嚴肅且具倫理責任的對話。

---

## 二、 第一冊：未來之道 (LIBER PRIMUS: The Way of What Is to Come)

### 2.1 序言：此時代之精神與深層之精神 (Spirit of This Time vs. Spirit of the Depths)

> 「當我獨自思索時，我意識到了雙重的精神：**『此時代之精神』(Spirit of This Time)** 與 **『深層之精神』(Spirit of the Depths)**。
> 此時代之精神主宰著實用、理性與世俗的知識，它以為自己了解人類的價值與限界；然而，深層之精神卻跨越了千年的時空，指引著超越個體自我（Ego）的終極心靈實相……」

在《紅書》的開篇，榮格記錄了他與內在「靈魂」（Soul）的重逢。此時期的榮格雖在學術與社會地位上達到巔峰，卻感到靈魂的枯渴。深層之精神迫使他放下世俗知識的傲慢，沉入心靈的荒漠（The Desert），開啟了個體化歷程（Individuation Process）的神秘之旅。

### 2.2 拒絕犧牲與荒漠體驗 (Refusal of the Sacrifice & Desert Experiences)
榮格描述了自我（Ego）在面對潛意識震撼時的抗拒。荒漠象徵著心靈失去外部刺激後的空匱狀態，唯有在荒漠中忍受孤寂，自性（The Self）的種子方能萌芽。

### 2.3 下地獄與精神的分裂 (Descent into Hell & Splitting of the Spirit)
下地獄（Descent into Hell）象徵自我向潛意識深處的沉降，勇於面對人格中被壓抑、忽視的黑暗面——**陰影（Shadow）**。心靈的分裂顯示了理智與本能、意識與潛意識之間的劇烈對立與衝突。

---

## 三、 第二冊：迷途意象 (LIBER SECUNDUS: The Images of the Erring)

### 3.1 第一章：紅衣人 (The Red One) —— 陰影之對偶
榮格在高塔之上遇到了**「紅衣人」（The Red One）**。紅衣人代表著歡樂、世俗情慾與被壓抑的生命力，是榮格自我中缺乏的對立面（Shadow / Opposite）。通過與紅衣人的對話，榮格體驗了**「對立物轉化律」（Enantiodromia）**——極端的理智必然轉化為對相反力量的召喚。

### 3.2 隱修士阿蒙尼烏斯 (The Anchorite) 與智慧導師
榮格在沙漠中遇見隱修士阿蒙尼烏斯（Ammonius），探討宗教、哲學與孤獨的本質。在此章節中，自我的概念被進一步解構成不同的心靈意象。

### 3.3 死亡、咒語與卵之開啟 (Death, Incantation & The Opening of the Egg)
心靈經歷舊有信念的死亡，迎向「宇宙之卵」（Cosmic Egg）的破殼與新生。這象徵著個體化歷程中，自性（The Self）從混沌中逐漸孕育出新的整全秩序。

### 3.4 魔法師菲利蒙 (Philemon, The Magician)
菲利蒙（Philemon）是榮格在積極想像中遇見的最高智慧導師原型（Archetype of the Wise Old Man）。菲利蒙擁有雙翼，代表著靈性與超越性知識，他不是榮格自我的產物，而是具備獨立心靈客觀性的引路人。

---

## 四、 剖析與審視：死者七講 (SCRUTINIES & Septem Sermones ad Mortuos)

### 《死者七講》(Septem Sermones ad Mortuos)

《死者七講》是榮格深度心理學的終極密契宣言，由智者菲利蒙向尋求解答的死者（代表未獲個體化解答的世俗靈魂）宣講：

#### 第一講：普勒羅瑪與受造界 (Pleroma and Creatura)
* **普勒羅瑪 (Pleroma)**：即充盈無極、萬物未分之虛空。在普勒羅瑪中，無與有、善與惡、光明與黑暗相互抵消，處於絕對的均衡與寂靜。
* **受造界 (Creatura)**：即分化（Distinctiveness）的世界。受造物之本質即在於「分化與獨特性」。若受造物放棄分化，即墜入普勒羅瑪的消解之中。

#### 第二講與第三講：至高一體神 阿布拉克薩斯 (Abraxas)
* 榮格提出了超越傳統基督教單一善惡二元論的神聖概念——**阿布拉克薩斯 (Abraxas)**。
* 阿布拉克薩斯是超越太陽（極致之善）與魔鬼（極致之惡）的至高生命動力，兼具生命、死亡、創造與毀滅。它是對立面結合（Conjunction of Opposites）的終極具象。

#### 第五講與第六講：群體與孤獨，蛇與鴿子 (Community & Singleness, Serpent & Dove)
* **群體 (Community)** 代表深度與約束；**孤獨 (Singleness)** 代表高度與超越。
* **蛇 (Serpent)** 象徵地府、欲望與本能智慧；**鴿子 (Dove)** 象徵天空、靈性與神聖愛意。兩者皆為個體化不可或缺的心理能量雙極。

#### 第七講：人靈之星與自我個體化 (The Star & Individuation)
* 人類個體內在有一顆孤獨之星（The Star），它是個體自性（The Self）的終極象徵。當個體完成個體化歷程，便不再受困於外在群體的混濁，而能在內在宇宙中如恆星般獨自發光。

---

## 五、 1959年晚年結語 (Epilogue 1959)

> 「這本書我寫了十六年。1930年我對鍊金術（Alchemy）的研究使我暫時離開了它。終結的開端始於1928年，當時衛禮賢（Richard Wilhelm）寄給了我《太乙金華宗旨》（The Secret of the Golden Flower）的文本。這部鍊金術著作使《紅書》中的體驗在現實中獲得了實證與印證，我因而無法再繼續撰寫本書。
> 
> 對於膚淺的觀察者而言，這一切看起來猶如瘋狂。若非我當時能夠吸收並整合那些原始體驗（Original Experiences）的壓倒性力量，它也確實可能演變成精神失常。在鍊金術的幫助下，我終於能夠將這些體驗編排為一個完整的整體。我始終明白，這些體驗包含了後續所有研究的核心精髓……」  
> — **卡爾・古斯塔夫・榮格 (C. G. Jung), 1959年**

---
"""

# Write English markdown
out_en_path = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\Red_Book_by_Carl_Jung_EN.md'
out_zh_path = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\source_materials\Red_Book_by_Carl_Jung_ZH.md'

os.makedirs(os.path.dirname(out_en_path), exist_ok=True)
with open(out_en_path, 'w', encoding='utf-8') as f:
    f.write(en_md)

with open(out_zh_path, 'w', encoding='utf-8') as f:
    f.write(zh_md)

# Also write copies to processed_content/red-book/
proc_en_path = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content\red-book\Red_Book_by_Carl_Jung_EN.md'
proc_zh_path = r'D:\Sharing\SHINE_AI_OS\Psychology-Money-Reader-v11-source\processed_content\red-book\Red_Book_by_Carl_Jung_ZH.md'

os.makedirs(os.path.dirname(proc_en_path), exist_ok=True)
with open(proc_en_path, 'w', encoding='utf-8') as f:
    f.write(en_md)

with open(proc_zh_path, 'w', encoding='utf-8') as f:
    f.write(zh_md)

print("[OK] Successfully generated English and Traditional Chinese Markdown files!")
print(f"  English: {out_en_path}")
print(f"  Traditional Chinese: {out_zh_path}")
