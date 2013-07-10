var data;
var questionId = 0;
var questionData;
var points = 0;
var ANSWERS_FILE_NAME = 'answers.txt';
var answersFileWriter = null;

// TODO: inform when points have been earned.

document.addEventListener('deviceready', loadGame, false);
$(document).bind('gps:success', gpsSuccess);

window.setInterval(updateClock, 1000);
window.setInterval(uploadGPSFile, 60000);
window.setInterval(uploadAnswersFile, 5 * 60000);

function loadGame() {
	$.get(KICK_IN_QUEST_HOME + '/json/game.json', startGame);
}

function resetPage() {
	$('.gameBox').css('display', 'none');
}

function startGame(receivedData) {
	data = JSON.parse(receivedData);
	nextQuestion();
	
	initFileSystem(createAnswersFile);
}

function nextQuestion() {
	questionId++;
	
	if (data[questionId] == undefined) {
		finishGame();
		return;
	}
	
	questionData = data[questionId];
	
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
		fileSystem.root.getFile(FILE_SYSTEM_HOME + '/' + questionData['image'], { exclusive : false }, function(fileEntry) {
			fileEntry.file(function(file) {
				 var reader = new FileReader();
				 reader.onload = function(evt) {
					 $('#backgroundImage').css('background-image', 'url(' + evt.target.result + ')');
				 };
				 reader.readAsText(file);	
			}, null);
		}, null);
	}, null);	
	
	// $('#backgroundImage').css('background-image', 'url(\'' + KICK_IN_QUEST_HOME + '/' + questionData['image'] + '\')'); // can't get this to work; unable to unzip and store binary objects on the sd-card
	loadQuestionPage();
}

function gpsSuccess() {
	updateScore(1);
}

function finishGame() {
	loadInfoPage(getTextItem("GAME_OVER") + "<br/><br/>", closeGame, getTextItem('CLICK_TO_CLOSE'));
}

function closeGame() {
    navigator.app.exitApp();
}

function answerQuestion(answer) {
	if (!logAnswer(answer)) {
		return;
	}
	
	resetPage();

	var isCorrect = (levenshteinDistance(answer, questionData['correctAnswer']) / answer.length) <= 0.25;
	
	$('.answerCheck').css('display', 'block');
	
	var message = '';
	
	if (isCorrect) {
		message = getTextItem('THE_ANSWER_IS') + ' ' + getTextItem('CORRECT') + '.';
	} else {
		message = asWarning(getTextItem('THE_ANSWER_IS') + ' ' + getTextItem('WRONG') + '.');
	}
	
	message += '<br/>' + questionData['explanation'] + "<br/><br/>";
	
	if (isCorrect) {
		updateScore(1000);
		
		// TODO: bijhouden welke informatie bekend is
		message += getTextItem('NEW_INFORMATION') + '<br/><br/>';

		// TODO toevoegen aan message: informatie over het eindpunt, zoals in game.json
		message += 'N 52.236667<br/>E 6.8375';
		message += '<br/><br/>';
	}
	
	loadInfoPage(message, nextQuestion, getTextItem('NEXT'));
}

function checkLocation() {
	resetPage();
	
	$('.checkLocation').css('display', 'block');
	var message = '';
	
	if (typeof lastPosition === 'undefined') {
		message = asWarning(getTextItem('NO_LOCATION_FOUND')) + '<br/><br/>';
	} else {
		var lat = parseFloat(lastPosition.coords.latitude);
		var lon = parseFloat(lastPosition.coords.longitude);
		
		var latExpected = questionData['latitude'];
		var lonExpected = questionData['longitude'];
		
		var distance = getDistance(lat, lon, latExpected, lonExpected);
		
		message = getTextItem('LOCATION_WILL_BE_CHECKED') + ' ' + getTextItem('FOUND_COORDINATES') + ':<br/><br/>N '
		  		  + lastPosition.coords.latitude.toFixed(6) + '<br/>E ' + lastPosition.coords.longitude.toFixed(6) + '<br/><br/>';
		
		var distanceText = getTextItem('DISTANCE_TO_EXPECTED POINT') + ':<br/>' + distance.toFixed(2) + 'm';
		
		if (distance > 25) {
			distanceText = asWarning(distanceText);
		}
		
		updateScore(Math.round(1000 / distance));
		message += distanceText + '<br/><br/>';
	}
	
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

function updateScore(pointsToBeAdded) {
	points += pointsToBeAdded;
	
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
	uploadFile(KICK_IN_QUEST_HOME + '/' + GPS_FILE_NAME, ANSWER_QUESTIONS_URL, {dataType: 'gps', teamId: teamId, deviceId: deviceId}, resetGPSFile);
}

function resetGPSFile() {
	alert('Upload completed!!!');
}

function uploadAnswersFile() {
	uploadFile(KICK_IN_QUEST_HOME + '/' + ANSWERS_FILE_NAME, ANSWER_QUESTIONS_URL, {dataType: 'gps', teamId: teamId, deviceId: deviceId}, resetAnswersFile);
}

function resetAnswersFile() {
	// TODO: remove old items
}

function createAnswersFile(directory) {
	directory.getFile(ANSWERS_FILE_NAME, {
		create : true,
		exclusive : false
	}, createAnswersFileWriter, failFE);
}

function createAnswersFileWriter(fileEntry) {
	createFile(fileEntry, answersFileWriterCreated);
}

function answersFileWriterCreated(writer) {
	answersFileWriter = writer;
	
	if (answersFileWriter.length == 0) {
		answersFileWriter.write("Team ID,Question,Answer,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
	} else {
		answersFileWriter.seek(answersFileWriter.length);
	}
}

function logAnswer(answer) {
	if (lastPosition == undefined) {
		alert(getTextItem('GPS_DISABLED'));
		return false;
	}
	
	var position = lastPosition;
	
	if (answersFileWriter != null) {
		message = teamId + "," + questionId + "," + answer + "," + position.coords.latitude + "," + position.coords.longitude + "," + position.coords.altitude + "," + position.coords.accuracy
		+ "," + position.coords.altitudeAccuracy + "," + position.coords.heading + "," + position.coords.speed + "," + position.timestamp + "\n";          		
		answersFileWriter.write(message);
	} else {
		alert("Readonly SD-card or file.js not loaded;\nPosition at " + position.timestamp + ":\n" + position.coords.latitude + ", " + position.coords.longitude);
	}
	
	return true;
}