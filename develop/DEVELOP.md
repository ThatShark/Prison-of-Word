## 變數說明

* *game.js > sceneVariable > place*：  
用來紀錄玩家當前所處「空間」，而空間內應有不同的角落（可互動物件）。  
如要紀錄玩家位於「房間中央」，那麼此變數之值應為「房間」；  
至於玩家在「房間外」的話，應記錄其所在位置的確切名稱，如「家門口廣場」、「客廳」、「廚房」、「後花園」、「陽台」等，
同理，應視為處於該場地之中央。
* *game.js > sceneVariable > object*：  
用來紀錄玩家當前所處空間中「所能觸及的範圍之代表物」，而其物品應為一標示或可互動物件。  
如果玩家在門邊，不論其是否在房間內，此變數值應為「門」；  
而如果玩家可以與餐桌上的「飲料」、「空杯」、「眼鏡」、「餐巾紙」等物品互動，則此變數值應為「餐桌」。

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

- [x] 新增「逐字顯示文字」動畫（新增`tempCanvas`、已顯示文字計數器、玩家進行新操作時顯示新的訊息內容，但單純拔除磁條時，仍然繼續顯示或持續進行動畫）
- [x] 場景非即時切換

* 2024/02/08 08:20 [m]

1. 將`main.js`拆分成`constants.js`、`main.js`、`game.js`三個檔案（`constants.js`存放不該在執行中變動的常數變數，用`screaming snake case`來命名；`main.js`主要進行頁面中元素以及事件監聽的直接操作；`game.js`處理遊戲內邏輯及畫布繪製）
2. 將`game.js`中的`gameVariable`改名為`sceneVariable`
3. 新增變數說明區段

* 2024/02/08 11:41 [m]

1. 新增「逐字顯示文字」動畫系統至`script/game.js`
2. 將`sceneVariable`的初始化移至`renderScene`內
3. 新增文字動畫系統之樣式參數標籤至`data/dialog.json > story > 0 > dialog > "--@未初始化>*" > message`，演示顯示速度、文字粗細的的本變化

* 2024/02/08 14:15 [m]

1. 新增「字卡拖放」系統至`script/game.js`
2. 新增`data/partOfSpeech.txt`來存放字卡的詞性資料
3. 新增`develop`資料夾來存放開發資料與「bug精選」圖片
4. 以黑色填充`dialog`背景（當無法讀取圖片或找不到語句時，才不會產生「背景未刷新」的疊影，見[20240208135023.png](image/bug/20240208135023.png)）

* 2024/02/08 15:27 [m]

1. 重新繪製標題文字
2. 更改按鈕預設顏色

* 2024/02/08 16:50 [m]

1. 新增`glow`、`shadow`兩種文字效果
2. 更改對話內容以做為測試
3. 更改`data/menu.json`的按鈕文字，使其較適合長形按鈕
4. 更改預設字體為`Zpix`
5. `dialog`支援非組合型`emoji`
6. `dialog`可透過以「備份」為後墜的鍵做還原

* 2024/02/09 14:34 [m]

1. `dialog`文字效果參數新增`deltaX`、`deltaY`
2. 未使用過的字卡繪製「發光效果」
3. 新得到的字卡加上「飛入動畫」
4. `dialog`的`glow`支援顏色以及`color.wordBoxSAndO`、`color.wordBoxV`顏色的直接套用
5. 將畫面更新間隔改為30毫秒
6. 字卡區域捲動功能
7. 將「從`s`、`v`、`o`欄位取出的字卡」至於字卡清單的末端
8. 將沒有詞性資料的字卡繪製為與禁用之按鈕相同的顏色
9. 新增截圖功能及動畫

* 2024/02/09 15:51 [t]

1. more, more 故事
2. 增加default劇情(非預期情況的劇情)
3. 重新更改劇情寫法(其實是我發現該怎麼寫了)
4. 將`place`改成`scene`，`check`改成`at`，增加可讀性(`scene`所在場景，`at`為所處位置)

* 2024/02/09 20:18 [t]

1. 新增tip
2. 將tip設於首頁，每5秒隨機刷新

* 2024/02/09 22:00 [m]

1. 新增後台系統（未完成）