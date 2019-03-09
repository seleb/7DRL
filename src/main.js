import './assets/reset.css';

import { Display, KEYS, RNG, Map } from 'rot-js';
import WebGLazy from 'webglazy';
import shaderSrc from './shader.frag.glsl';
import { drawRoom } from './room';
import { getPaths } from './corridor';
import { lerp } from './utils';


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
	// bg: 'grey',
});
const d = display.draw.bind(display);
display.draw = function(x, y, ...args) {
	d(x - camera.x, y - camera.y, ...args);
};
document.body.appendChild(display.getContainer());
const glazy = new WebGLazy({
	background: 'black',
	scaleMode: WebGLazy.SCALE_MODES.MULTIPLES,
	source: display.getContainer(),
	fragment: shaderSrc,
	pixelate: false,
	scaleMultiplier: 3,
});
glazy.glLocations.gridOffset = glazy.gl.getUniformLocation(glazy.shader.program, 'gridOffset');
glazy.glLocations.lightOffset = glazy.gl.getUniformLocation(glazy.shader.program, 'lightOffset');
glazy.glLocations.text = glazy.gl.getUniformLocation(glazy.shader.program, 'text');

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

const camera = {
	x: 0,
	y: 0,
};

setInterval(() => {
	camera.x = Math.floor(lerp(camera.x, player.x - width/2, 0.1)*width)/width;
	camera.y = Math.floor(lerp(camera.y, player.y - height/2, 0.1)*height)/height;
	glazy.gl.uniform2f(glazy.glLocations.gridOffset, -camera.x%1, camera.y%1);
	draw();
}, 120);

function draw() {
	glazy.gl.uniform2f(glazy.glLocations.lightOffset, (camera.x-player.x)/width+0.5, (player.y-camera.y)/height-0.5);
	display.clear();

	drawRooms();
	display.draw(player.x, player.y, '☻', 'white', 'black');
	// display.drawText(1, 1, "Hello world");

	characters.forEach(({
		x,
		y,
		symbol,
		colour,
	}) => {
		display.draw(x, y, symbol, colour);
	});

	glazy.gl.uniform1f(glazy.glLocations.text, text ? 1 : 0);
	if (text) {
		const c = {...camera};
		camera.x = camera.y = 0;
		for (let x = 0; x <= width; ++x) {
			for (let y = height - 4; y <= height; ++y) {
				d(x, y, '', '', 'black');
			}
		}
		display.drawText(1, height - 3, '%c{white}%b{black}' + text.replace(new RegExp(`(.{${textIdx}})(.*)`), (_, show, hide) => `${show}${hide.replace(/[^\s]/g, '\u00A0')}`), width - 2);
		camera.x = c.x;
		camera.y = c.y;
	}
}

// RNG.setSeed(123);
var map = new Map.Digger(width*2, height*2, {
	// roomWidth: [min, max],
	// roomHeight: [min, max],
	corridorLength: [3, 5],
	dugPercentage: 0.8,
	timeLimit: 2000,
});
map.create();
console.log(map);

var drawDoor = function(x, y) {
	display.draw(x, y, "ↀ", "yellow");
}

function drawPaths(p, colour) {
	p.forEach(({ cells }) => {
		Object.keys(cells)
			.map(cell => cell.split(',').map(str => parseInt(str, 10)))
			.forEach(([x, y]) => {
				display.draw(parseInt(x, 10), parseInt(y, 10), '※', colour);
			});
	});
}

function drawCorridors() {
	// drawPaths(paths, 'grey');
	drawPaths(prevConnection.paths, 'darkred');
	drawPaths(curConnection.paths, 'orange');
}

function drawRooms() {
	drawCorridors();
	// rooms.forEach(room => {
	// 	drawRoom(display, room, 'grey', 'darkgrey');
	// });
	// rooms.forEach(room => {
	// drawRoom(display, room, 'red', 'darkred');
	// room.getDoors(drawDoor);
	// });

	prevConnection.rooms
		.map(id => rooms[id])
		.forEach(room => {
			drawRoom(display, room, 'red', 'darkred');
		});

	curConnection.rooms
		.map(id => rooms[id])
		.forEach(room => {
			drawRoom(display, room, 'yellow', 'orange');
			room.getDoors(drawDoor);
		});
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

	const {
		x: prevX,
		y: prevY,
	} = player;
	function collideWall() {
		player.x = prevX;
		player.y = prevY;
	}
	player.x += x;
	player.y += y;

	// collision
	const connection = connections[[player.x, player.y].join(',')];
	if (connection) {
		// at a connection point
		prevConnection = curConnection;
		curConnection = connection;
	} else if (curConnection.rooms.length + curConnection.paths.length > 1) {
		// left a connection point
		const roomId = curConnection.rooms.find(id => {
			const room = rooms[id];
			const top = room.getTop();
			const bottom = room.getBottom();
			const left = room.getLeft();
			const right = room.getRight();
			return player.x >= left && player.x <= right && player.y >= top && player.y <= bottom;
		});
		if (roomId !== undefined) {
			prevConnection = curConnection;
			curConnection = { rooms: [roomId], paths: [] };
		} else {
			const path = curConnection.paths.find(({ cells }) => cells[`${player.x},${player.y}`]);
			if (path) {
				prevConnection = curConnection;
				curConnection = { rooms: [], paths: [path] };
			} else {
				collideWall();
			}
		}
	} else {
		// collision
		if (curConnection.rooms.length === 1) {
			const room = rooms[curConnection.rooms[0]];
			if (player.x < room.getLeft() || player.x > room.getRight() || player.y < room.getTop() || player.y > room.getBottom()) {
				collideWall();
			}
		} else if (curConnection.paths.length === 1) {
			const path = curConnection.paths[0];
			if (!path.cells[`${player.x},${player.y}`]) {
				collideWall();
			}
		}
	}

	const character = characters.find(({ x, y }) => x === player.x && y === player.y);
	if (character) {
		scheduleText(character.text);
		collideWall();
	} else {
		scheduleText('');
	}

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
			cells = {},
		} = path;
		if (
			cells[`${x},${y}`] ||
			cells[`${x+1},${y}`] ||
			cells[`${x},${y+1}`] ||
			cells[`${x-1},${y}`] ||
			cells[`${x},${y-1}`]
		) {
			connections[id].paths.push(path);
		}
	});
});


[player.x, player.y] = rooms[0].getCenter();
curConnection = { rooms: [0], paths: [] };
prevConnection = curConnection;

import characterSymbolsSrc from './characters.txt';
const characterSymbols = characterSymbolsSrc.split('\n').filter(s => s);
const characters = [];
rooms.forEach((room, idx) => {
	characters.push({
		x: rooms[idx].getCenter()[0],
		y: rooms[idx].getCenter()[1],
		text: 'I am a person with a description.',
		symbol: characterSymbols[Math.floor(Math.random()*characterSymbols.length)],
		colour: 'white',
	});
})
setTimeout(() => {
	draw();
});
// document.addEventListener("keypress", function(e) {
//     var code = e.charCode;
//     var ch = String.fromCharCode(code);
//     out2.innerHTML = "Keypress: char is " + ch;
// });

window.debug = {
	display,
	map,
	rooms,
	doors,
	paths,
	connections,
};
