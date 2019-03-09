export function lerp(from, to, by) {
	return from + (to - from) * by;
}

export function strToPos(str) {
	return str.split(',').map(str => parseInt(str, 10));
}

export function posToStr([x,y]) {
	return `${x},${y}`;
}
