/*
 * requires quest.js
 * requires file.js
 * requires zip.js
 */

var id = 0;
var data;

document.addEventListener('deviceready', loadInfo, false);

function loadInfo() {
	alert('li 11:00');
	$(document).bind('appDirectory:loaded', checkForAnswersFile);
	initFileSystem();
}

function checkForAnswersFile() {
	alert('cfaf');
	fileExists('answers.txt', goToGame, downloadPackage);
}

function downloadPackage() {
	alert('dop');
	fileExists('json/info.json', 
		function() {
			initInfoScreen(); 
		},
		function() {
			downloadFile(GET_QUESTIONS_URL, LOCAL_PACKAGE_FILE_NAME, function(event) { readZIPFile(event, initInfoScreen); });
		});
}

function readZIPFile(event, callBackFunction) {
	alert('rzf');
	var data = event.target.result.substring(28); // strip the string "data:application/zip;base64," from the data
	zipFile = new JSZip(data, {base64: true});
	 
	createZipFolders(callBackFunction);
}

function initInfoScreen() {
	alert('iis');
	openFileSystemRead('json/info.json', startInfoScreen, true);
}

function startInfoScreen(event) {
	alert('sis');
	data = JSON.parse(event.target.result);
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

function goToGame() {
	document.location = 'game-' + getPlatformName() + '.html?language=' + language + '&teamId=' + teamId;
}