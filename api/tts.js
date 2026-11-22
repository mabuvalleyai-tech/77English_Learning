// Vercel Serverless Function：把英文單字或例句變成自然人聲（OpenAI TTS），回傳 mp3。
// 同一句話的結果會被 Vercel CDN 快取一年，所以每個單字只會花一次錢。
// 環境變數：OPENAI_API_KEY（必填）、OPENAI_TTS_MODEL（選填，預設 gpt-4o-mini-tts）、
//          OPENAI_TTS_VOICE（選填，預設 coral）、APP_PASSCODE（選填，設了才需要通關密碼）
const crypto = require("crypto");

function samePass(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  const passcode = process.env.APP_PASSCODE || "";
  if (req.method !== "GET") { res.setHeader("Cache-Control", "no-store"); return res.status(405).json({ error: "只接受 GET" }); }
  if (passcode && !samePass(req.headers["x-app-passcode"], passcode)) {
    res.setHeader("Cache-Control", "no-store"); return res.status(401).json({ code: "bad_passcode" });
  }
  if (!process.env.OPENAI_API_KEY) { res.setHeader("Cache-Control", "no-store"); return res.status(500).json({ code: "no_key" }); }

  const text = String((req.query && req.query.t) || "").trim();
  if (!text || text.length > 300) { res.setHeader("Cache-Control", "no-store"); return res.status(400).json({ code: "bad_text" }); }

  const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
  const body = { model, voice: process.env.OPENAI_TTS_VOICE || "coral", input: text, response_format: "mp3" };
  if (/^gpt-/.test(model)) {
    body.instructions = "You are a warm, friendly American English teacher reading a vocabulary word or example sentence to a Taiwanese junior high school student. Speak clearly and naturally with standard American pronunciation, at a slightly slow, easy-to-follow pace. For a single word, say it once, clearly.";
  }
  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error("OpenAI TTS error", r.status, err.slice(0, 500));
      res.setHeader("Cache-Control", "no-store");
      return res.status(502).json({ code: "openai" });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ code: "openai" });
  }
};
