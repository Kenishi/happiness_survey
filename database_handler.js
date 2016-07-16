var winston = require('winston');
var sqlite3 = require('sqlite3').verbose();


var db;
module.exports = function(path) {
	db = new sqlite3.Database(path);
	db.serialize(() => {
		db.run("CREATE TABLE IF NOT EXISTS data (timestamp INT, gender INT, age INT, score INT)");
	});

	var mod = {};
	mod.db = db;
	mod.add = add;
	mod.getAll = getAll;
	mod.close = function() {
		return new Promise((resolve, reject) => {
			db.close((err) => {
				winston.error("An error occured while closing the DB", err);
				resolve(); // Resolve, can't handle errors if app is closing
			});
		});
	};

	return mod;
};

/**
 * Add a new survey submission to the DB
 * @param {Number} gender 0 if male 1 if female
 * @param {Number} age    the age of the participant
 * @param {Number} score  their hapiness score, 1-10
 * @returns {Promise} returns a promise that resolves if add was successful, rejects with error
 */
function add(gender, age, score, timestamp) {
	var time;
	if(typeof timestamp === "number") {
		time = timestamp;
	}
	else {
		time = (new Date()).getTime();
	}
	
	return new Promise((resolve, reject) => {
		db.run("INSERT INTO data (timestamp, gender, age, score) VALUES (?,?,?,?)", 
			[time, gender, age, score], (err) => {
				if(err) {
					return reject(err);
				}
				resolve();
			}
		);
	});
}

/**
 * Get all the data
 * @return {Promise} returns a promise that resolves with an array of entries, rejects on error
 */
function getAll() {
	return new Promise((resolve, reject) => {
		db.all("SELECT timestamp, gender, age, score FROM data;", [], (err,rows) => {
			if(err) {
				return reject(err);
			}
			resolve(rows);
		});
	});
}