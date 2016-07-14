var socket = io("http://localhost:3000");

document.onready = function() {
	console.log("Ready");
	$("#surveyTab").click(function(e) {
		e.preventDefault();
		$("#survey").tab("show");
	});
	$("#dataTab").click(function(e) {
		e.preventDefault();
		$(this).tab("show");
	});

	ko.applyBindings(model);
	init();
};

socket.on("refresh", function(data) {
	// Extract the data and update the model
	
});

var model = {
	form: {
		gender: ko.observable("m"),
		age: ko.observable(""),
		happy: ko.observable(5),
		submit: function() {
			socket.emit("submit", {
				gender: model.form.gender(),
				age: model.form.age(),
				happy: model.form.happy()
			});
		}
	},
	/*
		Format: {
			age as integer : [male count, female count]
		}
	 */
	ageAndGender: ko.observable({}),
	/*
		Format: [ [Unix timestamp when received, happy rating]]
	 */
	happyViaTime: ko.observable([]),
	/*
		Format: {
			male: avg happiness,
			female: avg happiness
		}
	 */
	genderHappiness: ko.observable({}),
	/*
		Format: {
			age as integer: avg happiness
		}
	 */
	ageAndHappiness: ko.observable({}),
};

function init() {
	// Subscribe to the different models so the appropriate
	// D3 graph is updated
		

}