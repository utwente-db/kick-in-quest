$(document).ready(startCodeForm);
var DEFAULT_TEAM_ID = 'Team code';

alert('code.js 11:59');

function startCodeForm() {
	$('#teamId').focus(function() {
		$(this).val($(this).val().replace(DEFAULT_TEAM_ID, ''));
	});
	
	$('form').submit(checkForm);
	$('form').attr('action', 'info-' + getPlatformName() + '.html');
}

function checkForm() {
	if ($('#teamId').val() == '' || $('#teamId').val() == DEFAULT_TEAM_ID) {
		$('#teamId').css({'border-color': 'red'});
		$('#teamId').val(DEFAULT_TEAM_ID);
		
		return false;
	}
	
	return true;
}

function getPlatformName() {
	if (navigator.userAgent.match(/Android/i)) {
		return 'android';
	} else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
		//TODO: overwrite applicationDirectory.fullPath here
		return 'ios';
	}
}