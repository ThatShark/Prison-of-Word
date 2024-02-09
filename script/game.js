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
	let buttonLineWidth = 5;
	async function drawButton(element) {
		ctx.lineWidth = buttonLineWidth;
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

	const tempCvs = {}, tempCtx = {};
	['dialog', 'words', 'draggingWord'].forEach(key => {
		tempCvs[key] = document.createElement('canvas');
		tempCtx[key] = tempCvs[key].getContext('2d');
		[tempCvs[key].width, tempCvs[key].height] = [CW, CH];
	});
	let lastTime = Date.now(), currentTime = undefined;
	async function renderScene(sceneIndex) {
		var [sceneType, sceneId] = sceneIndex;
		var sceneIndexText = `${sceneType}-${sceneId}`;
		let sceneChanged = false;
		if (sceneIndexText !== sceneVariable.laseSceneIndexText) {
			sceneVariable.laseSceneIndexText = sceneIndexText;
			sceneChanged = true;
		}

		if (sceneType == 'menu') {
			await renderMenu(sceneId);
		} else if (sceneType == 'dialog') {
			if (sceneChanged) {
				sceneVariable.draggingWord = undefined;
				sceneVariable.place = '未初始化';
				sceneVariable.object = '無';
				sceneVariable.s = '';
				sceneVariable.v = '';
				sceneVariable.o = '';
				sceneVariable.words = [];
				sceneVariable.newWords = [];
				sceneVariable.getWords = [];
				sceneVariable.currentDialogKey = `--@${sceneVariable.place}>*`;
			}

			let dialogLevel = parseInt(sceneId);
			let currentStoryDialog = dialogData.story[dialogLevel - 1].dialog;

			let action = `${sceneVariable.s}-${sceneVariable.v}-${sceneVariable.o}`;
			let actionChanged = false;
			if (action !== sceneVariable.lastAction) {
				sceneVariable.lastAction = action;
				actionChanged = true;
			}

			var dialogBoxDisplay = { x: 470, y: 730, w: 1400, h: 300 };
			let dialog = {
				"image": false,
				"message": "",
				"words": [],
				"scene": sceneVariable.place,
				"at": sceneVariable.object
			};
			if ((actionChanged && ![sceneVariable.s, sceneVariable.v, sceneVariable.o].includes('')) || sceneChanged) {
				sceneVariable.currentDialogKey = '--@*>*';
				for (let dialogKey of [
					`${action}@${sceneVariable.place}>${sceneVariable.object}`,
					`${action}@${sceneVariable.place}>*`,
					`${action}@*>*`
				]) {
					if (dialogKey in currentStoryDialog) {
						dialog = currentStoryDialog[dialogKey];
						sceneVariable.currentDialogKey = dialogKey;
						if (dialog.scene !== false) sceneVariable.place = dialog.scene;
						if (dialog.at !== false) sceneVariable.object = dialog.at;
						sceneVariable.getWords = dialog.words.filter(word => !sceneVariable.words.includes(word));
						sceneVariable.words.push(...sceneVariable.getWords);
						sceneVariable.newWords.push(...sceneVariable.getWords);
						break;
					} else {
						dialog = currentStoryDialog["default"];
						sceneVariable.currentDialogKey = "default";
						sceneVariable.getWords = [];
					}
				}

				let fontSize = 50;
				let dialogBoxPadding = 50;
				let lineSpacing = 10;
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
				sceneVariable.wordBoxScrollY = 0;
				sceneVariable.dialogMessageData = messageData;
				sceneVariable.dialogMessageAniChar = 0;
				sceneVariable.dialogMessageAniTimeLeft = 0;
				sceneVariable.dialogMessageAniStartTime = currentTime;
				tempCtx.dialog.clearRect(0, 0, CW, CH);
			}
			if (sceneVariable.currentDialogKey in currentStoryDialog) {
				dialog = currentStoryDialog[sceneVariable.currentDialogKey];
			}
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, CW, CH);
			if (dialog.image) {
				ctx.drawImage(await getImage(dialog.image), 0, 0, CW, CH); // scene background
			}
			// dialog message box
			ctx.lineWidth = buttonLineWidth;
			ctx.fillStyle = '#00000088';
			ctx.strokeStyle = color.buttonHover;
			var { x, y, w, h } = dialogBoxDisplay;
			ctx.fillRect(x, y, w, h);
			ctx.strokeRect(x, y, w, h);
			var [x, y, w, h] = [0, 0, 0, 0]

			// dialog message
			if (sceneVariable.dialogMessageAniChar < sceneVariable.dialogMessageData.length) {
				tempCtx.dialog.textAlign = 'left';
				tempCtx.dialog.textBaseline = 'top';
				let aniDeltaTime = currentTime - sceneVariable.dialogMessageAniStartTime - sceneVariable.dialogMessageAniTimeLeft;
				let charData = sceneVariable.dialogMessageData[sceneVariable.dialogMessageAniChar];
				let charMiniSec = parseInt(charData.attribute.miniSec);
				while (aniDeltaTime >= charMiniSec) {
					tempCtx.dialog.save();
					if ('italic' in charData.attribute || 'oblique' in charData.attribute) charData.attribute.style = 'oblique';
					if ('bold' in charData.attribute || 'bolder' in charData.attribute) charData.attribute.weight = 'bolder';
					if ('light' in charData.attribute || 'lighter' in charData.attribute) charData.attribute.weight = 'lighter';
					tempCtx.dialog.font = [
						charData.attribute.style ? charData.attribute.style : 'normal',
						charData.attribute.variant ? charData.attribute.variant : 'normal',
						charData.attribute.weight ? charData.attribute.weight : 'normal',
						`${charData.attribute.size ? parseFloat(charData.attribute.size) : 5}px`,
						charData.attribute.family ? charData.attribute.family : font.default
					].join(' ');
					charData.x += charData.attribute.deltaX ? parseInt(charData.attribute.deltaX) : 0;
					charData.y += charData.attribute.deltaY ? parseInt(charData.attribute.deltaY) : 0;
					tempCtx.dialog.fillStyle = charData.attribute.color ? charData.attribute.color : 'white';
					if ('glow' in charData.attribute) {
						tempCtx.dialog.shadowBlur = 10;
						tempCtx.dialog.shadowColor =
							charData.attribute.glow === 'n' ? color.wordBoxSAndO :
								charData.attribute.glow === 'v' ? color.wordBoxV :
									charData.attribute.glow ? charData.attribute.glow :
										tempCtx.dialog.fillStyle;
					} else if ('shadow' in charData.attribute) {
						tempCtx.dialog.shadowBlur = 10;
						tempCtx.dialog.shadowColor = charData.attribute.shadow ? charData.attribute.shadow : 'black';
					}
					tempCtx.dialog.fillText(charData.char, charData.x, charData.y);

					aniDeltaTime -= charMiniSec;
					sceneVariable.dialogMessageAniTimeLeft += charMiniSec;
					sceneVariable.dialogMessageAniChar++;
					charData = sceneVariable.dialogMessageData[sceneVariable.dialogMessageAniChar];
					if (charData === undefined) break;
					charMiniSec = parseInt(charData.attribute.miniSec);
					tempCtx.dialog.restore();
				}
			}
			ctx.drawImage(tempCvs.dialog, 0, 0);
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
			mouse.wheelPreventDefault = () => isHover(mouse, wordsBoxDisplay);
			sceneVariable.wordBoxScrollY += mouse.deltaY * 0.5;
			sceneVariable.wordBoxScrollY = Math.max(Math.min(sceneVariable.wordBoxScrollY, ((sceneVariable.words.length - ['s', 'v', 'o'].map(k => sceneVariable[k] !== '' ? 1 : 0).reduce((s, n) => s + n)) * (wordHeight + wordGap) - wordGap) - (wordsBoxDisplay.h - wordsBoxPadding * 2)), 0);

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

			function drawWord(wordData) {
				let fontSize = 50;
				let mouseHover = isHover(mouse, wordData);
				let partOfSpeech = partOfSpeechData[wordData.label];
				let scale = 1;
				let targetCtx = tempCtx.words;
				let reFunc = () => { };
				if (sceneVariable.draggingWord === wordData.label) {
					[wordData.x, wordData.y] = [mouse.x - wordData.w / 2, mouse.y - wordData.h / 2];
					scale = 0.8;
					targetCtx = tempCtx.draggingWord;
					if (mouse.up) {
						sceneVariable.draggingWord = undefined;
						['s', 'v', 'o'].forEach(type => {
							if (
								isHover(mouse, wordBoxDisplay[type]) &&
								((partOfSpeech == 'v' && type == partOfSpeech) ||
									(partOfSpeech == 'n' && ['s', 'o'].includes(type)))
							) {
								sceneVariable[type] = wordData.label;
								let nw = sceneVariable.newWords;
								nw.splice(nw.indexOf(wordData.label), 1);
							}
						});
						scale = 1;
					}
				} else if (mouseHover) {
					scale = 1.05;
					if (mouse.down) {
						if (wordData.type !== undefined || (wordData.type == undefined && isHover(mouse, wordsBoxDisplay))) {
							sceneVariable.draggingWord = wordData.label;
						}
						if (wordData.type !== undefined) {
							sceneVariable[wordData.type] = '';
							reFunc = () => {
								let sw = sceneVariable.words;
								sw.push(sw.splice(sw.indexOf(wordData.label), 1)[0]);
							};
						};
					}
				}

				targetCtx.save();

				[wordData.x, wordData.y, wordData.w, wordData.h] = [wordData.x + wordData.w * (1 - scale) / 2, wordData.y + wordData.h * (1 - scale) / 2, wordData.w * scale, wordData.h * scale];
				fontSize *= scale;

				targetCtx.lineWidth = buttonLineWidth;
				targetCtx.textAlign = 'center';
				targetCtx.textBaseline = 'middle';
				if (sceneVariable.getWords.includes(wordData.label)) {
					let aniMiniSec = 0.5e3;
					let aniRate = Math.min((currentTime - sceneVariable.dialogMessageAniStartTime) / aniMiniSec, 1);
					wordData.x += CW / 4 * (1 - aniRate);
					targetCtx.globalAlpha = aniRate;
				}
				targetCtx.fillStyle = color.buttonBgc;
				targetCtx.fillRect(wordData.x, wordData.y, wordData.w, wordData.h);
				targetCtx.strokeStyle = partOfSpeech == 'v' ? color.wordBoxV : partOfSpeech == 'n' ? color.wordBoxSAndO : color.buttonDisabled;
				if (sceneVariable.newWords.includes(wordData.label)) {
					targetCtx.shadowBlur = 10;
					targetCtx.shadowColor = targetCtx.strokeStyle;
				}
				targetCtx.fillStyle = 'white';
				targetCtx.strokeRect(wordData.x, wordData.y, wordData.w, wordData.h);
				targetCtx.font = `${fontSize}px ${font.default}`;
				targetCtx.fillText(wordData.label, wordData.x + wordData.w / 2, wordData.y + wordData.h / 2);

				targetCtx.restore();
				return reFunc;
			}
			let deltaI = 0;
			let reFuncList = [];
			tempCtx.words.clearRect(0, 0, CW, CH);
			tempCtx.draggingWord.clearRect(0, 0, CW, CH);
			for (let i = 0; i < sceneVariable.words.length; i++) {
				ctx.fillStyle = 'black';
				ctx.strokeStyle = 'gray';
				let wordData = {
					x: wordsBoxDisplay.x + wordsBoxPadding,
					y: wordsBoxDisplay.y + wordsBoxPadding + (i - deltaI) * (wordHeight + wordGap),
					w: wordsBoxDisplay.w - wordsBoxPadding * 2,
					h: wordHeight,
					label: sceneVariable.words[i],
					type: undefined
				};
				wordData.y -= sceneVariable.wordBoxScrollY;
				for (let type of ['s', 'v', 'o']) {
					if (sceneVariable[type] == wordData.label) {
						let { x, y, w, h } = wordBoxDisplay[type];
						[wordData.x, wordData.y, wordData.w, wordData.h] = [x, y, w, h];
						wordData.type = type;
						deltaI++;
						break;
					}
				}
				reFuncList.push(drawWord(wordData));
			}
			reFuncList.forEach(func => func());
			var { y, h } = wordsBoxDisplay;
			y += buttonLineWidth / 2;
			h -= buttonLineWidth;
			ctx.drawImage(tempCvs.words, 0, y, CW, h, 0, y, CW, h);
			ctx.drawImage(tempCvs.draggingWord, 0, 0);

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
	}

	/* background */
	let currentScene = ['menu', 'main']; // or 'dialog'
	let screenshotList = [];
	async function gameCycle() {
		currentTime = Date.now();
		let deltaTime = currentTime - lastTime;
		lastTime = currentTime;
		await renderScene(currentScene);
		/* screenshot method and animation */
		if (mouse.screenshot) {
			let url = cvs.toDataURL();
			let image = await getImage(url);
			screenshotList.push({ url, image, aniStartTime: currentTime });
		}
		for (let i = 0; i < screenshotList.length; i++) {
			let screenshot = screenshotList[screenshotList.length - 1 - i];
			let aniDeltaSec = (currentTime - screenshot.aniStartTime) / 1e3;
			let x, y, w, h;
			let endScale = 1 / 8;
			let margin = 50;
			ctx.lineWidth = 10;
			ctx.strokeStyle = 'white';
			let aniTimeLine = [0.5, 1, 0.5, 1];
			let aniTimeAccu = [];
			aniTimeLine.map((n, i) => {
				let lastItem = aniTimeAccu[i - 1];
				aniTimeAccu[i] = (lastItem !== undefined ? lastItem : 0) + aniTimeLine[i];
			});
			if (aniDeltaSec < aniTimeAccu[0]) {
				let aniFragmentRate = aniDeltaSec / aniTimeLine[0];
				[x, y, w, h] = [0, 0, CW, CH];
				ctx.drawImage(screenshot.image, x, y, w, h);
				ctx.strokeRect(x, y, w, h);
				ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - aniFragmentRate)})`;
				ctx.fillRect(0, 0, CW, CH);
				[x, y, w, h] = [-ctx.lineWidth / 2, -ctx.lineWidth / 2, 0, 0];
			} else if (aniDeltaSec < aniTimeAccu[1]) {
				let aniFragmentRate = (aniDeltaSec - aniTimeAccu[0]) / aniTimeLine[1];
				[w, h] = [CW, CH].map(n => n * (aniFragmentRate * (endScale - 1) + 1));
				[x, y] = [CW - w - margin * aniFragmentRate, CH - h - margin * aniFragmentRate];
			} else if (aniDeltaSec < aniTimeAccu[2]) {
				[w, h] = [CW, CH].map(n => n * endScale);
				[x, y] = [CW - w - margin, CH - h - margin];
			} else if (aniDeltaSec < aniTimeAccu[3]) {
				let aniFragmentRate = (aniDeltaSec - aniTimeAccu[2]) / aniTimeLine[3];
				[w, h] = [CW, CH].map(n => n * endScale);
				[x, y] = [CW - w - margin + (w + margin + ctx.lineWidth / 2) * aniFragmentRate, CH - h - margin];
			} else {
				screenshotList.splice(screenshotList.length - 1 - i, 1);
				i--;
				let a = document.createElement('a');
				a.href = screenshot.url;
				a.download = `screenshot_${new Date(screenshot.aniStartTime).toJSON().replace('T', '_').replace('Z', '')}.jpg`;
				a.click();
			}
			ctx.drawImage(screenshot.image, x, y, w, h);
			ctx.strokeRect(x, y, w, h);
		}
		mouse.click = mouse.down = mouse.up = false;
		mouse.deltaX = mouse.deltaY = mouse.deltaZ = mouse.deltaZoom = 0;
		mouse.screenshot = false;
		setTimeout(gameCycle, 30);
	}
	return gameCycle;
}