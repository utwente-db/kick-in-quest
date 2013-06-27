var data;
var id = 0;
var questionData;

document.addEventListener('deviceready', loadGame, false);

function loadGame() {
	// TODO get this from the SD card instead
	$.getJSON('json/game.json', startGame);
}

function resetPage() {
	$('.gameBox').css('display', 'none');
}

function startGame(receivedData) {
	data = receivedData;
	nextQuestion();
}

function nextQuestion() {
	id++;
	
	if (data[id] == undefined) {
		finishGame();
	}
	
	questionData = data[id];
	
	$('#backgroundImage').css('background-image', 'url(\'' + data[id]['image'] + '\')');
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

	var correct = (answer == questionData['correctAnswer']);

	$('.answerCheck').css('display', 'block');
	
	var message = getTextItem('THE_ANSWER_IS') + ' ' + 
				  (correct ? getTextItem('CORRECT') : getTextItem('WRONG')) + '.<br/>' +
				  getTextItem('NEW_INFORMATION') + '<br/><br/>';
	// TODO: geen nieuwe informatie in geval fout antwoord
	// TODO: bijhouden welke informatie bekend is
	// TODO toevoegen aan message:
	// informatie over het eindpunt
	message += 'N 52.236667<br/>E 6.8375';
	message += '<br/><br/>';
	
	loadInfoPage(message, nextQuestion, getTextItem('NEXT'));
}

function checkLocation() {
	resetPage();
	
	$('.checkLocation').css('display', 'block');
	var message = '';
	
	if (typeof lastPosition === 'undefined') {
		message = getTextItem('NO_LOCATION_FOUND') + '<br/><br/>';
	} else {
		var lat = parseFloat(lastPosition.coords.latitude);
		var lon = parseFloat(lastPosition.coords.longitude);
		
		var latExpected = questionData['latitude'];
		var lonExpected = questionData['longitude'];
		
		var distance = getDistance(lat, lon, latExpected, lonExpected) * 1000;
		
		message = getTextItem('LOCATION_WILL_BE_CHECKED') + ' ' + getTextItem('FOUND_COORDINATES') + ':<br/><br/>N '
		  		  + lastPosition.coords.latitude.toFixed(6) + '<br/>E ' + lastPosition.coords.longitude.toFixed(6) + '<br/><br/>';
		
		var distanceText = getTextItem('DISTANCE_TO_EXPECTED POINT') + ':<br/>' + distance.toFixed(2) + 'm';
		
		if (distance > 25) {
			distanceText = asWarning(distanceText);
		}
		
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
	}
}

function loadMultipleChoiceQuestion() {
	$('.smallInfoBox').html(questionData['question']);
	
	$('.answer').each(function(index, element) {
		$(element).html(questionData['answers'][element.id]);
		$(element).click(function() { answerQuestion($(this).attr('id')); });
	});
}

function loadEnterBuildingQuestion() {
	var message = getTextItem('GO_TO_BUILDING') + ' ' + questionData['building'] + '.<br/>' +
				  getTextItem('PUSH_BUTTON') + '<br/><br/>' +
				  asWarning(getTextItem('PUSH_TOO_EARLY')) + '<br/><br/>';
	
	loadInfoPage(message, checkLocation, getTextItem('WE_ARE_INSIDE'));
}

function getTextItem(label) {
	return data['textItems'][label];
}