'use strict';
(async () => {
	/* basic canvas set-up */
	const cvs = document.querySelector('#view-canvas');
	const ctx = cvs.getContext('2d');
	[cvs.width, cvs.height] = [CW, CH];
	cvs.style.setProperty('--w-h-ratio', `${CW}/${CH}`);

	/* mouse event */
	const mouse = { x: 0, y: 0, click: false, up: false, down: false, over: false, leave: false };
	var gameCycle = await initGameCycle({ cvs, ctx, mouse, CW, CH });
	let boundingRect = cvs.getBoundingClientRect();
	function updateMousePosition(event){
		[mouse.x, mouse.y] = [(event.pageX - boundingRect.x) / boundingRect.width * CW, (event.pageY - boundingRect.y) / boundingRect.height * CH];
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
	window.addEventListener("resize", () => {
		boundingRect = cvs.getBoundingClientRect();
	});
	gameCycle();
})();