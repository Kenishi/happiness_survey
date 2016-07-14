/*
	socket_handler.js handles all of the Socket.io events that
	occur on the app.
 */

var winston = require('winston');

module.exports = function(io, db) {
	if(typeof io !== "object") {
		throw new Error("Socket handler requires a Socket.io server instance");
	}

	if(typeof db !== "object") {
		throw new Error("Database handler requires a database handler");
	}

	this.handler = new SocketHandler(io);

	return this;
};

function SocketHandler(io) {
	this.io = io;

	this.init();
}

SocketHandler.prototype.init = function() {
	this.io.on("connection", (socket) => {
		winston.info("Connection");

		socket.on("submit", this.submit.bind(this));
	});
};

/**
 * Handle the reception of new data
 * @param  {Object} data the data from the client
 */
SocketHandler.prototype.submit = (data) => {
	winston.info("Received data", data);
	// Store the data as an entry in the database
	// inform other clients that new data has been received
};

/**
 * Client has requested a snapshot of the stored data.
 */
SocketHandler.prototype.refresh = () => {
	// Fetch data from the database
	// Return the data to the user
}