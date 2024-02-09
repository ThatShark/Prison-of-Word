/* global varible declare and initialize */
const cvs = document.querySelector('#viewCanvas'),
	ctx = cvs.getContext('2d');
[cvs.width, cvs.height] = [window.innerWidth, window.innerHeight];
const tempCvs = {}, tempCtx = {};
['gridTitle', 'gridValue', 'nounList', 'verbList'].forEach(key => {
	tempCvs[key] = document.createElement('canvas');
	tempCtx[key] = tempCvs[key].getContext('2d');
	[tempCvs[key].width, tempCvs[key].height] = [window.innerWidth, window.innerHeight];
});
window.addEventListener('resize', () => {
	[cvs, ...Object.values(tempCvs)].forEach(cvs => {
		[cvs.width, cvs.height] = [window.innerWidth, window.innerHeight];
	})
});

let CW, CH;
const sceneVar = {};

const data = {};
data.partOfSpeech = {
	n: ['我', '門', '電腦', '紙條', '寶箱', '電話', '鍵盤', '手錶', '蠟燭', '屎', '筆', '墨水', '衛生紙'],
	v: ['走向', '檢查', '打開']
};

const color = {
	buttonHover: 'white',
	// buttonDefault: '#6585ad',
	buttonDefault: '#b5986a',
	buttonDisabled: 'gray',
	buttonBgc: '#00000055',
	wordBoxSAndO: '#ffc107',
	wordBoxV: '#ff5722'
};

let currentScene = () => { };
currentScene = scene_sheet;

/* mouse event */
const mouse = {
	x: 0, y: 0,
	click: false,
	up: false, down: false,
	over: false, leave: false,
	deltaX: 0, deltaY: 0, deltaZ: 0, deltaZoom: 0,
	screenshot: false
};
let lastMouseData = JSON.stringify(mouse);
function updateMousePosition(event) {
	[mouse.x, mouse.y] = [event.pageX, event.pageY];
}
cvs.addEventListener('mousemove', event => {
	updateMousePosition(event);
});
cvs.addEventListener('click', event => {
	updateMousePosition(event);
	mouse.click = true;
});
cvs.addEventListener('mousedown', event => {
	updateMousePosition(event);
	mouse.down = true;
});
cvs.addEventListener('mouseup', event => {
	updateMousePosition(event);
	mouse.up = true;
});
cvs.addEventListener('wheel', event => {
	updateMousePosition(event);
	event.preventDefault();
	if (event.ctrlKey) {
		mouse.deltaZoom += event.deltaY;
	} else {
		mouse.deltaX += event.deltaX;
		mouse.deltaY += event.deltaY;
		mouse.deltaZ += event.deltaZ;
	}
});
cvs.addEventListener('contectmenu', event => {
	updateMousePosition(event);
	event.preventDefault();
});

/* draw element method */
function isHover(mouse, [x, y, w, h]) {
	return mouse.x > x && mouse.y > y && mouse.x < x + w && mouse.y < y + h;
}
function drawBox(ctx, { pos, bgc, border, borderWidth, text, decorate, font = 'Zpix', size, fgc, stroke }) {
	if (pos == undefined) return;
	if (bgc !== undefined) {
		ctx.fillStyle = bgc;
		ctx.fillRect(...pos);
	}
	if (border !== undefined) {
		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = border;
		ctx.strokeRect(...pos);
	}
	if (text !== undefined) {
		ctx.font = `${decorate ? decorate + ' ' : ''} ${size}px ${font}`;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		if (fgc !== undefined) {
			ctx.fillStyle = fgc;
			ctx.fillText(text, pos[0] + pos[2] / 2, pos[1] + pos[3] / 2);
		}
		if (stroke !== undefined) {
			ctx.strokeStyle = stroke;
			ctx.strokeText(text, pos[0] + pos[2] / 2, pos[1] + pos[3] / 2);
		}
	}
}
function drawPoliigon(ctx, { points, fill, stroke, lineWidth = 1 }) {
	if (points == undefined) return;
	ctx.beginPath();
	ctx.moveTo(...points[0]);
	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(...points[i]);
	}
	if (fill !== undefined) {
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
	}
	if (stroke !== undefined) {
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = stroke;
		ctx.stroke();
	}
}

/* render scene */
function scene_sheet() {
	/* init */
	if (!('sheet' in sceneVar)) {
		sceneVar.sheet = {};
		sceneVar.sheet.scale = 1;
		sceneVar.sheet.gridX = 0;
		sceneVar.sheet.gridY = 0;
		sceneVar.sheet.hoveredCell = [false, false];
		sceneVar.sheet.rowHighlight = false;
		sceneVar.sheet.columnHighlight = false;
		sceneVar.sheet.asidePage = 0;
		sceneVar.sheet.nounListY = 0;
		sceneVar.sheet.verbListY = 0;
		sceneVar.sheet.nounListSelected = false;
		sceneVar.sheet.verbListSelected = false;
	}

	/* draw */
	drawBox(ctx, {
		pos: [0, 0, CW, CH],
		bgc: '#1c1c1c'
	});

	let header = [0, 0, CW, 70];
	let aside = [CW - 400, header[3], 400, CH - header[3]];

	let grid = [0, header[3], aside[0], CH - header[3]];
	if (isHover(mouse, grid)) {
		let lastScale = sceneVar.sheet.scale;
		sceneVar.sheet.scale -= mouse.deltaZoom * Math.abs(mouse.deltaZoom) / 1e4;
		sceneVar.sheet.scale = Math.min(Math.max(sceneVar.sheet.scale, 0.2), 1.5);
		sceneVar.sheet.gridX = sceneVar.sheet.gridX / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridY = sceneVar.sheet.gridY / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridX += mouse.x - mouse.x / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridY += (mouse.y - header[3]) - (mouse.y - header[3]) / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridX -= mouse.deltaX / 2 * 3;
		sceneVar.sheet.gridY -= mouse.deltaY / 2;
	}
	let [cellWidth, cellHeight] = [180, 60].map(n => n * sceneVar.sheet.scale);
	let gridSize = data.partOfSpeech.n.length + 1;
	let cellGap = 5;
	let cellBorderWidth = 2;
	sceneVar.sheet.gridX = Math.min(Math.max(sceneVar.sheet.gridX, -(((cellWidth + cellGap) * (gridSize - 1)) - (grid[2] - cellWidth))), 0);
	sceneVar.sheet.gridY = Math.min(Math.max(sceneVar.sheet.gridY, -(((cellHeight + cellGap) * (gridSize - 1)) - (grid[3] - cellHeight))), 0);

	tempCtx.gridTitle.clearRect(0, 0, CW, CH);
	tempCtx.gridValue.clearRect(0, 0, CW, CH);
	let gridHovered = isHover(mouse, grid);
	if (!gridHovered) {
		sceneVar.sheet.hoveredCell = [false, false];
	}
	for (let r = 0; r < Math.ceil(grid[3] / cellHeight) + 1; r++)
		for (let c = 0; c < Math.ceil(grid[2] / cellWidth) + 1; c++) {
			// 多畫一層，讓項目標題與內容產生至少一個的重疊
			let targetCtx = ctx;
			let cell = [0 + (cellWidth + cellGap) * c, header[3] + (cellHeight + cellGap) * r, cellWidth, cellHeight];
			let glow = false;
			let option = {
				pos: cell,
				bgc: color.buttonBgc,
				border: color.buttonDisabled,
				borderWidth: cellBorderWidth,
				fgc: 'white',
				text: '',
				size: 30 * sceneVar.sheet.scale
			};
			let dR = sceneVar.sheet.gridY / (cellHeight + cellGap),
				dC = sceneVar.sheet.gridX / (cellWidth + cellGap),
				rR = r - Math.ceil(dR),
				rC = c - Math.ceil(dC),
				dY = (dR % 1) * (cellHeight + cellGap),
				dX = (dC % 1) * (cellWidth + cellGap),
				i = Math.max(r, c),
				rI = i == r ? rR : rC;
			if (r == c && r == 0) {
				option.border = color.wordBoxV;
				option.text = data.partOfSpeech.v[0];
			} else if (r == 0 || c == 0) {
				let cellHovered = gridHovered && isHover(mouse, cell);
				targetCtx = tempCtx.gridTitle;
				option.border = color.wordBoxSAndO;
				if (i == r) {
					option.pos[1] += dY;
				} else {
					option.pos[0] += dX;
				}
				option.text = data.partOfSpeech.n[rI - 1];
				if (cellHovered) {
					sceneVar.sheet.hoveredCell = [rC - 1, rR - 1];
				}
				if (sceneVar.sheet.hoveredCell[i == r ? 1 : 0] === rI - 1) {
					glow = true;
				}
				if (rI - 1 < 0 || rI > data.partOfSpeech.n.length) {
					if (cellHovered) sceneVar.sheet.hoveredCell = [false, false];
					continue;
				};
			} else {
				let cellHovered = gridHovered && isHover(mouse, cell);
				targetCtx = tempCtx.gridValue;
				option.pos[1] += dY;
				option.pos[0] += dX;
				if (rR == rC) {
					option.bgc = '#313131';
				}
				if (cellHovered) {
					sceneVar.sheet.hoveredCell = [rC - 1, rR - 1];
					glow = true;
					option.border = 'white';
					if (rR == rC) {
						option.text = 'x';
					}
					if (mouse.click) {
					}
				}
				if (Math.min(rR, rC) - 1 < 0 || Math.max(rR, rC) > data.partOfSpeech.n.length) {
					if (cellHovered) sceneVar.sheet.hoveredCell = [false, false];
					continue;
				}
			}
			targetCtx.save();
			if (glow) {
				targetCtx.shadowBlur = 10;
				targetCtx.shadowColor = option.border;
			}
			drawBox(targetCtx, option);
			targetCtx.restore();
		}
	let gridValuePos = [cellWidth + cellBorderWidth, header[3] + cellHeight + cellBorderWidth, 0, 0];
	gridValuePos[2] = grid[0] + grid[2] - gridValuePos[0];
	gridValuePos[3] = grid[1] + grid[3] - gridValuePos[1];
	ctx.drawImage(tempCvs.gridValue, ...gridValuePos, ...gridValuePos);
	let gridTitlePosList = [
		[0, gridValuePos[1], cellWidth + cellBorderWidth, gridValuePos[3]],
		[gridValuePos[0], header[3], gridValuePos[2], cellHeight + cellBorderWidth]
	];
	ctx.drawImage(tempCvs.gridTitle, ...gridTitlePosList[0], ...gridTitlePosList[0]);
	ctx.drawImage(tempCvs.gridTitle, ...gridTitlePosList[1], ...gridTitlePosList[1]);

	drawBox(ctx, {
		pos: aside,
		bgc: '#1e1e1e'
	});
	drawPoliigon(ctx, {
		points: [[aside[0] + 5 / 2, aside[1]], [aside[0] + 5 / 2, aside[1] + aside[3]]],
		lineWidth: 2,
		stroke: 'white'
	});
	let pageButtonHeight = 50;
	[
		{
			pos: [aside[0], aside[1], aside[2] / 2, pageButtonHeight],
			text: '詞卡總攬',
		},
		{
			pos: [aside[0] + aside[2] / 2, aside[1], aside[2] / 2, pageButtonHeight],
			text: '空缺提示',
		}
	].map((pageButton, i) => {
		pageButton.size = 20;
		pageButton.pos[0] += 5;
		pageButton.pos[1] += 5;
		pageButton.pos[2] -= 10;
		pageButton.pos[3] -= 10;
		if (i == sceneVar.sheet.asidePage) {
			pageButton.fgc = 'white';
			pageButton.bgc = 'transparent';
		} else {
			pageButton.fgc = 'gray';
			pageButton.bgc = '#3e3e3e';
		}
		if (isHover(mouse, pageButton.pos) && mouse.click) {
			sceneVar.sheet.asidePage = i;
		}
		drawBox(ctx, pageButton);
	});
	let asidePadding = 20;
	if (sceneVar.sheet.asidePage == 0) {
		drawPoliigon(ctx, {
			points: [[aside[0] + 5, aside[1] + pageButtonHeight + (aside[3] - pageButtonHeight) / 2], [aside[0] + aside[2] - 5, aside[1] + pageButtonHeight + (aside[3] - pageButtonHeight) / 2]],
			lineWidth: 2,
			stroke: 'white'
		});
		let wordHeight = 30,
			wordGap = 5;
		let listPadding = 10;
		let nounList = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) / 2 - 100 - asidePadding];
		let verbList = [...nounList];
		verbList[1] += (aside[3] - pageButtonHeight) / 2;
		[
			{ list: nounList, listName: 'nounList', listPOS: 'n', theOtherName: 'verbList' },
			{ list: verbList, listName: 'verbList', listPOS: 'v', theOtherName: 'nounList' }
		].forEach(({ list, listName, listPOS, theOtherName }) => {
			let targetCtx = tempCtx[listName];
			let listY = sceneVar.sheet[listName + 'Y'];
			let listLength = data.partOfSpeech[listPOS].length;
			drawBox(ctx, {
				pos: list,
				bgc: color.buttonBgc,
				border: 'white',
				borderWidth: 1
			});
			let listHovered = isHover(mouse, list);
			if (listHovered) {
				listY -= mouse.deltaY;
				listY = Math.min(Math.max(listY, -((wordHeight + wordGap) * listLength - wordGap - (list[3] - listPadding*2))), 0);
			}
			tempCtx[listName].clearRect(0, 0, CW, CH);
			for (let i = 0; i < listLength; i++) {
				let option = {
					pos: [list[0] + listPadding, list[1] + (wordHeight + wordGap) * i + listPadding + listY, list[2] - listPadding*2, wordHeight],
					bgc: listPOS == 'v' ? color.wordBoxV : color.wordBoxSAndO,
					fgc: 'white',
					text: data.partOfSpeech[listPOS][i],
					size: 20
				}
				if (listHovered && isHover(mouse, option.pos) && mouse.click) {
					sceneVar.sheet[listName + 'Selected'] = i;
					sceneVar.sheet[theOtherName + 'Selected'] = false;
				}
				if (i === sceneVar.sheet[listName + 'Selected']) {
					option.fgc = 'black';
					drawBox(targetCtx, option);
				} else {
					targetCtx.globalAlpha = 0.5;
					drawBox(targetCtx, { ...option, text: '' });
					targetCtx.globalAlpha = 1;
					drawBox(targetCtx, { ...option, bgc: undefined });
				}
			}
			ctx.drawImage(tempCvs[listName], ...list, ...list);
			sceneVar.sheet[listName + 'Y'] = listY;
		});
	} else if (sceneVar.sheet.asidePage == 1) { }

	drawBox(ctx, {
		pos: header,
		bgc: '#313131',
		fgc: 'white',
		text: '< 文字獄 - 後台 >',
		size: 30
	});
	drawPoliigon(ctx, {
		points: [[header[0], header[1] + header[3] - 5 / 2], [header[0] + header[2], header[1] + header[3] - 5 / 2]],
		lineWidth: 2,
		stroke: 'white'
	});
}

/* main loop */
function loop() {
	let mouseData = JSON.stringify(mouse);
	if (mouseData != lastMouseData || CW !== cvs.width || CH !== cvs.height) {
		[CW, CH] = [cvs.width, cvs.height];
		currentScene();
		// console.log('rendered!');
		mouse.click = mouse.down = mouse.up = false;
		mouse.deltaX = mouse.deltaY = mouse.deltaZ = mouse.deltaZoom = 0;
		mouse.screenshot = false;
	}
	lastMouseData = mouseData;
	setTimeout(loop, 30);
}
loop();