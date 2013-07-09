/*
 * requires quest.js
 * requires file.js
 * requires zip.js
 */

var id = 0;
var data;

var SERVER_NUMBER = getGETParam('teamId').substring(3);
var PACKAGE_FILE_PATH = 'http://farm' + SERVER_NUMBER + '.ewi.utwente.nl:8080/kick-in-quest-server/GetQuestions?language=' + language + '&teamId=' + teamId;
var LOCAL_PACKAGE_FILE_NAME = 'quest.zip';

document.addEventListener('deviceready', loadInfo, false);
$(document).bind('game:loaded', initInfoScreen);

function loadInfo() {
	downloadPackage(initInfoScreen); // do not supply "$(document).trigger('game:loaded')" as a parameter, because it is executed immediately 
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

function downloadPackage(callBack) {
	// TODO: base local file path on team id for testing purposes

	// TODO: Only necessary when using ZipJS. Remove?
	// zip.workerScriptsPath = "javascript/lib/";
	
	//new ZipFile(PACKAGE_FILE_PATH, extractEntries);
	downloadFile(PACKAGE_FILE_PATH, LOCAL_PACKAGE_FILE_NAME, callBack);
}

function extractEntries(zip) {
	console.log('about to extract entries');
	
	for (var i = 0; i < zip.entries.length; i++) {
        var entry = zip.entries[i];
    	console.log(entry.name);
    }
    
    console.log('done extracting entries');
    $(document).trigger('game:loaded');
}

function extractQuestionPackage() {
	extractZipFile(fileSystem, LOCAL_PACKAGE_FILE_NAME);
}