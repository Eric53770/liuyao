

輸入盤面備註後，按「預覽與儲存 JPG」，即可保存至本機，或登入自己的 Google 帳號上傳至「我的雲端硬碟」。圖片包含產生預覽當下的盤面及備註。

## 更新網站

解壓縮後，將檔案放到 GitHub liuyao 專案目前 index.html 所在目錄，覆蓋同名檔案。ZIP 直接以 index.html 為根目錄。

## Google 授權設定

網站：https://eric53770.github.io/liuyao/
Google Auth Platform → 用戶端 → 選擇本程式使用的用戶端：
已授權的 JavaScript 來源必須包含 https://eric53770.github.io（不要加 /liuyao/）。
若顯示 origin_mismatch，請核對實際開啟網站的來源與此欄位是否一致。此錯誤必須修正 Google 控制台的設定，更新網站檔案本身不會解除。
測試模式下，請在「目標對象 → 測試使用者」加入準備登入的 Google 帳號。

## 驗證與限制

已通過 JavaScript 語法檢查、模擬 Google 授權／上傳測試與模擬 Canvas 圖片測試。尚未完成真實帳號上傳與瀏覽器視覺驗證。

node tests/cloud-upload.cjs
node tests/image.cjs

圖片超過 5 MB 時不進行雲端上傳；備註超過可用畫布大小時會提示縮短，不會靜默截斷。
