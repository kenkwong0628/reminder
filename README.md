# Reminder

個人每日 checklist：護膚 · 行程 · 健身 · 飲食。粵語 UI，資料只存瀏覽器 `localStorage`，部署喺 **GitHub Pages** 靜態站。

## MVP 做咗咩

- 第一次設定：短問卷 → **AI**（client-side，你自己嘅 API key）或 **本地模板** 產出 routines → 接受後儲存
- 或者 **貼上匯入** chat 產生嘅 setup JSON（亦支援 `?import=`）
- 今日主畫面：由已儲存 routines 產生 checklist（唔會每日再 call AI）
- **分類打卡**：護膚 · 行程 · 健身 · 飲食 分開勾；日曆用色點顯示；「已連續跟到目標 X 日」= 連續全日四類齊
- 輕量改 routines／設定 API key
- **冇** push 通知、登入、跨裝置同步

## 匯入 setup JSON

1. 開站 → 第一次設定畫面撳 **貼上匯入**（或者設定頁同一掣）
2. 貼上符合 schema 嘅 JSON（可連 markdown ` ```json ` fence）→ **匯入並開始用**
3. App 會寫入 `localStorage` key `reminder.app.v1`（`setupComplete: true` + routines），然後顯示今日 checklist

網址參數（適合短 payload）：

```
https://kenkwong0628.github.io/reminder/?import=<URI-encoded-JSON>
```

亦接受 base64／base64url 編碼嘅同一份 JSON。匯入後會自動清走 query。

## 本機開發

```bash
npm install
npm run dev
```

Build：

```bash
npm run build
npm run preview
```

`vite.config.ts` 設咗 `base: '/reminder/'`（配合 GitHub Pages project site）。

## AI 設定（client-side only）

1. 開 app → **設定**
2. 填 OpenAI-compatible **API key**、可選 base URL／model（預設 `https://api.openai.com/v1` + `gpt-4o-mini`）
3. 第一次設定揀「AI」就會由**你部瀏覽器**直接打 API；key 只存 `localStorage`
4. 唔想用 key：揀「本地模板」一樣可以完成 setup

注意：瀏覽器直打第三方 API 可能受 CORS 限制；失敗會自動 fallback 本地模板。

## 開 GitHub Pages

1. Merge PR 去 `main`（workflow：`.github/workflows/pages.yml`）
2. Repo → **Settings → Pages**
3. **Source** 揀 **GitHub Actions**
4. 等 workflow 綠燈；站點約：`https://kenkwong0628.github.io/reminder/`

如果 repo 係 private，要有 GitHub Pages 權限（個人帳通常要付費 plan，或者暫時轉 public）。

## Tech

Vite + React + TypeScript。唔好改 `notes`／`techo` repo — Reminder 獨立喺呢個 repo。
