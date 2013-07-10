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
	fileEntry.createWriter(callbackFunction, failW);
}

function failFS(evt) {
	alert("Opening file System failed with error " + evt.code);
	// alert(evt.code);
	// alert(evt.message);
	// alert(evt.target.error.code);
	// console.log(evt.target.error.code);
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
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, openAppFileSystem, failFS); // initialize the applicationDirectory for unzipping
	window.requestFileSystem(
					LocalFileSystem.PERSISTENT,
					0, function(fileSystem) { onFileSystemSuccess(fileSystem, downloadURI, destinationFileName); }, fail);
}

function openAppFileSystem(fileSystem) {
	fileSystem.root.getDirectory(FILE_SYSTEM_HOME, {
		create : true,
		exclusive : false
	}, onGetAppDirectory, onGetDirectoryFail);
}

function onGetAppDirectory(directory) {
	applicationDirectory = directory;
}

function onFileSystemSuccess(fileSystem, downloadURI, destinationFileName) {
	fileSystem.root.getFile("dummy.html", { create : true, exclusive : false }, function(fileEntry) { gotFileEntry(fileEntry, downloadURI, destinationFileName); }, fail);
}

function gotFileEntry(fileEntry, downloadURI, destinationFileName) {
	var sPath = fileEntry.fullPath.replace("dummy.html", "");
	var fileTransfer = new FileTransfer();
	
	fileEntry.remove();
	
	fileTransfer.download(downloadURI,
		sPath + destinationFileName,
		downloadSuccess,
		downloadError);
}

function downloadSuccess(theFile)  {
	if (applicationDirectory != null)
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, openFileSystemRead, failFS);
	else
		alert("application directory was null");
	console.log("download complete: " + theFile.toURI());
}

function openFileSystemRead(fileSystem) {
	fileSystem.root.getFile(LOCAL_PACKAGE_FILE_NAME, {
		exclusive : false
	}, readFileEntry, failFE);
}

function readFileEntry(fileEntry) {
	fileEntry.file(readFile, fail);
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
    		 applicationDirectory.getDirectory(filename, {create : true, exclusive : false}, onCreateDirectory, failFE);
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
        	applicationDirectory.getFile(filename, {create : true, exclusive : false}, storeUnzippedFile, failFE);
    }
}

function storeUnzippedFile(fileEntry) {
	fileEntry.createWriter(storeUnzippedFileWriter, failW);
}

function storeUnzippedFileWriter(writer) {
	writer.onwriteend = function(evt) {
		++extractedFiles;
		if (extractedFiles >= filesInZip) {
			callBack();
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