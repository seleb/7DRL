import { posToStr, strToPos } from "./utils";
import { Path } from "rot-js";

// const room = `
// ╔═╗
// ║ ║
// ╚═╝
// `;
// const room = `
// ┌─┐
// │ │
// └─┘
// `;
const room = `
╭─╮
│⁛│
╰─╯
`;
const tl = room[1];
const t = room[2];
const tr = room[3];
const l = room[5];
const c = room[6];
const r = room[7];
const bl = room[9];
const b = room[10];
const br = room[11];

export function drawRoom(display, room, border, fill) {
	const top = room.getTop();
	const bottom = room.getBottom();
	const left = room.getLeft();
	const right = room.getRight();
	// corners
	display.draw(left - 1, top - 1, tl, border);
	display.draw(right + 1, top - 1, tr, border);
	display.draw(left - 1, bottom + 1, bl, border);
	display.draw(right + 1, bottom + 1, br, border);

	// verticals
	for (let y = top; y <= bottom; ++y) {
		display.draw(left - 1, y, l, border);
		display.draw(right + 1, y, r, border);
	}
	// horizontals
	for (let x = left; x <= right; ++x) {
		display.draw(x, top - 1, t, border);
		display.draw(x, bottom + 1, b, border);
	}
	// fill
	for (let y = top; y <= bottom; ++y) {
		for (let x = left; x <= right; ++x) {
			display.draw(x, y, c, fill);
		}
	}
}
export function getSpaces(room, points = []) {
	const left = room.getLeft();
	const right = room.getRight();
	const top = room.getTop();
	const bottom = room.getBottom();
	const data = {};
	for (let x = left; x <= right; ++x) {
		for (let y = top; y <= bottom; ++y) {
			data[posToStr(x,y)] = true;
		}
	}
	const spaces = { ...data };

	/* input callback informs about map structure */
	function passableCallback(x, y) {
		return data[posToStr(x,y)];
	}

	points.forEach(([x,y]) => {
		const astar = new Path.AStar(...room.getCenter(), passableCallback, { topology: 4 });
		astar.compute(x, y, function(x, y) {
			delete spaces[posToStr(x,y)];
		});
	});
	return Object.keys(spaces).map(strToPos);
}

export function getPointsOfInterest(room) {
	const points = [];
	// doors
	room.getDoors((x, y) => {
		let dx = 0;
		let dy = 0;
		if (x === room.getLeft() - 1) {
			dx = 1;
		}else if (x === room.getRight() + 1) {
			dx = -1;
		}if (y === room.getTop() - 1) {
			dy = 1;
		}else if (y === room.getBottom() + 1) {
			dy = -1;
		}
		points.push([x + dx, y + dy]);
	});
	// characters
	const { characters = [] } = room;
	characters.forEach(({ x, y }) => {
		points.push([x,y]);
	});
	return points;
}

window.getSpaces = getSpaces;
