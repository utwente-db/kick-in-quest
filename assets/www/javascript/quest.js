var PACKAGE_FILE_PATH = 'http://wwwhome.cs.utwente.nl/~graaffv/kickin/quest.zip';
var LOCAL_PACKAGE_FILE_NAME = 'quest.zip';

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