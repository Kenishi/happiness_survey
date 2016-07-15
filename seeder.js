module.exports = {
	// Get one random entry
	one: function() {
		return {
			timestamp: getRandomInt(0, (new Date()).getTime()),
			gender: getRandomInt(0,1),
			age: getRandomInt(13,75),
			score: getRandomInt(1,10)
		};
	},
	count: function(c) {
		var entries = [];
		var count = c;
		while(count > 0) {
			entries.push(module.exports.one());
			count--;
		}
		return entries;
	}
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}