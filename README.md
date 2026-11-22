# 77English_Learning：拍照單字卡

幫孩子背英文單字的網頁 App。把課本的單字頁拍下來，就會自動整理成可以翻面的單字卡：正面是英文和音標，背面是中文、詞性和例句。點英文會唸出發音。

目前版本：**v2.0**（版本紀錄見 [CHANGELOG.md](CHANGELOG.md)）

## 怎麼用

1. 用手機打開網址（部署到 Vercel 後拿到的 `https://xxxx.vercel.app`）。建議加到主畫面，用起來就像一般 App。
2. 按「拍照新增單字」，拍一頁課本單字表，或從相簿選照片（可以一次選多張）。
3. 第一次使用要輸入通關密碼，之後會自動記住。
4. 按「開始辨識」，大約 10–40 秒後會列出所有單字。對照課本檢查一下，有錯直接改，再按「儲存」。
5. 練習：
   - 點卡片就會翻面；點喇叭或英文就會唸出來，點例句會唸整句。
   - 用「記住了」和「還不熟」標記。練完一輪後，可以只練還不熟的。
   - 可以選先看英文面或中文面，也可以打開隨機順序和自動發音。
   - 「全部卡片」會把整組單字排成卡片牆，每張都能翻。

## 第一次設定（大約 10 分鐘）

### 1. 申請 OpenAI API 金鑰
1. 到 https://platform.openai.com 註冊或登入。
2. 到 **Settings → Billing** 綁定信用卡並儲值，例如 5 美元。辨識一頁大約花台幣幾毛錢。
3. 到 **API keys**，按 **Create new secret key** 建立金鑰，然後複製下來（以 `sk-` 開頭）。這把金鑰等於你的錢包，不要傳給別人。

### 2. 部署到 Vercel
1. 到 https://vercel.com ，用 GitHub 帳號登入。
2. 按 **Add New… → Project**，選 `77English_Learning` 倉庫，再按 **Import**。
3. 在設定畫面打開 **Environment Variables**，加入以下兩個變數：
   | Name | Value |
   |---|---|
   | `OPENAI_API_KEY` | 剛剛複製的 `sk-...` 金鑰 |
   | `APP_PASSCODE` | 自己取的通關密碼，例如 `0715`（家人共用） |
4. 按 **Deploy**。等一分鐘左右，就會拿到網址。

之後只要 GitHub 的 `main` 有更新，Vercel 就會自動重新部署。

### 選填設定
- `OPENAI_MODEL`：改用其他 OpenAI 模型，預設是 `gpt-4.1`。如果辨識時出現「model not found」之類的錯誤，就把它設成你帳號可用的視覺模型，例如 `gpt-4o`。

## 技術說明

- `index.html`：整個 App，只有一個檔案，不需要安裝任何東西。
- `api/scan.js`：Vercel Serverless Function。收到照片後呼叫 OpenAI 視覺模型，回傳單字 JSON。金鑰只存在伺服器上，手機拿不到。
- 通關密碼 `APP_PASSCODE` 用來防止別人拿到網址後，花你的 OpenAI 額度。
- 發音使用瀏覽器內建的 Web Speech API，iPhone、Android 和電腦都支援。
- 單字卡存在手機瀏覽器的 localStorage 裡。換手機或清除瀏覽資料，單字卡就不會帶過去。
- 如果在 Claude Artifact 裡開啟，App 會改用 Claude 辨識照片，單字卡則存到 Claude 帳號。
