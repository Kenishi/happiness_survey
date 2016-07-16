/*
	socket_handler.js handles all of the Socket.io events that
	occur on the app.
 */

var winston = require('winston');
var seeder = require('./seeder');

winston.cli();
winston.level = "info";

var lodash = require('lodash');

module.exports = function(io, db) {
	if(typeof io !== "object") {
		throw new Error("Socket handler requires a Socket.io server instance");
	}

	if(typeof db !== "object") {
		throw new Error("Database handler requires a database handler");
	}

	this.handler = new SocketHandler(io, db);

	return this;
};

function SocketHandler(io, db) {
	this.io = io;
	this.db = db;

	this.init();

	if(process.env.TEST) {
		// Expose the processing functions for unit testing
		winston.debug("Exposing methods for testing");
		this.processGenderHappiness = processGenderHappiness;
		this.processAgeAndGender = processAgeAndGender;
		this.processHappyViaTime = processHappyViaTime;
		this.processAgeAndHappiness = processAgeAndHappiness;
	}
}

SocketHandler.prototype.init = function() {
	this.io.on("connection", (socket) => {
		socket.on("submit", this.submit.bind(this, socket));
		socket.on("refresh", this.refresh.bind(this, socket));
		socket.on("seed", this.seed.bind(this));
		socket.on("feedback", this.feedback.bind(this));
		socket.on("clearData", this.clearData.bind(this));
	});
};

/**
 * Handle the reception of new data
 * @param  {Object} data the data from the client
 */
SocketHandler.prototype.submit = function(socket, data) {
	winston.info("Received data", data);
	// Store the data as an entry in the database
	var gender = data.gender == "m" ? 0 : 1;
	this.db.add(gender, data.age, data.score)
	.then(() => {
		socket.emit("added");
		return this.db.getAll();
	})
	.then((allData) => {
		var payload = this.processData(allData);
		// Inform clients about new data
		this.io.emit("update", payload);
	})
	.catch((err) => {
		this.io.emit("serverError", { 
			message: "An error occured during submission",
		});
		winston.error("An error occured during submission:", err);
	});
};

/**
 * Client has requested a snapshot of the stored data.
 * @param {Socket} socket the client to refresh data on
 */
SocketHandler.prototype.refresh = function(socket) {
	console.log("Refreshing socket's data");
	// Fetch data from the database
	this.db.getAll()
	.then((allData) => {
		// Process and send the data to the user
		var payload = this.processData(allData);
		socket.emit("update", payload);
	})
	.catch((err => {
		socket.emit("serverError", {
			message: "An error occured during refresh"
		});
		winston.error("An error occured during a client refresh:", err);
	}));
};

/*
	This is the handler for the random seeding event received on socket.io
 */
SocketHandler.prototype.seed = function(data) {
	var items = seeder.count(data.count);
	console.log(items);
	var promises = items.map((i) => {
		return this.db.add(i.gender, i.age, i.score, i.timestamp);
	});

	Promise.all(promises)
	.then(() => {
		return this.db.getAll();
	})
	.then((allData) => {
		var payload = this.processData(allData);
		this.io.emit("update", payload);
	})
	.catch((err) => {
		this.io.emit("serverError", { 
			message: "An error occured during submission",
		});
		winston.error("An error occured during submission:", err);
	});
};

/*
	Handler for the feedback socket.io event
 */
SocketHandler.prototype.feedback = function(data) {
	winston.info("Received feedback! This doesn't do anything more");
	winston.info(data);
};

/*
	Handler for clearData event from socket.io
 */
SocketHandler.prototype.clearData = function() {
	this.db.clearData()
	.then(() => {
		var payload = this.processData([]);
		this.io.emit("update", payload);
	})
	.catch((err) => {
		winston.error(err);
	});
};

/**
 * This processes a chunk of data stored in the database
 * and converts it into a payload that can be sent to clients
 * and put on graphs.
 * 	
 * @param  {Object[]} data an array of objects with each object being a submission
 * @return {Object}      an object payload that can be sent out
 */
SocketHandler.prototype.processData = function(data) {
	// Age and Gender Counts
	var ageAndGender = processAgeAndGender(data);
	// Happy across Time
	var happyViaTime = processHappyViaTime(data);
	// Avg Happiness by gender
	var genderHappiness = processGenderHappiness(data);
	// Avg Happiness by Age
	var ageAndHappiness = processAgeAndHappiness(data);

	return {
		ageAndGender: ageAndGender,
		happyViaTime: happyViaTime,
		genderHappiness: genderHappiness,
		ageAndHappiness: ageAndHappiness
	};
};

function processAgeAndGender(data) {
	var bins = {
		"0-13": [],
		"14-18": [],
		"19-29": [],
		"30-49": [],
		"50-60": [],
		"61-70": [],
		"71+": []
	};
	return lodash.chain(data)
					.reduce((cur, entry) => {
						var age = entry.age;
						if(age <= 13) cur["0-13"].push(entry);
						else if(age > 13 && age <= 18) cur["14-18"].push(entry);
						else if(age > 18 && age <= 29) cur["19-29"].push(entry);
						else if(age > 29 && age <= 49) cur["30-49"].push(entry);
						else if(age > 49 && age <= 60) cur["50-60"].push(entry);
						else if(age > 60 && age <= 70) cur["61-70"].push(entry);
						else cur["71+"].push(entry);
						return cur;
					}, bins)
					.reduce((cur, entries, key) => {
						// Age is an array of all participants of the same age
						var count = lodash.chain(entries)
									.reduce((cur, entry) => {
										if(entry.gender == 0) {
											cur[0]++;
										}
										else {
											cur[1]++;
										}
										return cur;
									}, [0,0]).value();
						cur[key] = count;
						return cur;
					}, {}).value();
}

function processHappyViaTime(data) {
	return lodash.chain(data)
					.map((entry) => {
						return [entry.timestamp, entry.score];
					})
					.sortBy((entry) => {
						return entry[0]; // Sorty by the timestamp
					})
					.value();
}

function processGenderHappiness(data) {
	return lodash.chain(data)
					.reduce((cur, entry) => {
						// Seperate out male and female entries
						if(entry.gender === 0) {
							cur.male.push(entry.score);
						}
						else {
							cur.female.push(entry.score);
						}
						return cur;
					}, {male: [], female: []})
					.thru((scores) => {
						// Total the scores and return average
						var male_sum = lodash.chain(scores.male).reduce((cur, score) => {
							return cur += score;
						}, 0).value();
						var female_sum = lodash.chain(scores.female).reduce((cur, score) => {
							return cur += score;
						}, 0).value();

						return {
							male: male_sum/scores.male.length,
							female: female_sum/scores.female.length
						};
					}).value();
}

function processAgeAndHappiness(data) {
	var bins = {
		"0-13": [],
		"14-18": [],
		"19-29": [],
		"30-49": [],
		"50-60": [],
		"61-70": [],
		"71+": []
	};

	return lodash.chain(data)
					.reduce((cur, entry) => {
						// Reduce data to age w/ scores
						var age = entry.age;
						if(age <= 13) cur["0-13"].push(entry.score);
						else if(age > 13 && age <= 18) cur["14-18"].push(entry.score);
						else if(age > 18 && age <= 29) cur["19-29"].push(entry.score);
						else if(age > 29 && age <= 49) cur["30-49"].push(entry.score);
						else if(age > 49 && age <= 60) cur["50-60"].push(entry.score);
						else if(age > 60 && age <= 70) cur["61-70"].push(entry.score);
						else cur["71+"].push(entry.score);
						return cur;
					}, bins)
					.reduce((cur, ages, key) => {
						// Tally and Average
						var score_sum = lodash.chain(ages).reduce((cur, score) => {
							return cur += score;
						}, 0).value();
						cur[key] = ages.length > 0 ? score_sum/ages.length : 0;
						return cur;
					}, {}).value();
}