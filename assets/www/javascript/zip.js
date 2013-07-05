/*
 * requires lib/js-unzip.min.js
 */

function extractZipFile(fileSystemParam, fileName) {
	fileSystemParam.root.getFile(fileName, {create: false}, readZipFileSuccess, readZipFileFail);
}

function readZipFileSuccess(data) {
	var unzipper = new JSUnzip(data);

	if (unzipper.isZipFile()) {
		console.log('yes');
	} else {
		console.log('no');
	}

	if (!unzipper.isZipFile()) {
		readZipFileFail();
	}
	
	unzipper.readEntries();
	console.log('rzfs5: ' + unzipper.entries);
	
//	console.log(unzipper.entries);
	
	$(unzipper.entries).each(function(entry) {
		console.log('each');
		console.log(d.fileName);
		// TODO write these to SD card
	});
}

function readZipFileFail(error) {
	alert('Unable to read ZIP file. Check your Internet connection.');
}