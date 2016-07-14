var socket = io("http://localhost:3000");

$(document).ready(function() {
	console.log("Ready");
	$("#surveyTab").click(function(e) {
		e.preventDefault();
		$("#survey").tab("show");
	});
	$("#dataTab").click(function(e) {
		e.preventDefault();
		$(this).tab("show");
	});
});