import './assets/reset.css';

import { Display, KEYS, RNG, Map } from 'rot-js';
import WebGLazy from 'webglazy';
import shaderSrc from './shader.frag.glsl';
import { drawRoom } from './room';
import { getPaths } from './corridor';
import { lerp, strToPos } from './utils';
import characterSymbolsSrc from './characters.txt';

let text = '';
let textTimeout;
let textIdx;
let finishText = () => {};
function scheduleText(newText) {
	text = newText;
	textIdx = 0;
	if (textTimeout) {
		clearTimeout(textTimeout);
	}

	finishText = () => {
		clearTimeout(textTimeout);
		textIdx = text.length;
		draw();
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
}

function draw() {
	glazy.gl.uniform2f(glazy.glLocations.lightOffset, (camera.x - player.x) / width + 0.5, (player.y - camera.y) / height - 0.5);
	display.clear();
	drawPaths(prevConnection.paths, 'darkred');
	prevConnection.rooms.forEach(room => {
		drawRoom(display, room, 'red', 'darkred');
	});
	curConnection.rooms.forEach(room => {
		drawRoom(display, room, 'yellow', 'orange');
	});
	drawPaths(curConnection.paths, 'orange');
	curConnection.paths.forEach(({ doors }) => {
		doors.forEach(([x, y]) => drawDoor(x, y, 'red'));
	});
	curConnection.rooms.forEach(room => {
		room.getDoors((x, y) => drawDoor(x, y, 'yellow'));
	});
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
		const c = { ...camera };
		camera.x = camera.y = 0;
		for (let x = 0; x <= width; ++x) {
			for (let y = height - 4; y <= height; ++y) {
				d(x, y, '', '', 'black');
			}
		}
		let t = text;
		for (let i = 0; i < Math.random() * 3; ++i) {
			if (Math.random() < 0.9) {
				continue;
			}
			t = t.replace(new RegExp(`(.{${Math.floor(Math.random()*t.length)}})(.)(.*)`), (_, a, replace, b) => (
				`${a}${!replace.trim() ? replace : String.fromCodePoint(replace.codePointAt(0)+Math.floor(25*(Math.random()-0.5)))}${b}`
			));
		}
		display.drawText(1, height - 3, '%c{white}%b{black}' + t.replace(new RegExp(`(.{${textIdx}})(.*)`), (_, show, hide) => `${show}${hide.replace(/[^\s]/g, '\u00A0')}`), width - 2);
		camera.x = c.x;
		camera.y = c.y;
	}
}

function drawDoor(x, y, color) {
	const { open } = doors[`${x},${y}`];
	display.draw(x, y, open ? '[  ]' : "⁅⁆", color);
}

function drawPaths(p, colour) {
	p.forEach(({ cells }) => {
		Object.keys(cells)
			.map(strToPos)
			.forEach(([x, y]) => {
				display.draw(x, y, '※', colour);
			});
	});
}

function onKeyDown(e) {
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

	move(x,y);
	draw();
}

function move(x,y) {
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
	const door = doors[[player.x, player.y].join(',')];
	if (door) {
		clearTimeout(door.closeTimeout);
		door.closeTimeout = setTimeout(() => {
			door.open = false;
		}, 1000);
		if (!door.open) {
			collideWall();
			door.open = true;
			return;
		}
	} 
	const connection = connections[[player.x, player.y].join(',')];
	if (connection) {
		// at a connection point
		prevConnection = curConnection;
		curConnection = connection;
		return;
	}
	
	if (curConnection.rooms.length + curConnection.paths.length > 1) {
		// left a connection point
		const roomId = curConnection.rooms.find(room => {
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
		return;
	}

	// collision
	if (curConnection.rooms.length === 1) {
		const room = curConnection.rooms[0];
		if (player.x < room.getLeft() || player.x > room.getRight() || player.y < room.getTop() || player.y > room.getBottom()) {
			collideWall();
			return;
		}
	}
	if (curConnection.paths.length === 1) {
		const path = curConnection.paths[0];
		if (!path.cells[`${player.x},${player.y}`]) {
			collideWall();
			return;
		}
	}


	const character = characters.find(({ x, y }) => x === player.x && y === player.y);
	if (character) {
		if (text === character.text) {
			finishText();
		} else {
			scheduleText(character.text);
		}
		collideWall();
	} else {
		scheduleText('');
	}
}







const width = 24;
const height = 24;

const display = new Display({
	width,
	height,
	layout: 'rect',
	fontFamily: 'serif',
	fontSize: 12,
	forceSquareRatio: true,
	// bg: 'grey',
});
const glazy = new WebGLazy({
	background: 'black',
	scaleMode: WebGLazy.SCALE_MODES.FIT,
	source: display.getContainer(),
	fragment: shaderSrc,
	pixelate: false,
	scaleMultiplier: 3,
	allowDownscaling: true,
});
glazy.glLocations.gridOffset = glazy.gl.getUniformLocation(glazy.shader.program, 'gridOffset');
glazy.glLocations.lightOffset = glazy.gl.getUniformLocation(glazy.shader.program, 'lightOffset');
glazy.glLocations.text = glazy.gl.getUniformLocation(glazy.shader.program, 'text');
glazy.gl.uniform1f(glazy.glLocations.text, 1);

display.drawText(1, height - 3, "Loading...");

const d = display.draw.bind(display);
display.draw = function(x, y, ...args) {
	d(x - camera.x, y - camera.y, ...args);
};

let curConnection;
let prevConnection;
// RNG.setSeed(123);
const map = new Map.Uniform(width * 4, height * 4, {
	// roomWidth: [min, max],
	// roomHeight: [min, max],
	roomDugPercentage: 0.5,
	timeLimit: 10000,
});
const connections = {};
const player = {};
const camera = {};
const characters = [];
let paths;
let rooms;
let doors;

setTimeout(() => {
	map.create();
	paths = getPaths(map);
	rooms = map.getRooms();
	doors = rooms.reduce((result, item) => {
		item.getDoors((x, y) => result[`${x},${y}`] = {
			open: false,
		});
		return result;
	}, {});

	rooms.forEach(room => room.getDoors((x, y) => {
		const id = [x, y].join(',');
		connections[id] = connections[id] || {
			rooms: [],
			paths: [],
		};
		connections[id].rooms.push(room);
	}));
	Object.keys(doors).map(strToPos).forEach(([x, y]) => {
		const id = [x, y].join(',');
		paths.forEach(path => {
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
				path.doors.push([x, y]);
			}
		});
	});

	[player.x, player.y] = rooms[0].getCenter();
	camera.x = player.x - width / 2;
	camera.y = player.y - height / 2;
	curConnection = { rooms: [rooms[0]], paths: [] };
	prevConnection = curConnection;
	const characterSymbols = characterSymbolsSrc.split('\n').filter(s => s);
	rooms.forEach(room => {
		characters.push({
			x: room.getCenter()[0],
			y: room.getCenter()[1],
			text: 'I am a person with a description.',
			symbol: characterSymbols[Math.floor(Math.random() * characterSymbols.length)],
			colour: 'white',
		});
	})

	setInterval(() => {
		camera.x = Math.floor(lerp(camera.x, player.x - width / 2, 0.1) * width) / width;
		camera.y = Math.floor(lerp(camera.y, player.y - height / 2, 0.1) * height) / height;
		glazy.gl.uniform2f(glazy.glLocations.gridOffset, -camera.x % 1, camera.y % 1);
		draw();
	}, 120);

	window.debug = {
		display,
		map,
		rooms,
		doors,
		paths,
		connections,
	};
	
	document.addEventListener("keydown", onKeyDown);
}, 100);
