import tracery from "tracery-grammar";

export default [{
	solid: true,
	symbol: ['T', 'Y', 't', 'P', '⸙'],
	colour: [[0,50,0], [100,250,100]],
	text: {
		main: [
			'The #type# stands #height#.',
			'The #type# smells of #smell#.',
			'The #type# stands #height#.'
		],
		height: ['tall', 'proud', 'high', 'with dignity', 'above you'],
		smell: ['ripe fruit', 'vinegar', 'fresh greenery', 'moisture', 'nothing; it\'s synthetic'],
		type: ['tree', 'old tree', 'young tree', 'sapling', 'planted tree', 'potted tree'],
	},
},{ 
	symbol: ['⁂', 'Ѡ', '%', '⅏', 'Ꞷ', 'Ꝏ'],
	colour: [[50,50,50], [200,100,100]],
	text: {
		main: [
			'The eggs are #contents#.'
		],
		contents: [
			'#warmth# and #dead#',
			'#warmth#, and #alive#',
			'#time# hatched - their contents gone',
		],
		warmth: [
			'cold', 'wet, warm', 'warm', 'frigid', 'steaming',
		],
		alive: [
			'teeming with internal activity',
			'pulsating',
			'ooze spasmodically',
		],
		dead: [
			'lifeless',
			'empty',
			'devoid of life',
			'their contents have been eaten',
		],
		time: ['newly','long since','recently']
	},
}].map(({
	text,
	...c
}) => ({
	text: tracery.createGrammar(text),
	...c,
}));
