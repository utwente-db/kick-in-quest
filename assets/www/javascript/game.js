var data;
var questionId = 0;
var questionData;
var points = 0;
var ANSWERS_FILE_NAME = 'answers.txt';
var answersFileWriter = null;

var knownLatitude = '??.??????';
var knownLongitude = '?.??????';
var knownPassword = '???????? ?????';

$(document).bind('gps:success', gpsSuccess);

window.setInterval(updateClock, 1000);
window.setInterval(uploadGPSFile, 60000);
window.setInterval(uploadAnswersFile, 5 * 60000);

document.addEventListener('deviceready', loadGame, false);

function loadGame() {
	alert('lg');
	$(document).bind('appDirectory:loaded', loadGameFromJSON);
	$(document).bind('appDirectory:loaded', createGPSFile);

	initFileSystem();
	startGPSTracking();
}

function loadGameFromJSON() {
	openFileSystemRead('json/game.json', startGame, true);
}

function resetPage() {
	$('.gameBox').css('display', 'none');
}

function startGame(event) {
	data = JSON.parse(event.target.result);
	
	skipToCurrentAnswer();
	startGPSPoints();
}

function nextQuestion() {
	questionId++;

	if (data[questionId] == undefined) {
		finishGame();
		return;
	}
	
	questionData = data[questionId];
	
	applicationDirectory.getFile(questionData['image'], { exclusive : false }, function(fileEntry) {
		fileEntry.file(function(file) {
			 var reader = new FileReader();
			 reader.onload = function(evt) {
				 $('#backgroundImage').css('background-image', 'url(' + evt.target.result + ')');
			 };
			 reader.readAsText(file);	
		}, null);
	}, null);
	
	// $('#backgroundImage').css('background-image', 'url(\'' + applicationDirectory.fullPath + '/' + questionData['image'] + '\')'); // can't get this to work; unable to unzip and store binary objects on the sd-card
	loadQuestionPage();
}

function gpsSuccess() {
	updateScore(1);
}

function finishGame() {
	resetPage();
	
	$('.answerCheck').css('display', 'block');

	loadInfoPage(getTextItem("GAME_OVER") + "<br/><br/>", closeGame, getTextItem('CLICK_TO_CLOSE'));
}

function closeGame() {
	uploadAnswersFile(function() { navigator.app.exitApp(); });
}

function answerQuestion(answer, position, displayAndLogResults) {
	if (position == undefined) {
		if (typeof lastPosition === 'undefined') {
			alert(getTextItem('NO_LOCATION_FOUND'));
			return;
		}
		
		position = lastPosition;
	}
	
	if (displayAndLogResults == undefined) {
		displayAndLogResults = true;
	}
	
	if (displayAndLogResults) {
		logAnswer(answer, position);
		
		resetPage();
		$('.answerCheck').css('display', 'block');
	}
	
	var isCorrect = (hex_md5(questionId + "*" + answer.toLowerCase()) == questionData['correctAnswer']);
	var message = '';
	
	if (isCorrect) {
		message = getTextItem('THE_ANSWER_IS') + ' ' + getTextItem('CORRECT') + '.';
	} else {
		message = asWarning(getTextItem('THE_ANSWER_IS') + ' ' + getTextItem('WRONG') + '.');
	}
	
	message += '<br/>' + questionData['explanation'] + "<br/><br/>";
	
	if (isCorrect) {
		updateScore(1000, position);
		message += getTextItem('NEW_INFORMATION');
	} else {
		message += getTextItem('NO_NEW_INFORMATION');
	}

	message += '<br/><br/>';
	updateKnownInformation(isCorrect);
		
	message += 'N ' + knownLatitude.replace(/%/g, asWarning('X')) + '<br/>';
	message += 'E ' + knownLongitude.replace(/%/g, asWarning('X')) + '<br/><br/>';
	message += knownPassword.replace(/%/g, asWarning('X')) + '<br/><br/>';
	
	if (displayAndLogResults) {
		loadInfoPage(message, nextQuestion, getTextItem('NEXT'));
	}
}

function updateKnownInformation(answerCorrect) {
	var reward = questionData['reward']; 
	
	if (reward['type'] == 'coordinateDigit') {
		var newCharacter = answerCorrect ? reward['digit'] : '%';
		var pos = parseInt(reward['position']);
		
		if (reward['latOrLon'] == 'latitude') {
			knownLatitude = knownLatitude.substring(0, pos) + newCharacter + knownLatitude.substring(pos + 1);
		} else {
			knownLongitude = knownLongitude.substring(0, pos) + newCharacter + knownLongitude.substring(pos + 1);
		}
	} else if (reward['type'] == 'password') {
		var newCharacter = answerCorrect ? reward['letter'] : '%';
		var positions = reward['position'].split(',');
		
		for (var i = 0; i < positions.length; i++) {
			var pos = parseInt(positions[i]);
			
			knownPassword = knownPassword.substring(0, pos) + newCharacter + knownPassword.substring(pos + 1);
		}
	}
}

function checkLocation(clickEvent, position, displayAndLogResults) {
	if (position == undefined) {
		if (typeof lastPosition === 'undefined') {
			alert(getTextItem('NO_LOCATION_FOUND'));
			return;
		}
		
		position = lastPosition;
	}
	
	if (displayAndLogResults == undefined) {
		displayAndLogResults = true;

		resetPage();
	}

	if (displayAndLogResults) {
		logAnswer('', position);
	}

	var distance = updateScore(1000, position);
	
	if (displayAndLogResults) {
		$('.checkLocation').css('display', 'block');
		
		var message = getTextItem('LOCATION_WILL_BE_CHECKED') + ' ' + getTextItem('FOUND_COORDINATES') + ':<br/><br/>N '
					  + position.coords.latitude.toFixed(6) + '<br/>E ' + position.coords.longitude.toFixed(6) + '<br/><br/>';
		
		var distanceText = getTextItem('DISTANCE_TO_EXPECTED POINT') + ':<br/>' + distance.toFixed(2) + 'm';
		
		if (distance > 25) {
			distanceText = asWarning(distanceText);
		}
		
		message += distanceText + '<br/><br/>';

		loadInfoPage(message, nextQuestion, getTextItem('NEXT'));
	}
}

function loadQuestionPage() {
	resetPage();

	var type = questionData['type'];
	$('.' + type).css('display', 'block');
	
	if (type == 'multipleChoice') {
		loadMultipleChoiceQuestion();
	} else if (type == 'enterBuilding') {
		loadEnterBuildingQuestion();
	} else if (type == 'openQuestion') {
		loadOpenQuestion();
	} else {
		alert("Unknown question type: " + type);
		nextQuestion();
	}
}

function loadMultipleChoiceQuestion() {
	$('.smallInfoBox').html(questionData['question']);
	
	$('.answer').each(function(index, element) {
		$(element).html(questionData['answers'][element.id]);
		
		$(element).unbind('click');
		$(element).click(function() { answerQuestion($(this).attr('id')); });
	});
}

function loadOpenQuestion() {
	$('.infoText').html(questionData['question']);
	$('#answer').val('');
	
	loadInfoButton(checkOpenQuestion, getTextItem('TO_ANSWER'));
}

function checkOpenQuestion() {
	var answer = $('#answer').val();
	
	if (answer == '') {
		$('#answer').css('border-color', 'red');
		return false;
	}
	
	$('#answer').css('border-color', 'green');
	answerQuestion(answer);
}

function loadEnterBuildingQuestion() {
	var message = getTextItem('GO_TO_BUILDING') + ' ' + questionData['building'] + '.<br/>' +
				  getTextItem('PUSH_BUTTON') + '<br/><br/>' +
				  asWarning(getTextItem('PUSH_TOO_EARLY')) + '<br/><br/>';
	
	loadInfoPage(message, checkLocation, getTextItem('WE_ARE_INSIDE'));
}

function getTextItem(label) {
	if (typeof data['textItems'][label] == 'undefined') {
		return label;
	}
	
	return data['textItems'][label];
}

function updateClock() {
	// XXX: this should be loaded from game.json instead.
	var endDate = new Date("August 24, 2013 13:00:00");
	var now = new Date();
	
	var hoursToGo = endDate.getHours() - now.getHours();
	var minutesToGo = endDate.getMinutes() - now.getMinutes();
	var secondsToGo = endDate.getSeconds() - now.getSeconds();
	
	if (secondsToGo < 0) {
		secondsToGo += 60;
		minutesToGo--;
	}
	
	if (minutesToGo < 0) {
		minutesToGo += 60;
		hoursToGo--;
	}
	
	if (hoursToGo < 0) {
		hoursToGo += 24;
	}
	
	if (now > endDate) {
		hoursToGo = 0;
		minutesToGo = 0;
		secondsToGo = 0;
	}

	setClock(hoursToGo, minutesToGo, secondsToGo);
}

function setClock(hoursToGo, minutesToGo, secondsToGo) {
	hoursToGo = pad(hoursToGo, 2);
	minutesToGo = pad(minutesToGo, 2);
	secondsToGo = pad(secondsToGo, 2);
	
	setDigit('timeh0', hoursToGo.charAt(0));
	setDigit('timeh1', hoursToGo.charAt(1));
	
	setDigit('timem0', minutesToGo.charAt(0));
	setDigit('timem1', minutesToGo.charAt(1));
	
	setDigit('times0', secondsToGo.charAt(0));
	setDigit('times1', secondsToGo.charAt(1));
}

function setDigit(id, value) {
	$('#' + id).attr('src', 'images/' + value + '.gif');
}

function updateScore(pointNorm, position) {
	var distance = 0;

	if (position == undefined) {
		points += pointNorm;
	} else {
		var lat = parseFloat(position.coords.latitude);
		var lon = parseFloat(position.coords.longitude);
		
		var latExpected = questionData['latitude'];
		var lonExpected = questionData['longitude'];

		distance = getDistance(lat, lon, latExpected, lonExpected);
		
		points += Math.round(pointNorm / distance);
	}
	
	updateScoreBoard();
	
	return distance;
}

function updateScoreBoard() {
	var pointsString = pad(points, 6);
	
	setDigit('score0', pointsString.charAt(0));
	setDigit('score1', pointsString.charAt(1));
	setDigit('score2', pointsString.charAt(2));
	setDigit('score3', pointsString.charAt(3));
	setDigit('score4', pointsString.charAt(4));
	setDigit('score5', pointsString.charAt(5));
}

/*
 * Source: http://www.electrictoolbox.com/pad-number-zeroes-javascript/
 */
function pad(number, length) {
    var str = '' + number;
    
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;
}

function uploadGPSFile() {
	uploadFile(applicationDirectory.fullPath + '/' + GPS_FILE_NAME, ANSWER_QUESTIONS_URL, {dataType: 'gps', teamId: teamId, deviceId: deviceId}, resetGPSFile);
}

function resetGPSFile() {
	alert('Upload completed!!!');
}

function uploadAnswersFile(callBackFunction) {
	uploadFile(applicationDirectory.fullPath + '/' + ANSWERS_FILE_NAME, ANSWER_QUESTIONS_URL, {dataType: 'gps', teamId: teamId, deviceId: deviceId}, callBackFunction);
}

function createAnswersFile() {
	applicationDirectory.getFile(ANSWERS_FILE_NAME, {
		create : true,
		exclusive : false
	}, createAnswersFileWriter, fail);
}

function createAnswersFileWriter(fileEntry) {
	createFileWriter(fileEntry, answersFileWriterCreated);
}

function answersFileWriterCreated(writer) {
	answersFileWriter = writer;
	
	if (answersFileWriter.length == 0) {
		answersFileWriter.write("Team ID,Question,Answer,Latitude,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
	} else {
		answersFileWriter.seek(answersFileWriter.length);
	}
}

function logAnswer(answer, position) {
	if (answersFileWriter != null) {
		message = teamId + "," + questionId + "," + answer + "," + position.coords.latitude + "," + position.coords.longitude + "," + position.coords.altitude + "," + position.coords.accuracy
				  + "," + position.coords.altitudeAccuracy + "," + position.coords.heading + "," + position.coords.speed + "," + position.timestamp + "\n";          		

		answersFileWriter.write(message);
	} else {
		alert("Readonly SD-card or file.js not loaded;\nPosition at " + position.timestamp + ":\n" + position.coords.latitude + ", " + position.coords.longitude);
	}
	
	return true;
}

function skipToCurrentAnswer() {
	fileExists(ANSWERS_FILE_NAME, 
				function() {
					readPriorAnswers(createAnswersFile); 
				}, 
				function() {
					nextQuestion();
					createAnswersFile();
				});
}

function readPriorAnswers(callBackFunction) {
	openFileSystemRead('answers.txt', function(event) { readPriorAnswersFromFile(event.target.result, callBackFunction); }, true);
}
	
/*
 * Fast forward through the answer checking process
 */
function readPriorAnswersFromFile(answersText, callBackFunction) {
	var answers = answersText.split('\n');
	
	// Start at 1: pos 0 will contain the headers
	for (var i = 1; i < answers.length; i++) {
		if (answers[i] == '') {
			// Empty line, e.g. the end of the file
			continue;
		}
		
		questionId = i;
		questionData = data[questionId];
		
		var answerComponents = answers[i].split(',');

		var position = new Object();
		position.coords = new Object();

		position.coords.latitude = answerComponents[3];
		position.coords.longitude = answerComponents[4];

		var answer = answerComponents[2];

		if (answer == undefined || answer == '') {
			checkLocation(null, position, false);
		} else {
			answerQuestion(answer, position, false);
		}
	}
	
	nextQuestion();
	callBackFunction();
}

function startGPSPoints() {
	fileExists(GPS_FILE_NAME, 
			function() {
				readPriorGPSPoints(createGPSFile); 
			}, 
			function() {
				createGPSFile();
			});
}

function readPriorGPSPoints(callBackFunction) {
	openFileSystemRead('gpsdata.txt', 
					   function(event) { 
						   readPriorGPSPointsFromFile(event.target.result, callBackFunction); 
					   }, 
					   true);
}
	
/*
 * Fast forward through the answer checking process
 */
function readPriorGPSPointsFromFile(gpsdata, callBackFunction) {
	var items = gpsdata.split('\n');
	var numberOfPoints = items.length - 1;

	if (items[items.length - 1] == '') {
		numberOfPoints--;
	}

	updateScore(numberOfPoints, null);
}