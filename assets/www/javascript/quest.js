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