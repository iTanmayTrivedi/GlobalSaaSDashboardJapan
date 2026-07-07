import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_MODEL = Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, sourceLang, targetLang, recipient, tone, emailLang, meetingTitle, minutesLang, resumeType, targetIndustry, resumeLang } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = text || "";

    switch (action) {
      case "translate":
        systemPrompt = `You are a professional translator. Translate the following text from ${sourceLang || "auto-detect"} to ${targetLang || "English"}. Return ONLY the translated text, nothing else.`;
        break;
      case "summarize":
        systemPrompt = `You are a document summarizer. Summarize the following text concisely in the same language it's written in. If it's Japanese, summarize in Japanese. If English, summarize in English. Provide key points in bullet format followed by a brief summary paragraph.`;
        break;
      case "sentiment":
        systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment of the following text. Return a JSON object with: {"sentiment": "positive"|"negative"|"neutral"|"mixed", "confidence": 0-100, "emotions": ["emotion1", "emotion2"], "summary": "brief explanation"}. Return ONLY valid JSON.`;
        break;
      case "compose_email":
        systemPrompt = `You are an expert Japanese/English business email composer. Write a professional business email based on the user's context.
Language: ${emailLang === 'ja' ? 'Japanese' : 'English'}
Tone: ${tone === 'keigo' ? 'Formal Japanese with proper 敬語 (keigo) - use 尊敬語 and 謙譲語 appropriately' : tone === 'formal' ? 'Formal and professional' : tone === 'polite' ? 'Polite but warm' : 'Casual but professional'}
${recipient ? `Recipient: ${recipient}` : ''}
Include proper greeting, body, and closing. For Japanese emails, use proper ビジネスメール format with 拝啓/敬具 or appropriate opening/closing.
Return ONLY the email text.`;
        break;
      case "keigo_check":
        systemPrompt = `You are an expert in Japanese 敬語 (keigo/honorific language). Analyze the following Japanese text for:
1. **敬語レベル判定** (Keigo Level): Rate the politeness level (カジュアル/丁寧語/尊敬語/謙譲語)
2. **問題点** (Issues): Identify any incorrect or inappropriate keigo usage
3. **改善提案** (Suggestions): Provide corrected versions with explanations
4. **ビジネスシーン適合性** (Business Appropriateness): Rate if suitable for business (★☆☆☆☆ to ★★★★★)
5. **改善版** (Improved Version): Rewrite the text with proper keigo

Format your response in markdown with clear sections. If the text is not Japanese, explain that this tool is designed for Japanese text analysis.`;
        break;
      case "meeting_minutes":
        systemPrompt = `You are an expert meeting minutes generator for Japanese business environments. Convert the raw notes into structured meeting minutes (議事録).
Language: ${minutesLang === 'ja' ? 'Japanese' : 'English'}
${meetingTitle ? `Meeting Title: ${meetingTitle}` : ''}

Format the output as:
${minutesLang === 'ja' ? `
# 議事録
**会議名**: ${meetingTitle || '[会議名]'}
**日時**: [推定日時]
**参加者**: [ノートから推定]

## 議題・討議事項
- 箇条書きで主要議題

## 決定事項
- 決定された内容

## アクションアイテム
| 担当者 | タスク | 期限 |
|--------|--------|------|

## 次回会議
- 予定・議題
` : `
# Meeting Minutes
**Meeting**: ${meetingTitle || '[Title]'}
**Date**: [estimated]
**Attendees**: [from notes]

## Agenda & Discussion
## Decisions
## Action Items
| Owner | Task | Deadline |
## Next Meeting
`}`;
        break;
      case "resume_analyze": {
        const typeLabel = resumeType === 'shokumukeirekisho' ? '職務経歴書' : resumeType === 'rirekisho' ? '履歴書' : 'English Resume/CV';
        const industryLabel = targetIndustry === 'it' ? 'IT/Software' : targetIndustry === 'finance' ? 'Finance/Banking' : targetIndustry === 'consulting' ? 'Consulting' : targetIndustry === 'manufacturing' ? 'Manufacturing' : 'General';
        systemPrompt = `You are a senior Japanese career advisor and resume reviewer with 20+ years experience in ${industryLabel}.
Analyze the following ${typeLabel} and provide detailed, actionable feedback.

Language: ${resumeLang === 'ja' ? 'Japanese' : 'English'}

Evaluate and provide feedback on:
${resumeLang === 'ja' ? `
## 総合評価 (★☆☆☆☆ ～ ★★★★★)

## 構成・フォーマット
- ${resumeType === 'shokumukeirekisho' ? '職務経歴書' : '履歴書'}としての正しい形式に従っているか
- 読みやすさ、情報の整理

## 内容の充実度
- 実績・成果の具体性（数字、KPI）
- スキル・経験の訴求力
- ${industryLabel}業界への適合性

## 言語・表現
- ビジネス日本語の適切さ
- 敬語・謙譲語の正確性
- 誤字・脱字

## 改善提案
- 具体的な改善案（ビフォー→アフター形式）
- 追加すべき情報
- 削除すべき不要な情報

## 改善後サンプル
- 最も重要な改善箇所を反映した修正例` : `
## Overall Rating (★☆☆☆☆ to ★★★★★)

## Structure & Format
- Correct format for ${typeLabel}
- Readability and organization

## Content Quality
- Specificity of achievements (numbers, KPIs)
- Skills and experience appeal
- Fit for ${industryLabel} industry

## Language & Expression
- Business Japanese appropriateness
- Keigo accuracy
- Typos and errors

## Improvement Suggestions
- Specific improvements (Before → After)
- Information to add
- Information to remove

## Revised Sample
- Key improvements applied`}`;
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini error:", response.status, t);
      return new Response(JSON.stringify({ error: `Gemini error (${response.status})` }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tools error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
