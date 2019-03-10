import tracery from "tracery-grammar";
import { getRandomItem } from "./utils";

export default [{
	freq: 3,
	solid: true,
	symbol: ['T', 'Y', 't', 'P', '⸙'],
	colour: [
		[0, 50, 0],
		[100, 250, 100]
	],
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
}, {
	freq: 2,
	symbol: ['⁂', 'Ѡ', '%', '⅏', 'ꞷ', 'ꝏ'],
	colour: [
		[50, 50, 50],
		[200, 100, 100]
	],
	text: {
		main: [
			'The eggs are #contents#.',
			'You step over the eggs.',
			'You step around the eggs.',
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
		time: ['newly', 'long since', 'recently']
	},
}, {
	freq: 1,
	pickup: true,
	symbol: ['†', '˨', '˦', 'ϯ', 'ḽ'],
	colour: [
		[50, 50, 50],
		[255, 255, 255]
	],
	text: {
		main: [
			'[w:#weapon#]Picked up #power# #w# of #attribute#.'
		],
		power: [
			'+1',
			'+1',
			'+2',
			'+2',
			'+3',
			'+4',
			'+5',
			'cursed',
		],
		weapon: [
			'sword', 'dagger', 'rapier', 'broadsword', 'longsword', 'shortsword', 'knife',
		],
		attribute: [
			'might', 'prowess', 'harm', 'negotiation', '#w#', '#w#ing',
		],
	},
}, {
	freq: 10,
	solid: true,
	symbol: [{
		toString: () => getRandomItem(['⅌', '℘', '₻', 'Ձ', '§', 'ƕ'])
	}],
	colour: [
		[50, 0, 20],
		[100, 20, 150]
	],
	text: {
		main: [
			'The #worms# #action#.',
		],
		worms: [
			'#adjective##noun#',
		],
		adjective: [
			'', 'slithering ', 'undulating ', 'wriggling ', 'wet ', 'slimy ',
		],
		noun: [
			'worms', 'worms', 'worms', 'creatures', 'tubes', 'beasts', 'slithers',
		],
		action: [
			'ignore you',
			'don\'t acknowledge your existence',
			'continue their #wriggling##wriggles#',
			'block your path',
			'prevent you from passing',
		],
		wriggling: ['', 'wriggling ', 'joyous ', 'insatiate ', 'blissful ', 'frenzied '],
		wriggles: ['wriggles', 'undulations', 'dance', 'entanglement']
	},
}, {
	freq: 5,
	symbol: ['⁘','⁙','⁛'],
	colour: [
		[167,135,0],
		[207,175,20]
	],
	text: {
		main: [
			'',
		],
	},
}, {
	freq: 1,
	solid: true,
	symbol: ['₪','◘','◙'],
	colour: [
		[100,150,0],
		[150,200,0],
	],
	text: {
		main: [
			'You need a #key# to open this #chest#.',
		],
		key: [
			'key','code','password','token',
		],
		chest: [
			'chest','box','safe','case','cache','store',
		],
	},
}].map(({
	text,
	...c
}) => ({
	text: tracery.createGrammar(text),
	...c,
})).reduce((result, item) => {
	while(item.freq--) {
		result.push(item);
	}
	return result;
},[]);
