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
