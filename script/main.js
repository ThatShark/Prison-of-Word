const THEME_COLOR = 'white';
const THEME_COLOR_DARK = '#6585ad';
const LOCKED_COLOR = 'gray';

(async () => {
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
    async function renderMenu(menuLabel) {
        const data = menuData[menuLabel];
        if (!data) return;
        ctx.save();
        async function drawButton(element) {
			if (element.label === "尚未解鎖") {
				ctx.strokeStyle = LOCKED_COLOR;
				ctx.fillStyle = LOCKED_COLOR;
			} else {
				ctx.strokeStyle = THEME_COLOR_DARK;
				ctx.fillStyle = THEME_COLOR_DARK;
			}
			ctx.lineWidth = 5;
			ctx.font = '50px 微軟正黑';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

            if (
				MX > element.display?.x && MY > element.display?.y &&
				MX < element.display?.x + element.display?.w && MY < element.display?.y + element.display?.h
			) {
				if (element.label === "尚未解鎖") {
					ctx.strokeStyle = LOCKED_COLOR;
					ctx.fillStyle = LOCKED_COLOR;
				} else {
					ctx.strokeStyle = THEME_COLOR;
					ctx.fillStyle = THEME_COLOR;
				}
				if (MC) {
					if (element.label !== "尚未解鎖") {
						currentScene = element.destination;
					}
					MC = false;
				}
			}
			ctx.strokeRect(element.display?.x, element.display?.y, element.display?.w, element.display?.h);
			ctx.save();
			ctx.fillStyle = '#00000055';
			ctx.fillRect(element.display?.x, element.display?.y, element.display?.w, element.display?.h);
			ctx.restore();
			ctx.fillText(element.label, element.display?.x + element.display?.w / 2, element.display?.y + element.display?.h / 2);
        }

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
						await drawButton({ display: buttonDisplayData, label: element.button[i].label, destination: element.button[i].destination });
					}
					break;
				case 'buttonGrid':
					for (let r = 0; r < element.button.length; r++) {
						for (let c = 0; c < element.button[r].length; c++) {
							let buttonDisplayData = {
								x: element.display?.x + (element.display?.xInc !== undefined ? element.display?.xInc : 0) * c + (r !== 0 ? (120 / (element.button.length-1)) * r : 0),
								y: element.display?.y + (element.display?.yInc !== undefined ? element.display?.yInc : 0) * r,
								w: element.display?.w,
								h: element.display?.h
							}
							await drawButton({ display: buttonDisplayData, label: element.button[r][c].label, destination: element.button[r][c].destination });
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
	gameVariable['place'] = '房間';
	gameVariable['object'] = '無';
	gameVariable['s'] = '';
	gameVariable['v'] = '';
	gameVariable['o'] = '';
    async function renderScene(sceneName) {
        if (sceneName.includes('menu-')) {
            await renderMenu(sceneName.replace('menu-', ''));
        } else {
			if (sceneName.includes('dialog-')) {
				let dialogLevel = sceneName.replace('dialog-', '');

				let action = `${gameVariable['s']}-${gameVariable['v']}-${gameVariable['o']}`;
				let dialog = {
					"image": false,
					"message": "",
					"words": [],
					"at": gameVariable['place'],
					"check": gameVariable['object']
				};
				if (`${action}@${gameVariable['place']}>${gameVariable['object']}` in dialogData.story[dialogLevel - 1]) {
					dialog = dialogData.story[dialogLevel - 1].dialog[`${action}@${gameVariable['place']}>${gameVariable['object']}`];
				} else if (`${action}@${gameVariable['place']}>*` in dialogData.story[dialogLevel - 1]) {
					dialog = dialogData.story[dialogLevel - 1].dialog[`${action}@${gameVariable['place']}>*`];
				} else if (`${action}@*>*` in dialogData.story[dialogLevel - 1]) {
					dialog = dialogData.story[dialogLevel - 1].dialog[`${action}@*>*`];
				}
				if (dialog.image) {
					ctx.drawImage(await getImage(dialog.image), 0, 0, CW, CH);
				}
				ctx.lineWidth = 5;
				ctx.font = '50px 微軟正黑';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = '#00000088';
				ctx.strokeStyle = THEME_COLOR;
				ctx.fillRect(470, 730, 1400, 300);
				ctx.strokeRect(470, 730, 1400, 300);
				
				ctx.fillText(dialog.message, 470, 730);
				ctx.fillRect(50, 50, 370, 980);
				ctx.strokeRect(50, 50, 370, 980);
				ctx.strokeStyle = '#ffc107';
				ctx.strokeRect(470, 590, 440, 100);
				ctx.strokeStyle = '#ff5722';
				ctx.strokeRect(470+(440+40), 590, 440, 100);
				ctx.strokeStyle = '#ffc107';
				ctx.strokeRect(470+(440+40)*2, 590, 440, 100);
			}
        }
    }

    /* background */
    let currentScene = 'menu-main'; // or 'dialog'
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