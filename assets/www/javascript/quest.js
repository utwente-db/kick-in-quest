var teamId = getGETParam('teamId');
var language = getGETParam('language');

var FILE_SYSTEM_HOME = 'KickInQuest' + teamId;
//TODO: overwrite this for iOS
var KICK_IN_QUEST_HOME = 'file:///mnt/sdcard/' + FILE_SYSTEM_HOME;

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

function levenshteinDistance (s, t) {
    if (!s.length) return t.length;
    if (!t.length) return s.length;

    return Math.min(
            levenshteinDistance(s.substr(1), t) + 1,
            levenshteinDistance(t.substr(1), s) + 1,
            levenshteinDistance(s.substr(1), t.substr(1)) + (s[0] !== t[0] ? 1 : 0)
    );
}