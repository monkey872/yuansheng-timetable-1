# 元生國民小學 115學年度第1學期課表查詢系統

本網站依 `littleyi22/timetable-demo` 的靜態網站架構製作：HTML + CSS + JavaScript + CSV + JSON，不需要 Firebase 或資料庫即可部署。

## 已完成

- 讀取 `/mnt/data/1-6年級課表.pdf`
- 解析 65 個班級（101～110、201～211、301～311、401～411、501～511、601～610）
- 產生 `timetable_115-1.csv`
- 產生 `homerooms_115-1.json`
- 修改 `config.js`、`index.html`
- 針對國小一～六年級調整查詢介面
- 支援教師查詢；單/雙週教師也會保留
- 支援列印 A4 橫式課表
- 附 GitHub Pages Actions，可直接部署

## 資料統計

- 班級數：65
- 教師名稱數：121
- CSV 教師資料列：124
- 課程配置筆數：1854
- 學校：桃園市中壢區元生國民小學
- 學期：115學年度第1學期

## GitHub Pages 部署

1. 在 GitHub 建立一個新的 repository。
2. 將本資料夾全部檔案上傳到 repository 的 `main` 分支。
3. 進入 GitHub → Settings → Pages。
4. Source 選擇 **GitHub Actions**。
5. Actions 執行完成後，網站即可由 GitHub Pages 提供。

注意：本系統是公開靜態網站。若不希望公開帳號密碼或課表資料，建議不要把 repository 設為 public，或改用校內網站/具權限控管的主機。
