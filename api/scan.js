// Vercel Serverless Function：收到課本照片 → 呼叫 OpenAI 視覺模型 → 回傳單字 JSON。
// 需要的環境變數（在 Vercel 專案 Settings → Environment Variables 設定）：
//   OPENAI_API_KEY  必填，OpenAI API 金鑰（只存在伺服器，不會傳到手機）
//   APP_PASSCODE    建議設定，通關密碼；沒設的話任何拿到網址的人都能用你的額度
//   OPENAI_MODEL    選填，預設 gpt-4.1
const crypto = require("crypto");

const PROMPT = `這是一張台灣國中英語課本「單字表」頁面的照片。請把頁面上每一個單字條目整理成 JSON。

每個條目通常有：編號、英文單字（可能有變化形，例如 "spend / spent"）、詞性縮寫（n. v. adj. adv. pron. prep. 等）、繁體中文意思、KK 音標（在方括號裡）、一句英文例句（例句中該單字常以不同顏色標示）。

規則：
- en：照課本原樣，保留 " / " 的變化形。片語（如 "leave for"）也算一個條目。
- pos：照課本的詞性縮寫；片語沒有詞性就填 "phr."。
- zh：照課本的繁體中文意思，不要自己翻譯。
- ipa：照課本音標原樣，含方括號，例如 "[spɛnd] / [spɛnt]"。看不清楚就填空字串。
- example：完整英文例句。若有兩句，只取第一句。若被手指或頁緣遮住一小段，依上下文補上最可能的字。
- hl：例句中對應這個單字的那個字（照例句裡的寫法，例如 "spent"、"boats"）。
- 只收這一頁主要的單字條目，依編號順序；忽略照片邊緣被切掉的隔壁頁。
- title：若看得到課名或頁碼，寫成像 "Lesson 5 單字（p.129）"；看不到就寫 "新的單字"。

只回傳 JSON，不要其他文字，格式：
{"title":"...","cards":[{"en":"","pos":"","zh":"","ipa":"","example":"","hl":""}]}`;

function samePass(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  const passcode = process.env.APP_PASSCODE || "";
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({ ok: !!process.env.OPENAI_API_KEY, needsPasscode: !!passcode });
  }
  if (req.method !== "POST") return res.status(405).json({ code: "method", error: "只接受 POST" });

  if (passcode && !samePass(req.headers["x-app-passcode"], passcode)) {
    return res.status(401).json({ code: "bad_passcode", error: "通關密碼不對" });
  }
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ code: "no_key", error: "伺服器沒有設定 OPENAI_API_KEY" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const image = body && body.image;
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
    return res.status(400).json({ code: "bad_image", error: "沒有收到照片" });
  }
  if (image.length > 4_000_000) return res.status(413).json({ code: "too_large", error: "照片太大" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ] }],
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error("OpenAI error", r.status, j && j.error);
      return res.status(502).json({ code: "openai", error: (j && j.error && j.error.message) || "OpenAI 回應錯誤" });
    }
    const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    const out = JSON.parse(text || "{}");
    return res.status(200).json({ title: String(out.title || ""), cards: Array.isArray(out.cards) ? out.cards : [] });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ code: "openai", error: "辨識失敗" });
  }
};
