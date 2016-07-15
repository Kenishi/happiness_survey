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
	// Delay data load by a second to let WebSocket settle
	setTimeout(function() {
		socket.emit("refresh");
	}, 1000);
};

socket.on("update", function(data) {
	// Extract the data and update the model
	console.log(data);
	for(var key in data) {
		if(model.hasOwnProperty(key)) {
			model[key](data[key]);
		}
	}
});

socket.on("added", function() {
	swal("Success", "Thanks for you submission!", "success");
	$("#dataTab").tab("show");
});

var model = {
	form: {
		gender: ko.observable("m"),
		age: ko.observable(""),
		happy: ko.observable(5),
		submit: function() {
			if(model.form.age().length <= 0) {
				swal("Error", "An age is required", "error");
				return;
			}
			socket.emit("submit", {
				gender: model.form.gender(),
				age: model.form.age(),
				score: model.form.happy()
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
		Format: [ [Unix timestamp when received, happy rating], ...]
	 */
	happyViaTime: ko.observable([]),
	/*
		Format: {
			male: avg happiness,
			female: avg happiness
		}
	 */
	genderHappiness: ko.observable({
		male: 0,
		female: 0
	}),
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
	
	model.ageAndGender.subscribe(function(newVal) {

	});

	model.happyViaTime.subscribe(function(newVal) {
		console.log(newVal);
		var svg = d3.select("#happyViaTime");
		var yscale = d3.scaleLinear()
						.domain([1,10])
						.range([1,10]);
		var yaxis = d3.axisBottom(yscale);
		
		// Determine domain of x
		var xmin = null, xmax = null;
		newVal.forEach((val) => {
			if(!xmin || val < xmin) {
				xmin = val;
			}
			if(!xmax || val > xmax) {
				xmax = val;
			}
		});
		console.log("HappyViaTime Domain: ", xmin, xmax);
		var xscale = d3.scaleLinear()
						.domain([xmin, xmax])
						.range([xmin, xmax]);
		var xaxis = d3.axisLeft(xscale);

		// Need to add updating/painting the data points
	});

	model.genderHappiness.subscribe(function(newVal) {
		console.log("Running gender happy update");
		var canvas = d3.select("#genderHappiness")
			.attr("width", 200)
			.attr("height", 200);
		var arc = d3.arc()
			.innerRadius(0)
			.outerRadius(100)
			.startAngle(function(d,i) {
				// Male goes counterclock so start at 360 deg, Female is clockwise
				return i == 0 ? (2*Math.PI) : 0; // Angles are in radians
			})
			.endAngle(function(d, i) {
				var total = newVal.male+newVal.female;
				var radian = (d/total) * (Math.PI/180);
				return i === 0 ? (2*Math.PI)-radian : radian;
			})
			.attr("stroke-color", function(d, i) {
				return i === 0 ? "blue" : "pink";
			});

		canvas.append("path")
		.attr("d", arc);
	});

	model.ageAndHappiness.subscribe(function(newVal) {

	});
}