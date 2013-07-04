var PACKAGE_FILE_PATH = 'http://wwwhome.cs.utwente.nl/~graaffv/kickin/quest.zip';
var LOCAL_PACKAGE_FILE_NAME = 'quest.zip';
var FILE_SYSTEM_HOME = 'KickInQuest';
var KICK_IN_QUEST_HOME = 'file:///mnt/sdcard/' + FILE_SYSTEM_HOME;

function loadInfoPage(infoText, callBackFunction, buttonText) {
	$('#infoText').html(infoText);
	$('#infoButton').html(buttonText);
	
	// Stop previous handlers for this button
	$('#infoButton').unbind('click');
	$('#infoButton').click(callBackFunction);
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