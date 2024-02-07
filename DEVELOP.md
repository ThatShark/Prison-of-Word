## 更新日誌

* 2024/02/06 23:18 [m]

1. `drawButton`移至與`renderScene`同層
2. 直接在`renderScene`中`dialog`的部分以`drawButton`來繪製返回按鈕
3. 添加`renderScene`中`dialog`的繪製註解
4. `dialogLevel`設定處以`parseInt`進行處理，使其由字串轉為數字，以正常進行關卡索引值計算
5. 新增`currentStoryDialog`變數以省去重複的`dialogData.story[dialogLevel - 1].dialog`（修改前的dialog判斷中因為 `{key} in dialogData.story[dialogLevel - 1].dialog` 寫成 `{key} in dialogData.story[dialogLevel - 1]`所以找不到對應的`dialog`value）
6. 把`data/dialog.json`中的`story > 0 > dialog > 0 > *`移至`story > 0 > dialog > *`以正確匹配`dialogData.story[dialogLevel - 1].dialog[{key}]`之鍵值使用
7. 添加`MC = false;`重置紀錄游標點擊之旗標
8. 將`data/menu.json`的`* > elements > * > destination`由`"{a}-{b}"`改成`[{a}, {b}]`
9. 新增`sceneType`、`sceneId`兩變數來接收`sceneIndex`（原為`sceneName`）
10. 將`data/menu.json`的`* > elements > * > label`由`"尚未解鎖"`改成`{解鎖後的顯示內容}`，並將上鎖機制改成以`"class": ["disabled"]`作為標示（日後`* > elements > * > class`亦可用以標示按鈕的動畫效果）
11. 整理`drawButton`判斷邏輯與元件圖形繪製步驟
12. 將顏色統一整理至`script/main.js`開頭的`color`變數

* 2024/02/07 17:21 [t]

1. 將斜角程式簡化(其實原本是三元運算子寫很順)
2. 增加最一開始劇情
3. 將`dialog`中最一開始的劇情初始化，增加起始位置能不同的可能性
4. 將劇情文字暫時調整為白色，並且將文字下調
5. 增加`dialog.color`屬性，增加劇情文字顏色(預設暫為白色)
6. 將上一位更新日誌一個全形字換成半形

* 2024/02/07 23:27 [m]

1. 將`dialog`文字改以左上角為定位點，並以切斷後逐行布局的方式繪製
2. 提出`dialogBoxDisplay`、`dialogBoxPadding`、`lineSpacing`的額外變數，做統一的布局更改、元素位置調整與子層邊界計算之用
3. 整理`dialog`的逐`key`查找程式碼，並新增`dialogKey`來提供日後的「逐字顯示文字」動畫之用
4. 修正語意錯誤

- [ ] 新增「逐字顯示文字」動畫（新增`tempCanvas`、已顯示文字計數器、玩家進行新操作時顯示新的訊息內容，但單純拔除磁條時，仍然繼續顯示或持續進行動畫）
- [ ] 場景非即時切換