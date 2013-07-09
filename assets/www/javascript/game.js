var data;
var id = 0;
var questionData;
var points = 0;

// TODO: inform when points have been earned.

document.addEventListener('deviceready', loadGame, false);
window.setInterval(updateClock, 1000);

function loadGame() {
	$.get(KICK_IN_QUEST_HOME + '/json/game.json', startGame);
}

function resetPage() {
	$('.gameBox').css('display', 'none');
}

function startGame(receivedData) {
	data = JSON.parse(receivedData);
	nextQuestion();
}

function nextQuestion() {
	id++;
	
	if (data[id] == undefined) {
		finishGame();
		return;
	}
	
	questionData = data[id];
	
	$('#backgroundImage').css('background-image', 'url(\'' + KICK_IN_QUEST_HOME + '/' + questionData['image'] + '\')');
	loadQuestionPage();
}

function finishGame() {
	loadInfoPage(getTextItem("GAME_OVER") + "<br/><br/>", closeGame, getTextItem('CLICK_TO_CLOSE'));
}

function closeGame() {
    navigator.app.exitApp();
}

function answerQuestion(answer) {
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