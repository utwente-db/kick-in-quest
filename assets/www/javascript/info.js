/*
 * requires quest.js
 * requires file.js
 * requires zip.js
 */

var id = 0;
var data;

document.addEventListener('deviceready', loadInfo, false);
$.getScript('javascript/lib/cordova-' + getPlatformName() + '.js');

function loadInfo() {
	$(document).bind('appDirectory:loaded', checkForAnswersFile);
	initFileSystem();
}

function checkForAnswersFile() {
	fileExists(FILE_SYSTEM_HOME + '/answers.txt', goToGame, downloadPackage);
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
		goToGame();
		return;
	}
	
	loadInfoPage(data[id]['infoText'], nextInfoItem, data[id]['buttonText']);
}

function downloadPackage() {
	fileExists(FILE_SYSTEM_HOME + '/json/info.json', 
		function() {
			initInfoScreen(); 
		},
		function() {
			downloadFile(GET_QUESTIONS_URL, LOCAL_PACKAGE_FILE_NAME, function(event) { readZIPFile(event, initInfoScreen); });
		});
}

function readZIPFile(event, callBackFunction) {
	var data = event.target.result.substring(28); // strip the string "data:application/zip;base64," from the data
	zipFile = new JSZip(data, {base64: true});
	 
	createZipFolders(callBackFunction);
}

function goToGame() {
	document.location = 'game-' + PLATFORM + '.html?language=' + language + '&teamId=' + teamId;
}