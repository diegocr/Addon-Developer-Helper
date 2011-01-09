// From prototype.js :)
Object.extend = function(destination, source) {
  for (property in source) {
    destination[property] = source[property];
  }
  return destination;
}

// ProfileFile
// @author Nils Maier <MaierMan@web.de>
// modified version, moves xml to Profile directory
var ProfileFile = {
	_ds : Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties),
	get: function PF_get(fileName)	{
		var file = this._ds.get("ProfD", Components.interfaces.nsIFile)
		file.append(fileName);
		return file;
	}
};

// String
Object.extend(String.prototype, 
{	
	trim : function() {
		return this.replace(/^[ \t_]+|[ \t_]+$/gi, "").replace(/(_){2,}/g, "_");
	},
	removeBadChars : function() {
		return this.replace(/[\?\:<>\*\|"]/g, "_").replace(/%20/g, " ").replace(/%2520/g, " "); //"
	},
	findSystemSlash : function() {
		var path=(ProfileFile.get("dummy")).path;
		if (path.search(/\\/) != -1) return "\\"; else return "/";
	},
	findForbiddenSlash : function() {
		if (this.findSystemSlash() == "/")
			return "\\";
		else
			return "/";
	},
	addFinalSlash : function() {
		if (this.length == 0) return this.findSystemSlash();
		
		if (this[this.length - 1] != this.findSystemSlash())
			return this + this.findSystemSlash();
		else
			return this;
	},
	removeFinalChar : function(c) {
		if (this.length == 0) return this;
		if (this.length == 1) return (this==c)?"":this;
		
		if (this[this.length - 1]==c) {
			return this.substring(0, this.length - 1);
		} else
			return this;
	},
	removeLeadingChar : function(c) {
		if (this.length == 0) return this;
		if (this.length == 1) return (this==c)?"":this;
		
		if (this[0] == c) {
			return this.substring(1, this.length);
		} else
			return this;
	},
	removeFinalSlash : function() {
		return this.removeFinalChar(this.findSystemSlash());
	},
	removeLeadingSlash : function() {
		return this.removeLeadingChar(this.findSystemSlash());
	},
	removeFinalBackSlash : function() {
		return this.removeFinalChar("/");
	},
	removeLeadingBackSlash : function() {
		return this.removeLeadingChar("/");
	},
	removeArguments : function() {
		if (this.indexOf("?") > 0)
			return this.substring(0, this.indexOf("?"));
		else
			return this;
	},
	getUsableFileName : function() {
		var t = this.trim().removeArguments().removeFinalBackSlash().split("/");
		return t[t.length-1].removeBadChars().replace(/[\\/]/g, "").trim();
	},
	getExtension : function() {
		var name = this.getUsableFileName();
		var c = name.split(".");
		if (c.length == 1) 
			return null;
		else
			return c[c.length - 1];
	},
	formatTimeDate : function() {
		return this.replace(/\b(\d)\b/g, "0$1");
	},
	isLinkOpenable : function() {
		return this.match(/^(http|ftp|https):\/\/.+/i)
	}
}
);

function adhFilePicker() {}

adhFilePicker.prototype = {

	getFolder : function (predefined, text) {try {
		// nsIFilePicker object
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
		fp.init(window, text, nsIFilePicker.modeGetFolder);
		fp.appendFilters(nsIFilePicker.filterAll);
		
		// locate current directory
		var dest;
		if ((dest = this.createValidDestination(predefined)))
			fp.displayDirectory = dest;
		
		// open file picker
		var res = fp.show();
	
		if (res == nsIFilePicker.returnOK)
			return fp.file.path.addFinalSlash();
		
	} catch (e) { alert("Addon Developer Helper: OOPs! Something went wrong!"); }
	return false;
	},
	
	createValidDestination : function(path) {
			if (!path) return false;
			if (String(path).trim().length==0) return false;
			var directory = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			
			try {
				directory.initWithPath(path);
				if (directory.exists()) 
					return directory;
			} catch(e) {return false;}
			
			var f = (new String()).findSystemSlash();
			if (f=="/") {
				if ((/[\?\+&=:<>\*\|"\\]/gi).test(path)) return false;
			} else {
				if ((/[\?\+&=:<>\*\|"\/]/gi).test(path.substring(3, path.length))) return false;
			}

		return directory;
	},
	
	readFileContent: function(file) {
		// |file| is nsIFile
		var data = "";
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
								createInstance(Components.interfaces.nsIFileInputStream);
		var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
								createInstance(Components.interfaces.nsIConverterInputStream);
		fstream.init(file, -1, 0, 0);
		cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish

		var str = {};
		cstream.readString(-1, str); // read the whole file and put it in str.value
		data = str.value;

		cstream.close(); // this closes fstream
		fstream.close();
		
		return data;
	},
	
	writeToFile: function(file, data) {
		// file is nsIFile, data is a string
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
								 createInstance(Components.interfaces.nsIFileOutputStream);

		// use 0x02 | 0x10 to open file for appending.
		foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 

		// if you are sure there will never ever be any non-ascii text in data you can 
		// also call foStream.writeData directly
		var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
								  createInstance(Components.interfaces.nsIConverterOutputStream);
		converter.init(foStream, "UTF-8", 0, 0);
		converter.writeString(data);
		converter.close(); // this closes foStream
	}
}