/*
 * requires quest.js
 * requires file.js
 * requires zip.js
 */

var id = 0;
var data;

document.addEventListener('deviceready', loadInfo, false);

function loadInfo() {
	downloadPackage(initInfoScreen); 
}

function initInfoScreen() {
	$.get(KICK_IN_QUEST_HOME + '/json/info.json', startInfoScreen);
}

function startInfoScreen(receivedData) {
	data = JSON.parse(receivedData);
	nextInfoItem();
}

function nextInfoItem() {
	id++;
	
	if (typeof data[id] == 'undefined') {
		document.location = 'game.html?language=' + language + '&teamId=' + teamId;
		return;
	}
	
	loadInfoPage(data[id]['infoText'], nextInfoItem, data[id]['buttonText']);
}

function downloadPackage(callBackFunction) {
	fileExists(FILE_SYSTEM_HOME + '/json/info.json', 
		function() {
			initInfoScreen(); 
		},
		function() {
			downloadFile(GET_QUESTIONS_URL, LOCAL_PACKAGE_FILE_NAME, callBackFunction);
		});
}
