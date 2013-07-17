var teamId = getGETParam('teamId');
var language = getGETParam('language');
var deviceId = createUUID();

var PLATFORM = getPlatformName();
var FILE_SYSTEM_HOME = 'KickInQuest' + teamId;
var KICK_IN_QUEST_HOME = 'file:///mnt/sdcard/' + FILE_SYSTEM_HOME;

var SERVER_NUMBER = getGETParam('teamId').substring(3);
var KICK_IN_QUEST_SERVER_URL = 'http://farm' + SERVER_NUMBER + '.ewi.utwente.nl:8080/kick-in-quest-server';

var GET_QUESTIONS_URL = KICK_IN_QUEST_SERVER_URL + '/GetQuestions?language=' + language + '&teamId=' + teamId;
var ANSWER_QUESTIONS_URL = KICK_IN_QUEST_SERVER_URL + '/AnswerQuestions';

var LOCAL_PACKAGE_FILE_NAME = 'quest-' + teamId + '.zip';
var ANSWERS_FILE_NAME = "answers.txt";

function getPlatformName() {
	if (navigator.userAgent.match(/Android/i)) {
		return 'android';
	} else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
		//TODO: overwrite KICK_IN_QUEST_HOME here
		return 'ios';
	}
}

function loadInfoPage(infoText, callBackFunction, buttonText) {
	$('.infoText').html(infoText);
	loadInfoButton(callBackFunction, buttonText);
}

function loadInfoButton(callBackFunction, buttonText) {
	$('.infoButton').html(buttonText);
	
	// Stop previous handlers for this button
	$('.infoButton').unbind('click');
	$('.infoButton').click(callBackFunction);
}

function cl(message) {
	if (console != undefined) {
		console.log(message);
	}
}

function asWarning(message) {
	return '<span class="warning">' + message + '</span>';
}

function getGETParam(paramName) {
	var paramValuePairs = window.location.search.substring(1).split('&');
	var result = undefined;

	for (var i = 0; i < paramValuePairs.length; i++) {
		var paramValueArray = paramValuePairs[i].split('=');
		
		if (paramValueArray[0] == paramName) {
			result = paramValueArray[1];
		}
	}
	
	return result;
}

function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}