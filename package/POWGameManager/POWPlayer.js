/*
 * 2024 (c) MaoHuPi
 * POWGameManager/POWPlayer.js
 * v1.0.0
 * 用以載入POW遊戲劇情專案檔，並處理遊戲過程中的邏輯判斷與變數存儲
 */

const POWPlayer = (() => {
	const cvsDataUrlHead = document.createElement('canvas').toDataURL('image/png').split(',')[0] + ',';
	class POWProject {
		constructor({
			partOfSpeech = { n: [], v: [] },
			cases = [],
			imageDataDict = {},
			wordAttribute = { n: [], v: [] },
			init = FlowChart.exportEmpty(),
			defaultCase = FlowChart.exportEmpty(),
		} = {}) {
			this.partOfSpeech = partOfSpeech;
			this.cases = cases;
			this.imageDataDict = imageDataDict;
			this.init = init;
			this.defaultCase = defaultCase;
			Object.keys(partOfSpeech).forEach(POS => {
				if (!(POS in wordAttribute)) wordAttribute[POS] = [];
				partOfSpeech[POS].map((n, i) => {
					if (!wordAttribute[POS][i]) wordAttribute[POS][i] = {};
				})
			});
			this.wordAttribute = wordAttribute;
		}
		static async fromZip(zip) {
			if (!zip instanceof JSZip) return;
			if (!zip.file('project.json')) return;
			let json = await zip.file('project.json').async('string');
			let jsonData = JSON.parse(json);
			let imageDataDict = {};
			if (zip.folder('image')) {
				let fileNameList = zip.file(/image\/.*/);
				let cvs = document.createElement('canvas'),
					ctx = cvs.getContext(`2d`);
				for (let file of fileNameList) {
					let base64 = await file.async('base64');

					let element = new Image();
					element.src = `${cvsDataUrlHead}${base64}`;
					let fileNameWithoutExtension = file.name.split('/').pop().split('.');
					fileNameWithoutExtension.pop();
					fileNameWithoutExtension = fileNameWithoutExtension.join('.');

					imageDataDict[fileNameWithoutExtension] = { element, base64 };
				}
			}
			return new POWProject({ ...jsonData, imageDataDict });;
		}
	}
	class POWPlayer {
		static POWProject = POWProject;
		#project = undefined;
		#variableDict = {};
		#getExpressionTypeAndValue = function ({ key1, key2 }) {
			let basicType = ['num', 'str', 'pos', 'tof'];
			if (basicType.includes(key1)) {
				return { type: key1, value: key2, overrideFunc: () => { } };
			} else {
				let type, value, overrideFunc;
				value = key1 in this.#variableDict ? this.#variableDict[key1][key2] : undefined;
				overrideFunc = newValue => {
					if (!(key1 in this.#variableDict)) {
						this.#variableDict[key1] = {};
					}
					this.#variableDict[key1][key2] = newValue;
				};
				if (['tmp', 'var'].includes(key1)) {
					type = key2.toString().slice(0, 3); // toString 以免出現非字串的 key2
					type = basicType.includes(type) ? type : undefined;
				} else {
					let propTypeMap = {
						'position': 'pos',
						'opened': 'tof'
					}
					type = key2 in propTypeMap ? propTypeMap[key2] : undefined;
				}
				return { type, value, overrideFunc };
			}
		}
		#pos2TwoPoints = function (pos) {
			if (!('center' in pos)) pos.center = [0, 0];
			if (!('size' in pos)) pos.size = [0, 0];
			return [
				pos.center[0] - pos.size[0] / 2,
				pos.center[1] - pos.size[1] / 2,
				pos.center[0] + pos.size[0] / 2,
				pos.center[1] + pos.size[1] / 2
			];
		}
		#runFlowChart = function (flowChartData) {
			if (flowChartData == undefined) throw Error('找不到要執行的節點樹！');
			if (!flowChartData.initialized) {
				let processQueueList = [
					[flowChartData.assignment, 'assignment'],
					[flowChartData.circumstance, 'circumstance'],
					[flowChartData.dialog, 'dialog']
				];
				processQueueList.forEach(([dataDict, dataType]) => {
					Object.values(dataDict).forEach(data => {
						data.nodeType = dataType;
					});
				});
				flowChartData.nodeDataDict = Object.fromEntries(processQueueList.map(([dataDict, _]) => Object.entries(dataDict)).flat());
				flowChartData.initialized = true;
			}

			let returnDialog = undefined;
			let nextNodeId = flowChartData.start;
			while (nextNodeId !== undefined) {
				let nodeData = flowChartData.nodeDataDict[nextNodeId];
				let leftExpressionData, rightExpressionData;
				switch (nodeData.nodeType) {
					case 'assignment':
						leftExpressionData = this.#getExpressionTypeAndValue(nodeData.leftExpression);
						rightExpressionData = this.#getExpressionTypeAndValue(nodeData.rightExpression);
						if (
							leftExpressionData.type === rightExpressionData.type ||
							!([leftExpressionData.type, rightExpressionData.type].includes(undefined))
						) {
							let newValue;
							switch (leftExpressionData.type) {
								case 'num':
									newValue =
										nodeData.operateType == 0 ? rightExpressionData.value :
											nodeData.operateType == 1 ? leftExpressionData.value + rightExpressionData.value :
												nodeData.operateType == 2 ? leftExpressionData.value * rightExpressionData.value :
													nodeData.operateType == 3 ? Math.pow(leftExpressionData.value, rightExpressionData.value) :
														nodeData.operateType == 4 ? leftExpressionData.value % rightExpressionData.value :
															undefined;
									break;
								case 'str':
									newValue =
										nodeData.operateType == 0 ? rightExpressionData.value :
											nodeData.operateType == 1 ? leftExpressionData.value + rightExpressionData.value :
												undefined;
									break;
								case 'pos':
									newValue =
										nodeData.operateType == 0 ? rightExpressionData.value :
											nodeData.operateType == 1 ? { center: leftExpressionData.value.map((n, i) => n + rightExpressionData.value[i]), size: leftExpressionData.value.size } :
												nodeData.operateType == 2 ? { center: rightExpressionData.value.center, size: leftExpressionData.value.size } :
													nodeData.operateType == 3 ? { center: leftExpressionData.value.center, size: rightExpressionData.value.size } :
														nodeData.operateType == 4 ? (() => {
															function vecLength(vec) { // from POWGameManager/script/basic.js
																return Math.sqrt(vec.map(n => Math.pow(n, 2)).reduce((s, n) => s + n))
															}
															let rtd = this.#pos2TwoPoints(rightExpressionData.value);
															let lc = leftExpressionData.value.center,
																rc = rightExpressionData.value.center;
															let pos2Points = [
																[rtd[0], rtd[1]],
																[rtd[2], rtd[1]],
																[rtd[2], rtd[3]],
																[rtd[0], rtd[3]],
															]
															let ntp = pos2Points
																.map(point => vecLength(lc.map((n, i) => n - point[i])))
																.map((distance, i) => [distance, i])
																.sort((a, b) => a[0] - b[0])
																.slice(0, 2)
																.map(DIPair => pos2Points[DIPair[1]]); // nearest two points
															let i1 = ntp[0][0] == ntp[1][0] ? 0 : 1,
																i2 = i1 == 0 ? 1 : 0;
															let newCenter = [0, 0];
															newCenter[i2] = rc[i2] + (lc[i2] - rc[i2]) / (lc[i1] - rc[i1]) * (rc[i1] - ntp[0][i1]);
															newCenter[i1] = ntp[0][i1];
															newCenter = newCenter.map((n, i) => (n + rc[i]) / 2);
															return { center: newCenter, size: leftExpressionData.value.size };
														})() :
															undefined;
									break;
								case 'tof':
									newValue =
										nodeData.operateType == 0 ? rightExpressionData.value :
											nodeData.operateType == 1 ? leftExpressionData.value | rightExpressionData.value :
												nodeData.operateType == 2 ? leftExpressionData.value & rightExpressionData.value :
													nodeData.operateType == 3 ? leftExpressionData.value ^ rightExpressionData.value :
														undefined;
									break;
							}
							leftExpressionData.overrideFunc(newValue);
						}
						nextNodeId = nodeData.then;
						break;
					case 'circumstance':
						let cmp = false;
						leftExpressionData = this.#getExpressionTypeAndValue(nodeData.leftExpression);
						rightExpressionData = this.#getExpressionTypeAndValue(nodeData.rightExpression);
						if (
							leftExpressionData.type === rightExpressionData.type ||
							!([leftExpressionData.type, rightExpressionData.type].includes(undefined))
						) {
							switch (leftExpressionData.type) {
								case 'num':
									cmp =
										nodeData.compType == 0 ? leftExpressionData.value == rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value < rightExpressionData.value :
												nodeData.compType == 2 ? leftExpressionData.value > rightExpressionData.value :
													undefined;
									break;
								case 'str':
									cmp =
										nodeData.compType == 0 ? leftExpressionData.value == rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value.toLowerCase() == rightExpressionData.value.toLowerCase() :
												nodeData.compType == 2 ? rightExpressionData.value.includes(leftExpressionData) :
													undefined;
									break;
								case 'pos':
									let ltd = this.#pos2TwoPoints(leftExpressionData.value), // left expression pos 2 two dots
										rtd = this.#pos2TwoPoints(rightExpressionData.value); // right expression pos 2 two dots
									cmp =
										nodeData.compType == 0 ? (ltd[0] == rtd[0] && ltd[1] == rtd[1] && ltd[2] == rtd[2] && ltd[3] == rtd[3]) :
											nodeData.compType == 1 ? (ltd[0] > rtd[0] && ltd[1] > rtd[1] && ltd[2] < rtd[2] && ltd[3] < rtd[3]) :
												nodeData.compType == 2 ? !(ltd[0] > rtd[2] || ltd[1] > rtd[3] || ltd[2] < rtd[0] || ltd[3] < rtd[1]) :
													undefined;
									break;
								case 'tof':
									cmp = nodeData.compType == 0 ? leftExpressionData.value == rightExpressionData.value : undefined;
									break;
							}
						}
						nextNodeId = cmp ? nodeData.ifTrue : nodeData.ifFalse;
						break;
					case 'dialog':
						returnDialog = { ...nodeData };
						delete returnDialog.dataType;
						nextNodeId = undefined;
						break;
				}
			}
			if (returnDialog) {
				return {
					image: returnDialog.image in this.#project.imageDataDict ? this.#project.imageDataDict[returnDialog.image].element : undefined,
					message: returnDialog.message,
					appendWords: returnDialog.appendWords,
					removeWords: returnDialog.removeWords
				};
			} else return this.#runFlowChart(this.#project.defaultCase);
		}
		constructor() { }
		load(source) {
			return new Promise(async resolve => {
				if (source instanceof POWProject) {
					this.#project = source;
					resolve();
				} else if (source instanceof File) {
					let zip = await JSZip.loadAsync(source);
					this.#project = await POWProject.fromZip(zip);
					resolve();
				} else if (typeof source == 'string') {
					let xhr = new XMLHttpRequest();
					xhr.addEventListener('load', async () => {
						let zip = await JSZip.loadAsync(xhr.response);
						this.#project = await POWProject.fromZip(zip);
						resolve();
					});
					xhr.responseType = 'arraybuffer';
					xhr.overrideMimeType('application/zip');
					xhr.open('GET', source);
					xhr.send();
				} else {
					throw Error('不支援此格式！');
					resolve();
				};
			});
		}
		init() {
			if (!this.#project) throw Error('播放器尚未載入專案！');
			this.#project.partOfSpeech.n.map((word, i) => {
				let wordAttribute = this.#project.wordAttribute.n[i];
				let handle = this.#getExpressionTypeAndValue({ key1: `wvn.${word}`, key2: 'position' });
				let center = 'center' in wordAttribute ? wordAttribute.center : [0, 0];
				let size = 'size' in wordAttribute ? wordAttribute.size : [0, 0];
				handle.overrideFunc({ center, size });
			})
			return this.#runFlowChart(this.#project.init);
		}
		exec([s, v, o]) {
			if (!this.#project) throw Error('播放器尚未載入專案！');
			[s, o] = [s, o].map(word => this.#project.partOfSpeech.n.indexOf(word));
			v = this.#project.partOfSpeech.v.indexOf(v);
			if ([s, v, o].includes(-1)) throw Error('輸入了未定義的詞卡！');
			let caseData = this.#project.cases[v][s][o];
			if (caseData == undefined) throw Error('主、受詞不得相同！');
			return this.#runFlowChart(caseData.start != undefined ? caseData : this.#project.defaultCase);
		}
		getPOSDict() {
			let POSDict = {};
			['n', 'v'].forEach(POS => {
				this.#project.partOfSpeech[POS].forEach(word => {
					POSDict[word] = POS;
				});
			});
			return POSDict;
		}
	}
	return POWPlayer;
})();