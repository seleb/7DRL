export function getPaths(map) {
	const corridors = map.getCorridors()
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
	.reduce((result, item) => {
		const {
			left: aLeft,
			right: aRight,
			top: aTop,
			bottom: aBottom,
		} = item;
		const c = result.find(({
			left: bLeft,
			right: bRight,
			top: bTop,
			bottom: bBottom,
		}) => (
			(aLeft === aRight && bLeft === bRight && aLeft === bLeft && (bTop === aBottom + 1 || aTop === bBottom + 1))
			||
			(aTop === aBottom && bTop === bBottom && aTop === bTop && (bLeft === aRight + 1 || aLeft === bRight + 1))
		));
		if (c) {
			c.left = Math.min(aLeft, c.left);
			c.right = Math.max(aRight, c.right);
			c.top = Math.min(aTop, c.top);
			c.bottom = Math.max(aBottom, c.bottom);
		} else {
			result.push(item);
		}
		return result;
	}, []);

	const paths = [{
		corridors: [corridors.pop()],
	}];
	while(corridors.length) {
		const c = corridors.findIndex(({
			left: aLeft,
			top: aTop,
			right: aRight,
			bottom: aBottom,
		}) => paths[paths.length-1].corridors.some(({
				left: bLeft,
				top: bTop,
				right: bRight,
				bottom: bBottom,
			}) => {
				for (let y = bTop; y <= bBottom; ++y) {
					for (let x = bLeft; x <= bRight; ++x) {
						if (
							(Math.abs(aLeft - x) + Math.abs(aTop - y) <= 1)
							||
							(Math.abs(aRight - x) + Math.abs(aBottom - y) <= 1)
						) {
							return true;
						}
					}
				}
				return false;
			}
		));
		if (c !== -1) {
			paths[paths.length-1].corridors.push(corridors.splice(c, 1)[0]);
		} else {
			paths.push({
				corridors: [corridors.pop()],
			});
		}
	}
	return paths;
}
