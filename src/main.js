import './assets/reset.css';

import { Display, KEYS, RNG, Map } from 'rot-js';
import WebGLazy from 'webglazy';
import shaderSrc from './shader.frag.glsl';
import { drawRoom } from './room';
import { getPaths } from './corridor';


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

let text = '';
let textTimeout;
let textIdx;
window.scheduleText = (newText) => {
	text = newText;
	textIdx = 0;
	if (textTimeout) {
		clearTimeout(textTimeout);
	}

	function nextText() {
		++textIdx;
		while (textIdx < text.length && !text[textIdx].trim()) {
			++textIdx;
		}
		if (textIdx < text.length) {
			textTimeout = setTimeout(nextText, 100);
		}
		draw();
	}

	nextText();
};

function draw() {
	display.clear();

	drawRooms();
	// display.drawText(1, 1, "Hello world");
	display.draw(player.x, player.y, '👤', 'white', 'black');

	characters.forEach(({
		x,
		y,
		symbol,
		colour,
	}) => {
		display.draw(x, y, symbol, colour);
	});

	if (text) {
		for (let x = 0; x <= width; ++x) {
			for (let y = height - 4; y <= height; ++y) {
				display.draw(x, y, '', '', 'black');
			}
		}
		display.drawText(1, height - 3, text.replace(new RegExp(`(.{${textIdx}})(.*)`), (_, show, hide) => `${show}${hide.replace(/[^\s]/g, '\u00A0')}`), width - 2);
	}
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

function drawPaths(p, colour) {
	p.forEach(({ corridors }) => {
		corridors.forEach(({
			left,
			top,
			right,
			bottom,
		}) => {
			for (let y = top; y <= bottom; ++y) {
				for (let x = left; x <= right; ++x) {
					display.draw(x, y, '※', colour);
				}
			}
		});
	});
}

function drawCorridors() {
	drawPaths(paths, 'grey');
	if (prevConnection) {
		drawPaths(prevConnection.paths, 'green');
	}
	if (curConnection) {
		drawPaths(curConnection.paths, 'red');
	}
}

function drawRooms() {
	rooms.forEach(room => {
		drawRoom(display, room, 'grey', 'darkgrey');
	});
	drawCorridors();
	// map.getRooms().forEach(room => {
	// drawRoom(display, room, 'red', 'darkred');
	// room.getDoors(drawDoor);
	// });

	if (prevConnection) {
		prevConnection.rooms
			.map(id => map.getRooms()[id])
			.forEach(room => {
				drawRoom(display, room, 'red', 'darkred');
			});
	}

	if (curConnection) {
		curConnection.rooms
			.map(id => map.getRooms()[id])
			.forEach(room => {
				drawRoom(display, room, 'yellow', 'orange');
				room.getDoors(drawDoor);
			});
	}
}

let curConnection;
let prevConnection;
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

	const connection = connections[[player.x, player.y].join(',')];
	if (connection) {
		// at a connection point
		prevConnection = curConnection;
		curConnection = connection;
	} else if (curConnection && curConnection.rooms.length > 1) {
		// left a connection point
		prevConnection = curConnection;
		curConnection = {
			rooms: [curConnection.rooms.find(id => {
				const room = map.getRooms()[id];
				const top = room.getTop() - 1;
				const bottom = room.getBottom() + 1;
				const left = room.getLeft() - 1;
				const right = room.getRight() + 1;
				return player.x >= left && player.x <= right && player.y >= top && player.y <= bottom;
			})],
			paths: [],
		};
	}


	// const character = characters.find(({ x, y }) => x === player.x && y === player.y);
	// if (character) {
	// 	scheduleText(character.text);
	// } else {
	// 	scheduleText('');
	// }

	draw();
});

const paths = getPaths(map);
const rooms = map.getRooms();

const doors = rooms.reduce((result, item) => {
	item.getDoors((x, y) => result.push([x, y]));
	return result;
}, []);

const connections = {};
rooms.forEach((room, idx) => room.getDoors((x, y) => {
	const id = [x, y].join(',');
	connections[id] = connections[id] || {
		rooms: [],
		paths: [],
	};
	connections[id].rooms.push(idx);
}));
doors.forEach(([x, y]) => {
	const id = [x, y].join(',');
	paths.forEach((path) => {
		const {
			corridors = [],
		} = path;
		corridors.forEach(({
			left,
			top,
			right,
			bottom,
		}) => {
			if ((left === x && top === y) || (right === x && bottom === y)) {
				connections[id].paths.push(path);
			}
		});
	});
});


[player.x, player.y] = rooms[0].getCenter();

const characters = [{
	x: rooms[1].getCenter()[0],
	y: rooms[1].getCenter()[1],
	text: 'I am a person with a description.',
	symbol: '🤷',
	colour: 'white',
}];
setTimeout(() => {
	draw();
});
// document.addEventListener("keypress", function(e) {
//     var code = e.charCode;
//     var ch = String.fromCharCode(code);
//     out2.innerHTML = "Keypress: char is " + ch;
// });

window.debug = {
	map,
	rooms,
	doors,
	paths,
	connections,
};
