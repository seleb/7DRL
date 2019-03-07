import './assets/reset.css';

import { Display, KEYS, RNG, Map } from 'rot-js';
import WebGLazy from 'webglazy';
import shaderSrc from './shader.frag.glsl';
import { drawRoom } from './room';


const width = 24;
const height = 24;

const player = {
	x: 0,
	y: 0,
};

const display = new Display({
	width,
	height,
	layout: 'rect',
	fontFamily: 'serif',
	fontSize: 12,
	forceSquareRatio: true,
});
document.body.appendChild(display.getContainer());
new WebGLazy({
	background: 'black',
	scaleMode: WebGLazy.SCALE_MODES.MULTIPLES,
	source: display.getContainer(),
	fragment: shaderSrc,
	pixelate: false,
	scaleMultiplier: 3,
});

function draw() {
	display.clear();

	drawRooms();
	display.drawText(1, 1, "Hello world");
	display.draw(player.x, player.y, '👤', 'white', 'black');
}


// RNG.setSeed(123);
var map = new Map.Digger(width, height, {
	// roomWidth: [min, max],
	// roomHeight: [min, max],
	corridorLength: [3, 5],
	dugPercentage: 0.8,
	timeLimit: 2000,
});
map.create();
console.log(map);

var drawDoor = function(x, y) {
	display.draw(x, y, "Ξ", "yellow");
}

function drawRooms() {
	map.getCorridors().forEach(({
		_startX: left,
		_startY: top,
		_endX: right,
		_endY: bottom,
	}) => {
		if (bottom < top) {
			[top, bottom] = [bottom, top];
		}
		if (right < left) {
			[right, left] = [left, right];
		}
		for (let y = top; y <= bottom; ++y) {
			for (let x = left; x <= right; ++x) {
				display.draw(x, y, '※','darkred');
			}
		}
	});
	map.getRooms().forEach(room => {
		drawRoom(display, room, 'red', 'darkred');
		// room.getDoors(drawDoor);
	});

	curRooms
	.map(id => map.getRooms()[id])
	.forEach(room => {
		drawRoom(display, room, 'yellow', 'orange');
		room.getDoors(drawDoor);
	});
}

const curRooms = [0];
document.addEventListener("keydown", function(e) {
	var code = e.keyCode;

	// var vk = "?"; /* find the corresponding constant */
	// for (var name in ROT.KEYS) {
	//     if (ROT.KEYS[name] == code && name.indexOf("VK_") == 0) { vk = name; }
	// }
	let x = 0;
	let y = 0;

	if (code === KEYS.VK_W) {
		y -= 1;
	}
	if (code === KEYS.VK_S) {
		y += 1;
	}
	if (code === KEYS.VK_A) {
		x -= 1;
	}
	if (code === KEYS.VK_D) {
		x += 1;
	}

	player.x += x;
	player.y += y;

	const door = doors[[player.x,player.y].join(',')];
	if (door) {
		curRooms.length = 0;
		curRooms.push(...door);
	} else if(curRooms.length > 1) {
		const potential = curRooms.slice();
		curRooms.length = 0;
		curRooms.push(potential.find(id => {
			const room = map.getRooms()[id];
			const top = room.getTop() - 1;
			const bottom = room.getBottom() + 1;
			const left = room.getLeft() - 1;
			const right = room.getRight() + 1;
			return player.x >= left && player.x <= right && player.y >= top && player.y <= bottom;
		}));
	}

	draw();
});


const doors = {};
map.getRooms().forEach((room, idx) => room.getDoors((x, y) => {
	const id = [x, y].join(',');
	doors[id] = doors[id] || [];
	doors[id].push(idx);
}));
console.log(doors);

[player.x, player.y] = map.getRooms()[0].getCenter();
setTimeout(() => {
	draw();
});
// document.addEventListener("keypress", function(e) {
//     var code = e.charCode;
//     var ch = String.fromCharCode(code);
//     out2.innerHTML = "Keypress: char is " + ch;
// });
