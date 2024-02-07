(async () => {
	/* all manner of colors */
	const color = {
		buttonHover: 'white',
		buttonDefault: '#6585ad',
		buttonDisabled: 'gray',
		buttonBgc: '#00000055',
		wordBoxSAndO: '#ffc107',
		wordBoxV: '#ff5722'
	};

	/* basic canvas set-up */
	const cvs = document.querySelector('#view-canvas');
	const ctx = cvs.getContext('2d');
	const [CW, CH] = [1920, 1080];
	[cvs.width, cvs.height] = [CW, CH];
	cvs.style.setProperty('--w-h-ratio', `${CW}/${CH}`);

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
		let mouseHover = MX > element.display?.x && MY > element.display?.y && MX < element.display?.x + element.display?.w && MY < element.display?.y + element.display?.h
		ctx.fillStyle = color.buttonBgc;
		ctx.fillRect(element.display.x, element.display.y, element.display.w, element.display.h);
		if (element.class?.includes('disabled')) {
			ctx.strokeStyle = color.buttonDisabled;
			ctx.fillStyle = color.buttonDisabled;
			element.label = '尚未解鎖';
		} else if (mouseHover) {
			ctx.strokeStyle = color.buttonHover;
			ctx.fillStyle = color.buttonHover;
			if (MC) {
				currentScene = element.destination;
				MC = false;
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
		MC = false;
	}

	/* change background */
	const gameVariable = {};
	gameVariable['place'] = '未初始化';
	gameVariable['object'] = '無';
	gameVariable['s'] = '';
	gameVariable['v'] = '';
	gameVariable['o'] = '';
	async function renderScene(sceneIndex) {
		let [sceneType, sceneId] = sceneIndex;
		if (sceneType == 'menu') {
			await renderMenu(sceneId);
		} else if (sceneType == 'dialog') {
			let dialogLevel = parseInt(sceneId);
			let currentStoryDialog = dialogData.story[dialogLevel - 1].dialog;

			let action = `${gameVariable['s']}-${gameVariable['v']}-${gameVariable['o']}`;
			let dialog = {
				"image": false,
				"message": "",
				"words": [],
				"at": gameVariable['place'],
				"check": gameVariable['object']
			};
			for (let dialogKey of [
				`${action}@${gameVariable['place']}>${gameVariable['object']}`,
				`${action}@${gameVariable['place']}>*`,
				`${action}@*>*`
			]) {
				if (dialogKey in currentStoryDialog) {
					dialog = currentStoryDialog[dialogKey];
					if (dialog.at !== false) gameVariable['place'] = dialog.at;
					if (dialog.check !== false) gameVariable['object'] = dialog.check;
					break;
				}
			}
			if (dialog.image) {
				ctx.drawImage(await getImage(dialog.image), 0, 0, CW, CH); // scene background
			}
			// words box
			ctx.lineWidth = 5;
			var fontSize = 50;
			ctx.font = `${fontSize}px 微軟正黑`;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillStyle = '#00000088';
			ctx.strokeStyle = color.buttonHover;
			var dialogBoxDisplay = { x: 470, y: 730, w: 1400, h: 300 };
			with ({ x, y, w, h } = dialogBoxDisplay) {
				ctx.fillRect(x, y, w, h);
				ctx.strokeRect(x, y, w, h);
			}

			// dialog message
			var dialogBoxPadding = 50;
			var lineSpacing = 0;
			var lineLength = Math.floor((dialogBoxDisplay.w - dialogBoxPadding * 2) / fontSize);
			var lineNumber = Math.ceil(dialog.message.length / lineLength);
			var maxLineNumber = Math.floor((dialogBoxDisplay.h - dialogBoxPadding * 2) / (fontSize + lineSpacing));
			if (dialog?.color != undefined) {
				ctx.fillStyle = dialog?.color;
				ctx.strokeStyle = dialog?.color;
			} else {
				ctx.fillStyle = 'white';
				ctx.strokeStyle = 'white';
			}
			for (let i = 0; i < lineNumber; i += 1) {
				let lineContent = dialog.message.split('').splice(i * lineLength, lineLength).join('');
				ctx.fillText(lineContent, dialogBoxDisplay.x + dialogBoxPadding, dialogBoxDisplay.y + dialogBoxPadding + i * (fontSize + lineSpacing));
			}
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

			MC = false;
		}
	}

	/* background */
	let currentScene = ['menu', 'main']; // or 'dialog'
	async function gameCycle() {
		await renderScene(currentScene);
		setTimeout(gameCycle, 50);
	}
	function main() {
		gameCycle();
	}

	let boundingRect = cvs.getBoundingClientRect();
	let [MX, MY, MC] = [0, 0, false];
	cvs.addEventListener('mousemove', event => {
		[MX, MY] = [(event.pageX - boundingRect.x) / boundingRect.width * CW, (event.pageY - boundingRect.y) / boundingRect.height * CH];
	});
	cvs.addEventListener('click', event => {
		[MX, MY] = [(event.pageX - boundingRect.x) / boundingRect.width * CW, (event.pageY - boundingRect.y) / boundingRect.height * CH];
		MC = true;
	});
	window.addEventListener("resize", () => {
		boundingRect = cvs.getBoundingClientRect();
	});
	main();
})();