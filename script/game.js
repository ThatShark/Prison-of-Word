'use strict';
async function initGameCycle(initData) {
	/* declare shared object variable */
	const { CW, CH } = initData;
	const { cvs, ctx } = initData;
	const { mouse } = initData;

	/* all manner of colors */
	const color = {
		buttonHover: 'white',
		buttonDefault: '#6585ad',
		buttonDisabled: 'gray',
		buttonBgc: '#00000055',
		wordBoxSAndO: '#ffc107',
		wordBoxV: '#ff5722'
	};

	/* get all manner of materials */
	async function getData(url) {
		return await fetch(url).then(r => r.json());
	}
	function loadMaterial(url, _constructor, eventName = 'onload') {
		return new Promise(resolve => {
			let element = new _constructor();
			element[eventName] = () => {
				resolve(element);
			};
			element.src = url;
		});
	}
	const imageCatch = {};
	async function getImage(url) {
		if (url in imageCatch) {
			return imageCatch[url];
		} else {
			let image = await loadMaterial(url, Image);
			imageCatch[url] = image;
			return (image);
		}
	}

	/* render method */
	const menuData = await getData('data/menu.json');
	const dialogData = await getData('data/dialog.json');
	async function drawButton(element) {
		ctx.lineWidth = 5;
		ctx.font = '50px 微軟正黑';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		let mouseHover = mouse.x > element.display?.x && mouse.y > element.display?.y && mouse.x < element.display?.x + element.display?.w && mouse.y < element.display?.y + element.display?.h
		ctx.fillStyle = color.buttonBgc;
		ctx.fillRect(element.display.x, element.display.y, element.display.w, element.display.h);
		if (element.class?.includes('disabled')) {
			ctx.strokeStyle = color.buttonDisabled;
			ctx.fillStyle = color.buttonDisabled;
			element.label = '尚未解鎖';
		} else if (mouseHover) {
			ctx.strokeStyle = color.buttonHover;
			ctx.fillStyle = color.buttonHover;
			if (mouse.click) {
				currentScene = element.destination;
				mouse.click = false;
			}
		} else {
			ctx.strokeStyle = color.buttonDefault;
			ctx.fillStyle = color.buttonDefault;
		}
		ctx.strokeRect(element.display.x, element.display.y, element.display.w, element.display.h);
		ctx.fillText(element.label, element.display.x + element.display.w / 2, element.display.y + element.display.h / 2);
	}
	async function renderMenu(menuLabel) {
		const data = menuData[menuLabel];
		if (!data) return;
		ctx.save();

		for (let element of data.elements) {
			switch (element.type) {
				case 'rect':
					if (element.fill !== undefined) {
						ctx.fillStyle = element.fill;
						ctx.fillRect(element.display?.x, element.display?.y, element.display?.w, element.display?.h);
					}
					if (element.stroke !== undefined) {
						ctx.strokeStyle = element.stroke;
						ctx.strokeRect(element.display?.x, element.display?.y, element.display?.w, element.display?.h);
					}
					break;
				case 'image':
					ctx.drawImage(await getImage(element.url), element.display?.x, element.display?.y, element.display?.w, element.display?.h);
					break;
				case 'button':
					await drawButton(element);
					break;
				case 'buttonList':
					for (let i = 0; i < element.button.length; i++) {
						let buttonDisplayData = {
							x: element.display?.x + (element.display?.xInc !== undefined ? element.display?.xInc : 0) * i,
							y: element.display?.y + (element.display?.yInc !== undefined ? element.display?.yInc : 0) * i,
							w: element.display?.w,
							h: element.display?.h
						}
						await drawButton({ display: buttonDisplayData, ...element.button[i] });
					}
					break;
				case 'buttonGrid':
					for (let r = 0; r < element.button.length; r++) {
						for (let c = 0; c < element.button[r].length; c++) {
							let buttonDisplayData = {
								x: element.display?.x + (element.display?.xInc !== undefined ? element.display?.xInc : 0) * c + (120 / (element.button.length - 1)) * r,
								y: element.display?.y + (element.display?.yInc !== undefined ? element.display?.yInc : 0) * r,
								w: element.display?.w,
								h: element.display?.h
							}
							await drawButton({ display: buttonDisplayData, ...element.button[r][c] });
						}
					}
					break;
			}
		}
		ctx.restore();
		mouse.click = false;
	}

	/* change background */
	const sceneVariable = {};
	const tempCvs = document.createElement('canvas'),
		tempCtx = tempCvs.getContext('2d');
	[tempCvs.width, tempCvs.height] = [CW, CH];
	let lastTime = Date.now();
	async function renderScene(sceneIndex) {
		var [sceneType, sceneId] = sceneIndex;
		var sceneIndexText = `${sceneType}-${sceneId}`;
		let sceneChanged = false;
		if (sceneIndexText !== sceneVariable['laseSceneIndexText']) {
			sceneVariable['laseSceneIndexText'] = sceneIndexText;
			sceneChanged = true;
		}

		let currentTime = Date.now();
		let deltaTime = currentTime - lastTime;
		lastTime = currentTime;

		if (sceneType == 'menu') {
			await renderMenu(sceneId);
		} else if (sceneType == 'dialog') {
			if (sceneChanged) {
				sceneVariable['place'] = '未初始化';
				sceneVariable['object'] = '無';
				sceneVariable['s'] = '';
				sceneVariable['v'] = '';
				sceneVariable['o'] = '';
				sceneVariable['currentDialogKey'] = `--@${sceneVariable['place']}>*`;
			}

			let dialogLevel = parseInt(sceneId);
			let currentStoryDialog = dialogData.story[dialogLevel - 1].dialog;

			let action = `${sceneVariable['s']}-${sceneVariable['v']}-${sceneVariable['o']}`;
			let actionChanged = false;
			if (action !== sceneVariable['lastAction']) {
				sceneVariable['lastAction'] = action;
				actionChanged = true;
			}

			var dialogBoxDisplay = { x: 470, y: 730, w: 1400, h: 300 };
			let dialog = {
				"image": false,
				"message": "",
				"words": [],
				"at": sceneVariable['place'],
				"check": sceneVariable['object']
			};
			if ((actionChanged && ![sceneVariable['s'], sceneVariable['v'], sceneVariable['o']].includes('')) || sceneChanged) {
				sceneVariable['currentDialogKey'] = '--@*>*';
				for (let dialogKey of [
					`${action}@${sceneVariable['place']}>${sceneVariable['object']}`,
					`${action}@${sceneVariable['place']}>*`,
					`${action}@*>*`
				]) {
					if (dialogKey in currentStoryDialog) {
						dialog = currentStoryDialog[dialogKey];
						sceneVariable['currentDialogKey'] = dialogKey;
						if (dialog.at !== false) sceneVariable['place'] = dialog.at;
						if (dialog.check !== false) sceneVariable['object'] = dialog.check;
						break;
					}
				}

				var fontSize = 50;
				var dialogBoxPadding = 50;
				var lineSpacing = 0;
				var lineLength = Math.floor((dialogBoxDisplay.w - dialogBoxPadding * 2) / fontSize);
				var lineNumber = Math.ceil(dialog.message.length / lineLength);
				var maxLineNumber = Math.floor((dialogBoxDisplay.h - dialogBoxPadding * 2) / (fontSize + lineSpacing));

				let attribute = [];
				let messageData = [];
				let charList = dialog.message.split('');

				while (charList.length > 0) {
					let char = charList.shift();
					let line = Math.floor(messageData.length / lineLength);
					let index = messageData.length % lineLength;
					let newChar = undefined;
					switch (char) {
						case '\\':
							if (['\\', '{', '}'].includes(charList[0])) {
								newChar = charList.shift();
							} else {
								attribute.push(charList.splice(0, charList.indexOf('{')).join('').split('_'));
								charList.shift();
							}
							break;
						case '{':
							// error
							break;
						case '}':
							attribute.pop();
							break;
						default:
							newChar = char;
							break;
					}
					if (newChar !== undefined) {
						messageData.push({
							x: dialogBoxDisplay.x + dialogBoxPadding + index * fontSize,
							y: dialogBoxDisplay.y + dialogBoxPadding + line * (fontSize + lineSpacing),
							char: newChar,
							attribute: { miniSec: (100).toString(), size: fontSize.toString(), ...Object.fromEntries(attribute) } // 透過轉換為 object 來去除掉重複的鍵，且讓其保留最後設定的值 
						});
					}
				}
				sceneVariable['dialogMessageData'] = messageData;
				sceneVariable['dialogMessageAniChar'] = 0;
				sceneVariable['dialogMessageAniTimeLeft'] = 0;
				sceneVariable['dialogMessageAniStartTime'] = currentTime;
				[tempCvs.width, tempCvs.height] = [CW, CH]; // 將 tempCvs 重置為透明畫布
			}
			if (sceneVariable['currentDialogKey'] in currentStoryDialog) {
				dialog = currentStoryDialog[sceneVariable['currentDialogKey']];
			}
			if (dialog.image) {
				ctx.drawImage(await getImage(dialog.image), 0, 0, CW, CH); // scene background
			}
			// words box
			ctx.lineWidth = 5;
			ctx.fillStyle = '#00000088';
			ctx.strokeStyle = color.buttonHover;
			var { x, y, w, h } = dialogBoxDisplay;
			ctx.fillRect(x, y, w, h);
			ctx.strokeRect(x, y, w, h);
			var [x, y, w, h] = [0, 0, 0, 0]

			// dialog message
			if (sceneVariable['dialogMessageAniChar'] < sceneVariable['dialogMessageData'].length) {
				tempCtx.textAlign = 'left';
				tempCtx.textBaseline = 'top';
				let aniDeltaTime = currentTime - sceneVariable['dialogMessageAniStartTime'] - sceneVariable['dialogMessageAniTimeLeft'];
				let charData = sceneVariable['dialogMessageData'][sceneVariable['dialogMessageAniChar']];
				let charMiniSec = parseInt(charData.attribute.miniSec);
				while (aniDeltaTime >= charMiniSec) {
					if ('italic' in charData.attribute || 'oblique' in charData.attribute) charData.attribute.style = 'oblique';
					if ('bold' in charData.attribute || 'bolder' in charData.attribute) charData.attribute.weight = 'bolder';
					if ('light' in charData.attribute || 'lighter' in charData.attribute) charData.attribute.weight = 'lighter';
					tempCtx.font = [
						charData.attribute.style ? charData.attribute.style : 'normal',
						charData.attribute.variant ? charData.attribute.variant : 'normal',
						charData.attribute.weight ? charData.attribute.weight : 'normal',
						`${charData.attribute.size ? parseFloat(charData.attribute.size) : 5}px`,
						charData.attribute.family ? charData.attribute.family : '微軟正黑'
					].join(' ');
					tempCtx.fillStyle = charData.attribute.color ? charData.attribute.color : 'white';
					tempCtx.fillText(charData.char, charData.x, charData.y);

					aniDeltaTime -= charMiniSec;
					sceneVariable['dialogMessageAniTimeLeft'] += charMiniSec;
					sceneVariable['dialogMessageAniChar']++;
					charData = sceneVariable['dialogMessageData'][sceneVariable['dialogMessageAniChar']];
					if (charData === undefined) break;
					charMiniSec = parseInt(charData.attribute.miniSec);
				}
			}
			ctx.drawImage(tempCvs, 0, 0);
			if (lineNumber > maxLineNumber) {
				throw Error(`'dialog.message' overflow! Message length is ${dialog.message.length}, but it only allow ${lineLength} * ${maxLineNumber}`);
			}
			// dialog message box
			ctx.fillStyle = '#00000088';
			ctx.strokeStyle = color.buttonHover;
			ctx.fillRect(50, 50, 370, 980);
			ctx.strokeRect(50, 50, 370, 980);

			// word box - s
			ctx.strokeStyle = color.wordBoxSAndO;
			ctx.strokeRect(470, 590, 440, 100);
			// word box - o
			ctx.strokeRect(470 + (440 + 40) * 2, 590, 440, 100);
			// word box - v
			ctx.strokeStyle = color.wordBoxV;
			ctx.strokeRect(470 + (440 + 40), 590, 440, 100);

			// back button
			await drawButton({
				type: 'button',
				display: {
					"x": CW - 200 - 50,
					"y": 50,
					"w": 200,
					"h": 120
				},
				label: '返回',
				destination: ['menu', 'charter']
			});

			mouse.click = false;
		}
	}

	/* background */
	let currentScene = ['menu', 'main']; // or 'dialog'
	async function gameCycle() {
		await renderScene(currentScene);
		setTimeout(gameCycle, 50);
	}
	return gameCycle;
}