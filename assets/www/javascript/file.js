var fileWriter = null;

function openFileSystem(fileSystem) {
	fileSystem.root.getDirectory(appSDFolder, {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail);
}

function onGetDirectorySuccess(directory) {
	directory.getFile(gpsFileName, {create: true, exclusive: false}, createFile, failFE);
}

function createFile(fileEntry) {
	fileEntry.createWriter(createFileWriter, failW);
}

function createFileWriter(writer) {
	/*
    writer.onwriteend = function(evt) {
    	alert("success writing file");
    };
    */
	fileWriter = writer;
	fileWriter.write("Latitude,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
}

function failFS(evt) {
	alert("Opening file System failed with error " + evt.code);
	//alert(evt.code);
	//alert(evt.message);
	//alert(evt.target.error.code);
	//console.log(evt.target.error.code);
}

function failFE(evt) {
	alert("Opening file for writing failed with error " + evt.code);
}

function failW(evt) {
	alert("Creating FileWriter failed with error " + evt.code);
}

function onGetDirectoryFail(evt) {
	alert("Creating directory failed with error " + evt.code);
}

