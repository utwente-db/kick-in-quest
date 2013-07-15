// Store GPS data to SD-Card
var zipFile = null;
var applicationDirectory = null;
var fileSystem = null;
var filesInZip = 0;
var extractedFiles = 0;
var callBack = null;

function initFileSystem(callBackFunction) {
	if (fileSystem != undefined) {
		return openFileSystem(fileSystem, callBackFunction);
	}
	
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function fileSystemInitialized(fileSystem) {
		openFileSystem(fileSystem, callBackFunction);
	}, failFS);
}

function openFileSystem(fileSystemParam, callBackFunction) {
	fileSystem = fileSystemParam;
	
	fileSystem.root.getDirectory(FILE_SYSTEM_HOME, {
		create : true,
		exclusive : false
	}, callBackFunction, onGetDirectoryFail);
}

function createFile(fileEntry, callbackFunction) {
	fileEntry.createWriter(callbackFunction, fail);
}

function failFS(evt) {
	alert("Opening file System failed with error " + evt.code);
	// alert(evt.code);
	// alert(evt.message);
	// alert(evt.target.error.code);
	// console.log(evt.target.error.code);
}

function onGetDirectoryFail(evt) {
	alert("Creating directory failed with error " + evt.code);
}

// Upload GPS data to Server using HTTP POST
// TODO: test this on a real server!
function uploadFile(sourceFileURI, serverURI, params, callBackFunction) {
    var options = new FileUploadOptions();
    
    options.fileKey = "data";
    options.fileName = sourceFileURI.substr(sourceFileURI.lastIndexOf('/') + 1); // only the filename
    options.mimeType = "text/plain";

    if (params == undefined) {
    	params = {};
    }
    
    options.params = params;
    
    var ft = new FileTransfer();
    ft.upload(sourceFileURI, encodeURI(serverURI), callBackFunction, onUploadFail, options);	
}

function onUploadOK(metadata) {
//	alert("Uploaded " + (Math.round(metadata.bytesSent / 102.4) / 10) + " MB");
	console.log("Code = " + metadata.responseCode);
	console.log("Response = " + metadata.response);
	console.log("Sent = " + metadata.bytesSent);
}

function onUploadFail(error) {
//	alert("An error has occurred: Code = " + error.code);
	console.log("upload error source " + error.source);
	console.log("upload error target " + error.target);
}

/*
 * DOWNLOAD FILE
 * Source: https://gist.github.com/nathanpc/2464060
 */
function downloadFile(downloadURI, destinationFileName, callBackFunction) {
	callBack = callBackFunction;
	window.requestFileSystem(
					LocalFileSystem.PERSISTENT,
					0, function(fileSystem) { onFileSystemSuccess(fileSystem, downloadURI, destinationFileName); }, fail);
}

function onFileSystemSuccess(fileSystem, downloadURI, destinationFileName) {
	fileSystem.root.getDirectory(FILE_SYSTEM_HOME, {
		create : true,
		exclusive : false
	}, function(directory) {onGetAppDirectory(directory, downloadURI, destinationFileName); }, fail);
}

function onGetAppDirectory(directory, downloadURI, destinationFileName) {
	applicationDirectory = directory; // remember the applicationDirectory for unzipping later on
	if (applicationDirectory != null) {
		var fileTransfer = new FileTransfer();
		fileTransfer.download(downloadURI,
			applicationDirectory.fullPath + '/' + destinationFileName,
			downloadSuccess,
			downloadError);
	} else
		alert("failed to create folder for application data on local storage.")
}

function downloadSuccess(theFile)  {
	applicationDirectory.getFile(LOCAL_PACKAGE_FILE_NAME, {
		exclusive : false
	}, function(fileEntry) { fileEntry.file(readFile, fail); }, fail);
	console.log("download complete: " + theFile.toURI());
}

function readFile(file) {
	 var reader = new FileReader();
	 reader.onload = function(evt) {
		 var data = evt.target.result.substring(28); // strip the string "data:application/zip;base64," from the data
		 zipFile = new JSZip(data, {base64: true});
		 createZipFolders();
	 };
	 //reader.readAsArrayBuffer(file);
	 reader.readAsDataURL(file);	 
}

function createZipFolders() {
	 var foldersInZip = 0;
     for (filename in zipFile.files) {
         var options = zipFile.files[filename].options || {};
    	 if (options.dir)
    		 ++foldersInZip;
     }
     var createdFolders = 0;
     var onCreateDirectory = function(parent) {
    	 ++createdFolders;
    	 if (createdFolders >= foldersInZip) {
    		 writeZipFiles();
    	 }
     }
     for (filename in zipFile.files) {
         var options = zipFile.files[filename].options || {};
    	 if (options.dir)
    		 applicationDirectory.getDirectory(filename, {create : true, exclusive : false}, onCreateDirectory, fail);
     }
}

function writeZipFiles() {
	filesInZip = 0;
    for (filename in zipFile.files) {
        var options = zipFile.files[filename].options || {};
        if (!options.dir)
        	++filesInZip;
    }
    extractedFiles = 0;
    for (filename in zipFile.files) {
        var options = zipFile.files[filename].options || {};
        if (!options.dir)
        	applicationDirectory.getFile(filename, {create : true, exclusive : false}, storeUnzippedFile, fail);
    }
}

function storeUnzippedFile(fileEntry) {
	fileEntry.createWriter(storeUnzippedFileWriter, fail);
}

function storeUnzippedFileWriter(writer) {
	writer.onwriteend = function(evt) {
		++extractedFiles;
		if (extractedFiles >= filesInZip) {
			callBack();
			// Now delete the ZIP file (this is only here to save the SD-card's space, so there is more available for the coordinates).
			applicationDirectory.getFile(LOCAL_PACKAGE_FILE_NAME, {
				exclusive : false
			}, function(fileEntry) { fileEntry.remove(null, fail); }, fail);
		}
	}
	var fileName = writer.fileName.substring(writer.fileName.indexOf(FILE_SYSTEM_HOME) + FILE_SYSTEM_HOME.length + 1);
	var data = zipFile.files[fileName].data;
	if (fileName.indexOf('.jpg') > 0 || fileName.indexOf('.jpeg') > 0) // binary, jpeg
		data = "data:image/jpeg;base64," + JSZipBase64.encode(data);
	else if (fileName.indexOf('.png') > 0) // binary, png
		data = "data:image/png;base64," + JSZipBase64.encode(data);
	writer.write(data);
}

function downloadError(error) {
	console.log("download error source " + error.source);
	console.log("download error target " + error.target);
	console.log("upload error code: " + error.code);
}

function fail(evt) {
	console.log(evt.target.error.code);
}

/*
 * END OF DOWNLOAD FILE
 */

function fileExists(path, fileExistsCallback, fileDoesNotExistCallback) {
	initFileSystem(function() {
        fileSystem.root.getFile(path, { create: false }, fileExistsCallback, fileDoesNotExistCallback);
    });
}