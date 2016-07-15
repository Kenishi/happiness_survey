var should = require('should');
if(!process.env.TEST) {
	process.env.TEST = true;
}

var io = {
	on : function(event, callback) {

	}
};

var socket_handler = require('../socket_handler')(io,{});

var data = [
	{timestamp: 12345, gender: 0, age: 13, score: 4 },
	{timestamp: 123, gender: 1, age: 21, score: 6 },
	{timestamp: 77777, gender: 1, age: 19, score: 5 },
	{timestamp: 3456, gender: 0, age: 31, score: 7 },
	{timestamp: 235456, gender: 1, age: 19, score: 7 },
	{timestamp: 544321, gender: 0, age: 19, score: 2 },
	{timestamp: 765431, gender: 0, age: 55, score: 10 },
];

describe("Process Data Unit Test", function() {
	this.timeout(200);

	it.only("should return ageAndGender", () => {
		var result = socket_handler.handler.processAgeAndGender(data);
		console.log(result);
		var expect = {
			"0-13": [1,0],
			"14-18": [0,0],
			"19-29": [1,3],
			"30-49": [1,0],
			"50-60": [1,0],
			"61-70": [0,0],
			"71+": [0,0]
		};
		result.should.be.deepEqual(expect);
	});

	it("should return happyViaTime", () => {
		var result = socket_handler.handler.processHappyViaTime(data);
		var expect = [
			[123,6], [3456, 7], [12345,4],[77777,5],[235456,7],[544321,2],[765431,10]
		];
		result.should.be.deepEqual(expect);
	});

	it("should return gender happiness", () => {
		var result = socket_handler.handler.processGenderHappiness(data);
		var expect = {
			male: 5.75,
			female: 6
		};
		result.should.be.deepEqual(expect);
	});

	it("should return age and happiness", () => {
		var result = socket_handler.handler.processAgeAndHappiness(data);
		var expect = {
			13 : 4,
			19 : 4.67,
			21 : 6,
			31 : 7,
			55 : 10
		};

		// Round 19's to 2 places other wise it will be long
		result["19"] = Number(result["19"].toFixed(2));

		result.should.be.deepEqual(expect);
	});
});