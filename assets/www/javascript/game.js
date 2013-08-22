var data;
var questionId = 0;
var questionData;
var points = 0;
var ANSWERS_FILE_NAME = 'answers.txt';
var SCORE_FILE_NAME = '.score';
var DEVICE_ID_FILE_NAME = '.deviceId';
var deviceId = null;

var answersFileWriter = null;
var scoreFileWriter = null;

var knownLatitude = '??.??????';
var knownLongitude = '?.??????';
var knownPassword = '??????';

var lastGpsSignal = new Date().getTime();

$(document).bind('gps:success', gpsSuccess);

window.setInterval(updateClock, 1000);
window.setInterval(uploadGPSFile, 60000);
window.setInterval(uploadAnswersFile, 5 * 60000);

document.addEventListener('deviceready', loadGame, false);

function loadGame() {
	$(document).bind('appDirectory:loaded', loadGameFromJSON);
	$(document).bind('appDirectory:loaded', createGPSFile);
	$(document).bind('appDirectory:loaded', readPoints);
	$(document).bind('appDirectory:loaded', readOrCreateDeviceId);

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
	
	$('#questionTitle').html(getTextItem('QUESTION') + ' ' + questionId);

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
	lastGpsSignal = new Date().getTime();
}

function finishGame() {
	resetPage();
	
	$('.answerCheck').css('display', 'block');

	loadInfoPage(getTextItem("GAME_OVER") + "<br/><br/>", closeGame, getTextItem('CLICK_TO_CLOSE'));
}

function closeGame() {
	uploadAnswersFile(closeApp);
}

function closeApp() {
	navigator.app.exitApp();
}

function answerQuestion(answer) {
	if (typeof lastPosition === 'undefined') {
		alert(getTextItem('GPS_DISABLED'));
		return;
	}
	
	position = lastPosition;
	logAnswer(answer, position);
	
	resetPage();
	$('.answerCheck').css('display', 'block');
	
	isCorrect = checkAnswer(answer);
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
	
	loadInfoPage(message, nextQuestion, getTextItem('NEXT'));
}

function checkAnswer(answer) {
	return (hex_md5(questionId + "*" + answer.toLowerCase()) == questionData['correctAnswer']);
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

function checkLocation(clickEvent) {
	if (typeof lastPosition === 'undefined') {
		alert(getTextItem('GPS_DISABLED'));
		return;
	}
		
	position = lastPosition;
	
	resetPage();
	logAnswer('', position);

	var distance = updateScore(1000, position);
	
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
				  getTextItem('PUSH_BUTTON') + '<br/><br/>';
	
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
	
	scoreFileWriter.seek(0);
	scoreFileWriter.write(points);
	
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
	if (new Date().getTime() > (lastGpsSignal + 60000)) {
		alert(getTextItem('NO_LOCATION_FOR_ONE_MINUTE'));
		return;
	}
	
	uploadFile(applicationDirectory.fullPath + '/' + GPS_FILE_NAME, ANSWER_QUESTIONS_URL, {dataType: 'gps', teamId: teamId, deviceId: deviceId, language: language}, resetGPSFile);
}

function resetGPSFile() {
	gpsFileWriter = null;
	applicationDirectory.getFile(GPS_FILE_NAME, {create: false, exclusive: false}, resetGPSFileEntry, fail);
}

function resetGPSFileEntry(fileEntry) {
	fileEntry.remove(createGPSFile);
}

function uploadAnswersFile(callBackFunction) {
	uploadFile(applicationDirectory.fullPath + '/' + ANSWERS_FILE_NAME, ANSWER_QUESTIONS_URL, {dataType: 'answers', teamId: teamId, deviceId: deviceId, language: language}, callBackFunction, notifyNoInternet);
}

function notifyNoInternet() {
	alert(getTextItem('UNABLE_TO_CLOSE_APP') + ': ' + getTextItem('NO_INTERNET_AVAILABLE'));
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
		answersFileWriter.write("Question,Answer,Latitude,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
	} else {
		answersFileWriter.seek(answersFileWriter.length);
	}
}

function logAnswer(answer, position) {
	if (answersFileWriter != null) {
		message = questionId + "," + answer + "," + position.coords.latitude + "," + position.coords.longitude + "," + position.coords.altitude + "," + position.coords.accuracy
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
					// XXX you can probably reuse the fileEntry here
					readPriorAnswers(createAnswersFile);
				}, 
				function() {
					nextQuestion();
					createAnswersFile();
				});
}

function readPriorAnswers(callBackFunction) {
	openFileSystemRead(ANSWERS_FILE_NAME, function(event) { readPriorAnswersFromFile(event.target.result, callBackFunction); }, true);
}
	
/*
 * Fast forward through the answer checking process
 */
function readPriorAnswersFromFile(answersText, callBackFunction) {
	var previousAnswers = answersText.split('\n');
	
	// Start at 1: pos 0 will contain the headers
	for (var i = 1; i < previousAnswers.length; i++) {
		if (previousAnswers[i] == '') {
			// Empty line, e.g. the end of the file
			continue;
		}
		
		questionId = i;
		questionData = data[questionId];
		
		var answerComponents = previousAnswers[i].split(',');
		var answer = answerComponents[1];

		if (answer == undefined || answer == '') {
			continue;
		} else {
			updateKnownInformation(checkAnswer(answer));
		}
	}
	
	nextQuestion();
	callBackFunction();
}

function readPoints() {
	fileExists(SCORE_FILE_NAME, 
				function() {
					// XXX you can probably reuse the fileEntry here
					readScore(createScoreFile);
				}, 
				function() {
					createScoreFile();
				});
}

function createScoreFile() {
	applicationDirectory.getFile(SCORE_FILE_NAME, {
		create : true,
		exclusive : false
	}, createScoreFileWriter, fail);
}

function createScoreFileWriter(fileEntry) {
	createFileWriter(fileEntry, scoreFileWriterCreated);
}

function scoreFileWriterCreated(writer) {
	scoreFileWriter = writer;
}

function readScore(callBackFunction) {
	openFileSystemRead(SCORE_FILE_NAME, function(event) { readScoreFile(event.target.result, callBackFunction); }, true);
}
	
function readScoreFile(scoreText, callBackFunction) {
	if (scoreText == '') {
		scoreText = 0;
	}
	
	points = parseInt(scoreText);
	updateScoreBoard();
	
	callBackFunction();
}

function readOrCreateDeviceId() {
	fileExists(DEVICE_ID_FILE_NAME, 
				function() {
					// XXX you can probably reuse the fileEntry here
					readDeviceId();
				}, 
				function() {
					createDeviceIdFile();
				});
}

function createDeviceIdFile() {
	applicationDirectory.getFile(DEVICE_ID_FILE_NAME, {
		create : true,
		exclusive : false
	}, createDeviceIdFileWriter, fail);
}

function createDeviceIdFileWriter(fileEntry) {
	createFileWriter(fileEntry, deviceIdFileWriterCreated);
}

function deviceIdFileWriterCreated(writer) {
	deviceIdFileWriter = writer;
	createNewDeviceId();
	writer.write(deviceId);
}

function readDeviceId(callBackFunction) {
	openFileSystemRead(DEVICE_ID_FILE_NAME, function(event) { readDeviceIdFile(event.target.result); }, true);
}

function readDeviceIdFile(deviceIdText) {
	deviceId = deviceIdText;
}

function createNewDeviceId() {
	deviceId = getPlatformName() + '-' + createUUID();
}