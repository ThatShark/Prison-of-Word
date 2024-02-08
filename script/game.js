'use strict';
async function initGameCycle(initData) {
	/* declare shared object variable */
	const { CW, CH } = initData;
	const { cvs, ctx } = initData;
	const { mouse } = initData;

	/* all manner of colors and fonts */
	const color = {
		buttonHover: 'white',
		// buttonDefault: '#6585ad',
		buttonDefault: '#b5986a',
		buttonDisabled: 'gray',
		buttonBgc: '#00000055',
		wordBoxSAndO: '#ffc107',
		wordBoxV: '#ff5722'
	};
	const font = {
		// default: '微軟正黑'
		default: 'Zpix'
	}

	/* get all manner of materials */
	async function getData(url, type) {
		return await fetch(url).then(r => r[type]());
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
	const menuData = await getData('data/menu.json', 'json');
	const dialogData = await getData('data/dialog.json', 'json');
	const partOfSpeechData = Object.fromEntries((await getData('data/partOfSpeech.txt', 'text'))?.replaceAll('\r', '').split('\n').map(line => line.split(' ')).map(KVPair => [KVPair[1], KVPair[0]]));
	function isHover(mouse, display) {
		return mouse.x > display.x && mouse.y > display.y && mouse.x < display.x + display.w && mouse.y < display.y + display.h;
	}
	async function drawButton(element) {
		ctx.lineWidth = 5;
		ctx.font = `50px ${font.default}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		let mouseHover = isHover(mouse, element.display);
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
				sceneVariable['draggingWord'] = undefined;
				sceneVariable['place'] = '未初始化';
				sceneVariable['object'] = '無';
				sceneVariable['s'] = '';
				sceneVariable['v'] = '';
				sceneVariable['o'] = '';
				sceneVariable['words'] = [];
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
						dialog.words.forEach(word => {
							if (!sceneVariable['words'].includes(word)) sceneVariable['words'].push(word);
						});
						break;
					}
				}

				let fontSize = 50;
				let dialogBoxPadding = 50;
				let lineSpacing = 0;
				let lineLength = Math.floor((dialogBoxDisplay.w - dialogBoxPadding * 2) / fontSize);
				let maxLineNumber = Math.floor((dialogBoxDisplay.h - dialogBoxPadding * 2) / (fontSize + lineSpacing));

				let attribute = [];
				let messageData = [];
				// let charList = dialog.message.split('');
				let charList = [...dialog.message]; // 不拆分非組合型 emoji

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

				let lineNumber = Math.ceil(messageData.length / lineLength);
				if (lineNumber > maxLineNumber) {
					throw Error(`'dialog.message' overflow! Message length is ${messageData.length}, but it only allow ${lineLength * maxLineNumber}`);
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
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, CW, CH);
			if (dialog.image) {
				ctx.drawImage(await getImage(dialog.image), 0, 0, CW, CH); // scene background
			}
			// dialog message box
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
					tempCtx.save();
					if ('italic' in charData.attribute || 'oblique' in charData.attribute) charData.attribute.style = 'oblique';
					if ('bold' in charData.attribute || 'bolder' in charData.attribute) charData.attribute.weight = 'bolder';
					if ('light' in charData.attribute || 'lighter' in charData.attribute) charData.attribute.weight = 'lighter';
					tempCtx.font = [
						charData.attribute.style ? charData.attribute.style : 'normal',
						charData.attribute.variant ? charData.attribute.variant : 'normal',
						charData.attribute.weight ? charData.attribute.weight : 'normal',
						`${charData.attribute.size ? parseFloat(charData.attribute.size) : 5}px`,
						charData.attribute.family ? charData.attribute.family : font.default
					].join(' ');
					tempCtx.fillStyle = charData.attribute.color ? charData.attribute.color : 'white';
					if ('glow' in charData.attribute) {
						tempCtx.shadowBlur = 10;
						tempCtx.shadowColor = tempCtx.fillStyle;
					} else if ('shadow' in charData.attribute) {
						tempCtx.shadowBlur = 10;
						tempCtx.shadowColor = charData.attribute.shadow ? charData.attribute.shadow : 'black';
					}
					tempCtx.fillText(charData.char, charData.x, charData.y);

					aniDeltaTime -= charMiniSec;
					sceneVariable['dialogMessageAniTimeLeft'] += charMiniSec;
					sceneVariable['dialogMessageAniChar']++;
					charData = sceneVariable['dialogMessageData'][sceneVariable['dialogMessageAniChar']];
					if (charData === undefined) break;
					charMiniSec = parseInt(charData.attribute.miniSec);
					tempCtx.restore();
				}
			}
			ctx.drawImage(tempCvs, 0, 0);
			// words box
			ctx.fillStyle = '#00000088';
			ctx.strokeStyle = color.buttonHover;
			var wordsBoxDisplay = { x: 50, y: 50, w: 370, h: 980 };
			var wordsBoxPadding = 50;
			var wordHeight = 100;
			var wordGap = 30;
			var { x, y, w, h } = wordsBoxDisplay;
			ctx.fillRect(x, y, w, h);
			ctx.strokeRect(x, y, w, h);
			var [x, y, w, h] = [0, 0, 0, 0]

			var wordBoxDisplay = {
				s: { x: 470, y: 590, w: 440, h: wordHeight },
				v: { x: 470 + (440 + 40), y: 590, w: 440, h: wordHeight },
				o: { x: 470 + (440 + 40) * 2, y: 590, w: 440, h: wordHeight }
			}
			// word box - s
			ctx.strokeStyle = color.wordBoxSAndO;
			ctx.strokeRect(wordBoxDisplay.s.x, wordBoxDisplay.s.y, wordBoxDisplay.s.w, wordBoxDisplay.s.h);
			// word box - o
			ctx.strokeRect(wordBoxDisplay.o.x, wordBoxDisplay.o.y, wordBoxDisplay.o.w, wordBoxDisplay.o.h);
			// word box - v
			ctx.strokeStyle = color.wordBoxV;
			ctx.strokeRect(wordBoxDisplay.v.x, wordBoxDisplay.v.y, wordBoxDisplay.v.w, wordBoxDisplay.v.h);

			async function drawWord(ctx, wordData) {
				let fontSize = 50;
				ctx.lineWidth = 5;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				let mouseHover = isHover(mouse, wordData);
				let partOfSpeech = partOfSpeechData[wordData.label];
				let scale = 1;
				if (sceneVariable['draggingWord'] === wordData.label) {
					[wordData.x, wordData.y] = [mouse.x - wordData.w / 2, mouse.y - wordData.h / 2];
					scale = 0.8;
					if (mouse.up) {
						sceneVariable['draggingWord'] = undefined;
						['s', 'v', 'o'].forEach(type => {
							if (
								isHover(mouse, wordBoxDisplay[type]) &&
								((partOfSpeech == 'v' && type == partOfSpeech) ||
									(partOfSpeech == 'n' && ['s', 'o'].includes(type)))
							) sceneVariable[type] = wordData.label;
						});
						scale = 1;
					}
				} else if (mouseHover) {
					scale = 1.05;
					if (mouse.down) {
						sceneVariable['draggingWord'] = wordData.label;
						if (wordData.type !== undefined) sceneVariable[wordData.type] = '';

					}
				}

				[wordData.x, wordData.y, wordData.w, wordData.h] = [wordData.x + wordData.w * (1 - scale) / 2, wordData.y + wordData.h * (1 - scale) / 2, wordData.w * scale, wordData.h * scale]
				fontSize *= scale;

				ctx.fillStyle = color.buttonBgc;
				ctx.fillRect(wordData.x, wordData.y, wordData.w, wordData.h);
				ctx.strokeStyle = partOfSpeech == 'v' ? color.wordBoxV : color.wordBoxSAndO;
				ctx.fillStyle = 'white';
				ctx.strokeRect(wordData.x, wordData.y, wordData.w, wordData.h);
				ctx.font = `${fontSize}px ${font.default}`;
				ctx.fillText(wordData.label, wordData.x + wordData.w / 2, wordData.y + wordData.h / 2);
			}
			let deltaI = 0;
			for (let i = 0; i < sceneVariable['words'].length; i++) {
				ctx.fillStyle = 'black';
				ctx.strokeStyle = 'gray';
				let wordData = {
					x: wordsBoxDisplay.x + wordsBoxPadding,
					y: wordsBoxDisplay.y + wordsBoxPadding + (i - deltaI) * (wordHeight + wordGap),
					w: wordsBoxDisplay.w - wordsBoxPadding * 2,
					h: wordHeight,
					label: sceneVariable['words'][i],
					type: undefined
				};
				for (let type of ['s', 'v', 'o']) {
					if (sceneVariable[type] == wordData.label) {
						let { x, y, w, h } = wordBoxDisplay[type];
						[wordData.x, wordData.y, wordData.w, wordData.h] = [x, y, w, h];
						wordData.type = type;
						deltaI++;
						break;
					}
				}
				drawWord(ctx, wordData);
			}

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

		}
		mouse.click = false;
		mouse.down = false;
		mouse.up = false;
	}

	/* background */
	let currentScene = ['menu', 'main']; // or 'dialog'
	async function gameCycle() {
		await renderScene(currentScene);
		setTimeout(gameCycle, 50);
	}
	return gameCycle;
}