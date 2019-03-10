import './assets/reset.css';

import { Display, KEYS, RNG, Map, Color } from 'rot-js';
import WebGLazy from 'webglazy';
import shaderSrc from './shader.frag.glsl';
import { drawRoom, getSpaces, getPointsOfInterest } from './room';
import { getPaths } from './corridor';
import { lerp, strToPos, getRandomItem } from './utils';
import charactersSource from './characters';

let textCol = 'white';
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
	drawPaths(prevConnection.paths, 'rgb(0,50,0)');
	prevConnection.rooms.forEach(room => {
		drawRoom(display, room, 'rgb(30,70,0)', 'rgb(0,50,0)');
	});
	curConnection.rooms.forEach(room => {
		drawRoom(display, room, 'rgb(94,179,0)', 'rgb(187,155,0)');
	});
	drawPaths(curConnection.paths, 'rgb(187,155,0)');
	curConnection.paths.forEach(({ doors }) => {
		doors.forEach(([x, y]) => drawDoor(x, y, 'rgb(30,70,0)'));
	});
	curConnection.rooms.forEach(room => {
		room.getDoors((x, y) => drawDoor(x, y, 'rgb(94,179,0)'));
	});

	curConnection.rooms.forEach(({ characters }) => {
		characters.forEach(({
			x,
			y,
			symbol,
			colour,
		}) => {
			display.draw(x, y, symbol, colour);
		});
	});
	display.draw(player.x, player.y, playerChar, 'rgb(220,255,220)');
	

	glazy.gl.uniform1f(glazy.glLocations.text, text ? 1 : 0);
	if (text) {
		const c = { ...camera };
		camera.x = camera.y = 0;
		for (let x = 0; x <= width; ++x) {
			for (let y = height - 5; y <= height; ++y) {
				display.draw(x, y, '', '', 'black');
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
		display.drawText(1, height - 4, `%c{${textCol}}%b{black}${t.replace(new RegExp(`(.{${textIdx}})(.*)`), (_, show, hide) => `${show}${hide.replace(/[^\s]/g, '\u00A0')}`)}`, width - 2);
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
	if (textIdx < text.length) {
		finishText();
		return;
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
		const path = curConnection.paths.find(({ cells }) => cells[`${player.x},${player.y}`]);
		const roomId = curConnection.rooms.find(room => {
			const top = room.getTop();
			const bottom = room.getBottom();
			const left = room.getLeft();
			const right = room.getRight();
			return player.x >= left && player.x <= right && player.y >= top && player.y <= bottom;
		});
		if (path) {
			prevConnection = curConnection;
			curConnection = { rooms: [], paths: [path] };
		} else if (roomId !== undefined) {
			prevConnection = curConnection;
			curConnection = { rooms: [roomId], paths: [] };
		} else {
			collideWall();
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


	curConnection.rooms.forEach(({ characters }) => {
		const idx = characters.findIndex(({ x, y }) => x === player.x && y === player.y);
		const character = characters[idx];
		if (character) {
			if (character.script) {
				character.script = false;
				character.text = scriptText.shift() || 'Thanks for playing.';
			}
			if (text !== character.text) {
				textCol = character.colour;
				scheduleText(character.text);
			}
			if (character.solid) {
				collideWall();
			}
			if (character.pickup) {
				characters.splice(idx, 1);
			}
		} else {
			scheduleText('');
		}
	});
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
	disableFeedbackTexture: true,
});
glazy.glLocations.gridOffset = glazy.gl.getUniformLocation(glazy.shader.program, 'gridOffset');
glazy.glLocations.lightOffset = glazy.gl.getUniformLocation(glazy.shader.program, 'lightOffset');
glazy.glLocations.text = glazy.gl.getUniformLocation(glazy.shader.program, 'text');
glazy.gl.uniform1f(glazy.glLocations.text, 1);

display.drawText(1, height - 3, "Loading...");

let curConnection;
let prevConnection;
RNG.setSeed(123);
const map = new Map.Uniform(width * 4, height * 4, {
	// roomWidth: [min, max],
	// roomHeight: [min, max],
	roomDugPercentage: 0.5,
	timeLimit: 10000,
});
const connections = {};
const player = {};
let playerChar = '';
const camera = {};
let paths;
let rooms;
let doors;

let scriptText = `
This is not a rogue-like.
It wanted to be one.
It figured out a rough aesthetic - the look and feel.
It's even built with a rogue-like toolkit.
But it lacked direction. Didn't know what to be.
It's a bit sad, to have such high hopes and achieve so few.
So what's to be done? Is it to be abandoned? A forgotten failure?
Maybe it deserves better.
If it can't be what it wanted, it can be something else.
Something lesser, but not necessarily worse.
This is not a rogue-like. It just is what it is.
`.trim().split('\n');

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

	// get connections
	// for rooms
	rooms.forEach(room => room.getDoors((x, y) => {
		const id = [x, y].join(',');
		connections[id] = connections[id] || {
			rooms: [],
			paths: [],
		};
		connections[id].rooms.push(room);
	}));
	// for paths
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

	// place characters
	rooms.forEach(room => {
		const spaces = getSpaces(room, getPointsOfInterest(room));
		let [x,y] = getRandomItem(spaces);
		room.characters = [];
		room.characters.push({
			x,
			y,
			symbol: 'ℹ',
			colour: 'rgb(0,255,0)',
			script: true,
			solid: true,
		});
		const spaces2 = getSpaces(room, getPointsOfInterest(room));
		for(let i = 0; i < spaces2.length; ++i) {
			if (Math.random() < 0.5) {
				continue;
			}
			const c = getRandomItem(charactersSource);
			const t = c.text.flatten('#main#');
			[x,y] = spaces2[i];
			room.characters.push({
				x,
				y,
				solid: c.solid,
				pickup: c.pickup,
				symbol: getRandomItem(c.symbol),
				text: t,
				colour: Color.toRGB(Color.interpolate(...c.colour, Math.random())),
			});
		}
	});
	

	// camera/player stuff
	const [x, y] = rooms[0].getCenter();
	player.x = x;
	player.y = y;
	rooms[0].characters.splice(1);
	[rooms[0].characters[0].x, player.x] = [player.x, rooms[0].characters[0].x];
	[rooms[0].characters[0].y, player.y] = [player.y, rooms[0].characters[0].y];
	camera.x = player.x - width / 2;
	camera.y = player.y - height / 2;
	curConnection = { rooms: [rooms[0]], paths: [] };
	prevConnection = curConnection;


	new Promise(resolve => {
		display.clear();
		display.drawText(1, height - 3, "Who are you?");
		function pickChar(event) {
			playerChar = event.key.trim();
			if (playerChar.length === 1) {
				document.removeEventListener("keydown", pickChar);
				resolve();
			}
		}
		document.addEventListener("keydown", pickChar);
	}).then(() => {
		// start
		const d = display.draw.bind(display);
		display.draw = function(x, y, ...args) {
			d(x - camera.x, y - camera.y, ...args);
		};
		setInterval(() => {
			camera.x = Math.floor(lerp(camera.x, player.x - width / 2, 0.2) * width) / width;
			camera.y = Math.floor(lerp(camera.y, player.y - height / 2, 0.2) * height) / height;
			glazy.gl.uniform2f(glazy.glLocations.gridOffset, -camera.x % 1, camera.y % 1);
			draw();
		}, 120);
		
		document.addEventListener("keydown", onKeyDown);
		display.clear();

		// debug
		window.debug = {
			display,
			map,
			rooms,
			doors,
			paths,
			connections,
		};
	});
}, 100);
