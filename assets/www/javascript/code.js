$(document).ready(startCodeForm);
var DEFAULT_TEAM_ID = 'Team code';

function startCodeForm() {
	$('#teamId').focus(function() {
		$(this).val($(this).val().replace(DEFAULT_TEAM_ID, ''));
	});
	
	$('form').submit(checkForm);
}

function checkForm() {
	if ($('#teamId').val() == '' || $('#teamId').val() == DEFAULT_TEAM_ID) {
		$('#teamId').css({'border-color': 'red'});
		$('#teamId').val(DEFAULT_TEAM_ID);
		
		return false;
	}
	
	return true;
}