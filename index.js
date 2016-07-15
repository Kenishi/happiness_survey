var express = require('express'),
	bodyParser = require('body-parser'),
	winston = require('winston'),
	http = require('http');

winston.cli();
winston.level = "info";

// This is the HTTP port for the server
var PORT = 3000;

// Setup the Web Server
var app = express();
app.use(express.static(__dirname + "/public"));
app.locals.pretty = false;
app.set('views', __dirname + "/views");
app.set('view engine', 'jade');

// Set index page route
app.get('/', (req,res) => {
	res.render("index");
});

// Start listening
var server = http.createServer(app).listen(PORT, () => {
	winston.info("Listening on port: " + PORT);
});

// Initialize the WebSocket server
var io = require('socket.io').listen(server);
var db = require('./database_handler')("./database.sqlite");
var socket_handler = require('./socket_handler')(io, db);

process.once("SIGINT", () => {
	process.removeAllListeners();
	winston.info("SIGINT received. Shutting down..");
	socket_handler.handler.io.close();
	db.close();
});

process.once("exit", () => {
	process.removeAllListeners();
	winston.info("Exiting");
	socket_handler.handler.io.close();
	db.close();
});