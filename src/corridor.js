import { strToPos } from "./utils";

export function getPaths(map) {
	const cells = map.getCorridors()
	// normalize
	.map(({
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
		return {
			left,
			top,
			right,
			bottom,
		};
	})
	// convert to cells
	.reduce((result, {
		left,
		right,
		top,
		bottom,
	}) => {
		for (let y = top; y <= bottom; ++y) {
			for (let x = left; x <= right; ++x) {
				result[`${x},${y}`] = true;
			}
		}
		return result;
	}, {});

	const paths = [];
	do {
		const path = {};
		const start = Object.keys(cells)[0];
		function addCell(cell) {
			delete cells[cell];
			path[cell] = true;
			const [x,y] = strToPos(cell);
			[
				[1,0],
				[-1,0],
				[0,1],
				[0,-1],
			].forEach(([ax, ay]) => {
				const id = `${x+ax},${y+ay}`;
				if (cells[id]) {
					addCell(id);
				}
			});
		}
		addCell(start);
		paths.push({
			cells: path,
			doors: [],
		});
	} while (Object.keys(cells).length);
	return paths;
}
