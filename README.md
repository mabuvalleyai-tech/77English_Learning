# 77English_Learning：拍照單字卡

幫孩子背英文單字的網頁 App。把課本的單字頁拍下來，就會自動整理成可以翻面的單字卡：正面是英文和音標，背面是中文、詞性和例句。點英文會用自然人聲唸出發音。

目前版本：**v2.1**　網址：https://77english-wordcards.vercel.app （版本紀錄見 [CHANGELOG.md](CHANGELOG.md)）

## 怎麼用

1. 用手機打開網址，然後加到主畫面，之後用起來就像一般 App。iPhone 在 Safari 按「分享」→「加入主畫面」；Android 在 Chrome 選單選「加到主畫面」。
2. 按「拍照新增單字」，拍一頁課本單字表，或從相簿選照片，一次可以選很多張。
3. 按「開始辨識」，大約 10–40 秒後會列出所有單字。對照課本檢查一下，有錯直接改，然後按「儲存」。
4. 練習：
   - 點卡片翻面；點喇叭或英文就會唸出來，點例句會唸整句。
   - 用「記住了」和「還不熟」標記，按「‹」可以回到上一張。練完一輪後，可以只練還不熟的。
   - 可以選先看英文面還是中文面，也可以打開隨機順序和自動發音。
   - 「全部卡片」會把整組單字排成卡片牆，每張都能翻。
   - 首頁可以調整發音速度，也可以切換成「自然人聲」或「手機內建」的聲音。

## 第一次設定（大約 10 分鐘）

### 1. 申請 OpenAI API 金鑰
1. 到 https://platform.openai.com 註冊或登入。
2. 到 **Settings → Billing** 綁定信用卡並儲值，例如 5 美元。辨識一頁大約花台幣幾毛錢；每個單字的發音只會產生一次，費用更少。
3. 到 **API keys**，按 **Create new secret key** 建立金鑰，然後複製下來（以 `sk-` 開頭）。這把金鑰等於你的錢包，不要傳給別人。
4. **建議**到 **Settings → Limits** 設一個每月上限，例如 5 美元。因為網址沒有密碼，這樣就算網址外流，也不會被用太多錢。

### 2. 部署到 Vercel
1. 到 https://vercel.com ，用 GitHub 帳號登入。
2. 按 **Add New… → Project**，選 `77English_Learning` 倉庫，再按 **Import**。
3. 在 **Environment Variables** 加入 `OPENAI_API_KEY`，值填剛剛複製的 `sk-...` 金鑰。
4. 按 **Deploy**。等一分鐘左右，就會拿到網址。

之後只要 GitHub 的 `main` 有更新，Vercel 就會自動重新部署。每個 PR 也會有自己的預覽網址，可以先試用再合併。

### 選填設定（Environment Variables）
| 變數 | 說明 |
|---|---|
| `OPENAI_MODEL` | 辨識照片用的模型，預設 `gpt-4.1`。如果出現「model not found」，就改成你帳號可以用的視覺模型，例如 `gpt-4o`。 |
| `OPENAI_TTS_MODEL` | 發音用的模型，預設 `gpt-4o-mini-tts`。 |
| `OPENAI_TTS_VOICE` | 發音的聲音，預設 `coral`（溫和的女聲）。也可以改成 `alloy`、`ash`、`nova`、`sage` 等。 |
| `APP_PASSCODE` | 想加通關密碼時才設定。設定之後，第一次拍照前要先輸入密碼。 |

## 技術說明

- `index.html`：整個 App，只有一個檔案。
- `api/scan.js`：收到照片後，呼叫 OpenAI 視覺模型，回傳單字 JSON。
- `api/tts.js`：用 OpenAI 產生自然人聲發音。同一句話的聲音會由 Vercel CDN 快取一年，所以只付一次錢。
- 這兩支都是 Vercel Serverless Function，金鑰只存在伺服器上，手機拿不到。
- `manifest.webmanifest`、`icon-*.png`：加到主畫面時用的 App 名稱和圖示。
- 自然人聲無法使用時，會自動改用瀏覽器內建的 Web Speech API。
- 單字卡存在手機瀏覽器的 localStorage 裡。換手機或清除瀏覽資料之後，單字卡就不會帶過去。
- 如果在 Claude Artifact 裡開啟，就改用 Claude 辨識照片，單字卡存在 Claude 帳號。
