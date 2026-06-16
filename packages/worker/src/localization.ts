import type { SourceStory } from "@finance-radar/domain";

const chinesePattern = /[\u3400-\u9fff]/;

export function containsChinese(value: string) {
  return chinesePattern.test(value);
}

export function needsTranslation(value: string) {
  const containsEnglishSentence = /[a-z]{4,}(?:\s+[a-z]{3,}){2,}/.test(value);
  const containsEnglishPhrase = /[A-Za-z]{3,}\s+(?:in|on|for|of|to|with|and|the|is|are)\s+[A-Za-z]{3,}/.test(value);
  return !containsChinese(value) || containsEnglishSentence || containsEnglishPhrase || /\bwith Q&A\b/i.test(value);
}

function filingFallback(title: string) {
  const match = title.match(/^([A-Z0-9/-]+)\s*-\s*(.+?)(?:\s+\((\d+)\))?\s+\((Filer|Issuer|Reporting|Subject)\)$/i);
  if (!match) return `海外财经动态：${title}`;
  const [, form = "", entity = "", cik, role = "Subject"] = match;
  const formNames: Record<string, string> = {
    "4": "内部人持股变动申报",
    "6-K": "境外发行人重大事项报告",
    "8-K": "公司重大事项报告",
    "10-K": "年度报告",
    "10-Q": "季度报告",
    "13F-HR": "机构持仓报告",
    "20-F": "境外发行人年度报告",
    "D": "私募证券发行申报",
    "D/A": "私募证券发行修订申报",
  };
  const roleNames: Record<string, string> = { Filer: "申报方", Issuer: "发行人", Reporting: "报告方", Subject: "相关主体" };
  return `${formNames[form.toUpperCase()] ?? `${form} 表格申报`}：${entity}${cik ? `（CIK ${cik}）` : ""}，身份：${roleNames[role] ?? role}`;
}

function fallbackTranslate(title: string) {
  const replacements: Array<[RegExp, string]> = [
    [/Monetary policy decisions/gi, "货币政策决定"],
    [/Monetary policy statement/gi, "货币政策声明"],
    [/Interview with/gi, "接受采访："],
    [/Press release/gi, "新闻稿"],
    [/Federal Reserve Board/gi, "美联储理事会"],
    [/European Central Bank/gi, "欧洲央行"],
  ];
  const translated = replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), title);
  return containsChinese(translated) ? translated : filingFallback(title);
}

export class ChineseLocalizer {
  private async translatePublicly(title: string) {
    const endpoint = process.env.TRANSLATION_ENDPOINT ?? "https://translate.googleapis.com/translate_a/single";
    const url = new URL(endpoint);
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", containsChinese(title) ? "en" : "auto");
    url.searchParams.set("tl", "zh-CN");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", title);
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Public translation failed: ${response.status}`);
    const body = await response.json() as Array<Array<Array<string>>>;
    return body[0]?.map((part) => part[0]).join("").trim() ?? "";
  }

  async translateTitles(titles: string[]): Promise<string[]> {
    const pending = titles.map((title, index) => ({ index, title })).filter(({ title }) => needsTranslation(title));
    const output = [...titles];
    if (pending.length === 0) return output;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: "你是财经新闻标题翻译器。把每个英文标题翻译成准确、简洁、自然的简体中文。公司名、股票代码和表格编号可保留原文。只输出严格 JSON 字符串数组，数量和顺序必须与输入一致。",
            messages: [{ role: "user", content: JSON.stringify(pending.map(({ title }) => title)) }],
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!response.ok) throw new Error(`Anthropic translation failed: ${response.status}`);
        const body = await response.json() as { content?: Array<{ type: string; text?: string }> };
        const text = body.content?.find((item) => item.type === "text")?.text ?? "[]";
        const translated = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as string[];
        if (translated.length !== pending.length) throw new Error("Translation count mismatch");
        pending.forEach(({ index, title }, translatedIndex) => {
          const value = translated[translatedIndex]?.trim();
          output[index] = value && containsChinese(value) ? value : fallbackTranslate(title);
        });
        return output;
      } catch (error) {
        console.error("Anthropic translation unavailable, using Chinese fallback", error);
      }
    }

    for (let index = 0; index < pending.length; index += 5) {
      const batch = pending.slice(index, index + 5);
      const translated = await Promise.allSettled(batch.map(({ title }) => this.translatePublicly(title)));
      batch.forEach(({ index: outputIndex, title }, batchIndex) => {
        const result = translated[batchIndex];
        const value = result?.status === "fulfilled" ? result.value : "";
        output[outputIndex] = value && containsChinese(value) ? value : fallbackTranslate(title);
      });
    }
    return output;
  }

  async localizeStories(stories: SourceStory[]): Promise<SourceStory[]> {
    const translated = await this.translateTitles(stories.map((story) => story.title));
    return stories.map((story, index) => ({ ...story, title: translated[index] ?? fallbackTranslate(story.title) }));
  }
}
