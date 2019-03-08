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
	// merge colinear
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
			const [x,y] = cell.split(',').map(str => parseInt(str, 10));
			[
				[1,0],
				[-1,0],
				[0,1],
				[0,-1],
			].forEach(([ax, ay]) => {
				const id = `${x+ax},${y+ay}`;
				if (cells[id]) {
					delete cells[id];
					path[id] = true;
					addCell(id);
				}
			});
		}
		delete cells[start];
		path[start] = true;
		addCell(start);
		paths.push({
			cells: path
		});
	} while (Object.keys(cells).length);
	return paths;
}
