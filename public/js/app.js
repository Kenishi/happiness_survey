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

		// Call render on the charts again
		// to get them to resize properly now
		// that the tab is visible
		AgeAndGenderChart.render();
		GenderHappinessChart.render();
		HappyViaTimeChart.render();
		TimeOfDayChart.render();
		WeekendAndDayChart.render();
		AgeAndHappinessChart.render();
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
			"0-13" : [male count, female count],
			"14-18": ...
			"19-29": ...
			"30-49": ...
			"50-60": ...
			"61-70": ...
			"71+": ...
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
	// graph is updated
	model.ageAndGender.subscribe(function(newVal) {
		doAgeAndGender(newVal);
	});

	model.happyViaTime.subscribe(function(newVal) {
		doHappyViaTime(newVal);
		doWeekEndAndDay(newVal);
		doTimeOfDay(newVal);
	});

	model.genderHappiness.subscribe(function(newVal) {
		doGenderHappiness(newVal);
	});

	model.ageAndHappiness.subscribe(function(newVal) {
		doAgeAndHappiness(newVal);
	});

	renderCharts();
}

var AgeAndGenderChart, 
	GenderHappinessChart, 
	HappyViaTimeChart, 
	WeekendAndDayChart,
	TimeOfDayChart,
	AgeAndHappinessChart;

function doAgeAndGender(data) {
	var malePoints = [];
	var femalePoints = [];
	for(var key in data) {
		var d = data[key];
		malePoints.push({
			label: key,
			y: d[0]
		});
		femalePoints.push({
			label: key,
			y: d[1]
		});
	}

	// Sort so they appear in the right order on the graph
	malePoints.sort((a,b) => {
		return a.label > b.label ? 1 :
			a.label < b.label ? -1 : 0;
	});
	femalePoints.sort((a,b) => {
		return a.label > b.label ? 1 :
			a.label < b.label ? -1 : 0;
	});
	
	AgeAndGenderChart.options.data[0].dataPoints = malePoints;
	AgeAndGenderChart.options.data[1].dataPoints = femalePoints;
	AgeAndGenderChart.render();
}

function doHappyViaTime(data) {
	var dataPoints = [];
	data.forEach((entry) => {
		dataPoints.push({
			x: new Date(entry[0]),
			y: entry[1]
		});
	});

	HappyViaTimeChart.options.data[0].dataPoints = dataPoints;
	HappyViaTimeChart.render();
}

function doWeekEndAndDay(data) {
	var result = data.reduce((prev, entry) => {
		var date = new Date(entry[0]);
		if(date.getDay() == 6 || date.getDay() == 0) {
			prev.end += entry[1];
			prev.end_count++;
		}
		else {
			prev.day += entry[1];
			prev.day_count++;
		}
		return prev;
	}, {
		end: 0,
		end_count: 0,
		day: 0,
		day_count: 0
	});

	console.log(result);
	var dataPoints = [
		{ y: result.end_count > 0 ? result.end/result.end_count : 0, label: "Weekends", legendText: "Weekends" },
		{ y: result.day_count > 0 ? result.day/result.day_count : 0, label: "Weekdays", legendText: "Weekdays" }
	];

	console.log(dataPoints);
	WeekendAndDayChart.options.data[0].dataPoints = dataPoints;
	WeekendAndDayChart.render();
}

function doTimeOfDay(data) {
	var init = {
		"0-6": [],
		"7-12": [],
		"13-17": [],
		"18-21": [],
		"22-23": []
	};

	// Reduce entries into appropriate bins
	var data = data.reduce(function(prev, entry) {
		var time = new Date(entry[0]);
		var hour = time.getHours();
		if(hour >= 0 && hour <= 6) prev["0-6"].push(entry);
		else if(hour >= 7 && hour <= 12) prev["7-12"].push(entry);
		else if(hour >= 13 && hour <= 17) prev["13-17"].push(entry);
		else if(hour >= 18 && hour <= 21) prev["18-21"].push(entry);
		else if(hour >= 22 && hour <= 23) prev["22-23"].push(entry);
		else console.error(new Error("Unclassified hour: " + hour));

		return prev;
	}, init);

	// Tally
	var dataPoints = [];
	for(var hour in data) {
		var bin = data[hour];
		var sum = bin.reduce(function(prev, entry) {
			return prev += entry[1];
		}, 0);
		dataPoints.push({
			label: hour,
			y: bin.length > 0 ? sum/bin.length: 0
		});
	}

	TimeOfDayChart.options.data[0].dataPoints = dataPoints;
	TimeOfDayChart.render();
}

function doGenderHappiness(data) {
	var dataPoints = [
		{ y: data.female, gender: "Females", legendText: "Females" },
		{ y: data.male, gender: "Males", legendText: "Males" }
	];

	GenderHappinessChart.options.data[0].dataPoints = dataPoints;
	GenderHappinessChart.render();
}

function doAgeAndHappiness(data) {
	console.log(data);
	var dataPoints = [];

	for(var key in data) {
		var bin = data[key];
		dataPoints.push({
			label: key,
			y: bin
		});
	}
	dataPoints.sort((a,b) => {
		return a.label > b.label ? 1 :
			a.label < b.label ? -1 : 0;
	});

	AgeAndHappinessChart.options.data[0].dataPoints = dataPoints;
	AgeAndHappinessChart.render();
}

function renderCharts() {
	AgeAndGenderChart = new CanvasJS.Chart("ageAndGender",
		{
			theme: "theme3",
            animationEnabled: true,
			title:{
				text: "Age and Gender",
				fontSize: 30
			},
			// height: 300,
			toolTip: {
				shared: true
			},			
			axisY: {
				title: "number of people"
			},
			data: [ 
			{
				type: "column",	
				name: "Male",
				legendText: "Male",
				showInLegend: true, 
				dataPoints:[
					{label: "0-13", y: 0},
					{label: "14-18", y: 0},
					{label: "19-29", y: 0},
					{label: "30-49", y: 0},
					{label: "50-60", y: 0},
					{label: "61-70", y: 0},
					{label: "71+", y: 0},
				]
			},
			{
				type: "column",	
				name: "Female",
				legendText: "Female",
				showInLegend: true, 
				dataPoints:[
					{label: "0-13", y: 0},
					{label: "14-18", y: 0},
					{label: "19-29", y: 0},
					{label: "30-49", y: 0},
					{label: "50-60", y: 0},
					{label: "61-70", y: 0},
					{label: "71+", y: 0},
				]
			}
			
			],
          legend:{
            cursor:"pointer",
            itemclick: function(e){
              if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
              	e.dataSeries.visible = false;
              }
              else {
                e.dataSeries.visible = true;
              }
            	AgeAndGenderChart.render();
            }
          },
        });

	GenderHappinessChart = new CanvasJS.Chart("genderHappiness", {
		title: {
			text: "Who's more happy on average?"
		},
		// height: 300,
		legend: {
			verticalAlign: "bottom",
			horizontalAligh: "center"
		},
		theme: "theme1",
		data : [
			{
				type: "pie",
				startAngle: 0,
				toolTipContent: "{gender}: {y} average",
				showInLegend: true,
				indexLabel: "#percent%",
				dataPoints: [
					{ y: 6.7, gender: "Females", name: "Females"},
					{ y: 9.3, gender: "Males", name: "Males" }
				]
			}
		],
	});

	HappyViaTimeChart = new CanvasJS.Chart("happyViaTime",
    {

      title:{
      text: "Happiness Over Time"
      },
      // height: 300,
       data: [
	      {
	        type: "line",
	        dataPoints: []
	      }
      ]
    });

    TimeOfDayChart = new CanvasJS.Chart("timeOfDay", {
    	title: {
    		text: "Time of Day"
    	},
    	axisX: {
    		title: "hour of day"
    	},
    	axisY: {
    		title: "average happines score"
    	},
    	data: [
    		{
    			type: "column",
    			dataPoints: []
    		}
    	]
    });

    WeekendAndDayChart = new CanvasJS.Chart("weekendAndDay", {
		title: {
			text: "Who's happier during the week?"
		},
		// height: 300,
		legend: {
			verticalAlign: "bottom",
			horizontalAligh: "center"
		},
		theme: "theme1",
		data : [
			{
				type: "pie",
				startAngle: 0,
				toolTipContent: "{label}: {y} average",
				showInLegend: true,
				indexLabel: "#percent%",
				dataPoints: [
					{ y: 1, label: "Weekends", legendText: "Weekends" },
					{ y: 9.3, label: "Weekdays", legendText: "Weekdays" }
				]
			}
		],
	});

	AgeAndHappinessChart = new CanvasJS.Chart("ageAndHappiness",
		{
			theme: "theme3",
            animationEnabled: true,
			title:{
				text: "Age and Happiness",
				fontSize: 30
			},
			// height: 300,
			toolTip: {
				shared: true
			},			
			axisY: {
				title: "avg happiness"
			},
			data: [ 
				{
					type: "column",	
					name: "Avg Score",
					legendText: "Avg Score",
					showInLegend: true, 
					dataPoints:[
						{label: "0-13", y: 0},
						{label: "14-18", y: 0},
						{label: "19-29", y: 0},
						{label: "30-49", y: 0},
						{label: "50-60", y: 0},
						{label: "61-70", y: 0},
						{label: "71+", y: 0},
					]
				},
			],
          legend:{
            cursor:"pointer",
            itemclick: function(e){
              if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
              	e.dataSeries.visible = false;
              }
              else {
                e.dataSeries.visible = true;
              }
            	AgeAndHappinessChart.render();
            }
          },
        });
}