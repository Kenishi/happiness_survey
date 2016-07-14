var sqlite3 = require('sqlite3').verbose();

module.exports = function(path) {
	var db = new sqlite3.Database(path);

	var mod = {};
	mod.db = db;
	
	return mod;
}