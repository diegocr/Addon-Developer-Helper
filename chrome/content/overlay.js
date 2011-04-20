var addondeveloperhelper = {
		onLoad: function() {
		},

		onToolbarButtonRestartCommand: function(e) {
			this.restartApp();
		},

		onToolbarButtonCleanRestartCommand: function (e) {
			this.cleanAndRestartApp();
		},

		onToolbarButtonReloadChromeCommand: function (e) {
			this.reloadChrome();
		},
		
		onToolbarButtonLoadUnpackedExtCommand: function (e) {
			var dir = this.browseDir();
			if(dir) {
				this.loadExtension(dir);
			}
		},

		onToolbarButtonBuildExtCommand: function (e) {

		},

		// Code taken from chrome://toolkit/content/mozapps/extensions/extensions.js
		restartApp: function () {
		  const nsIAppStartup = Components.interfaces.nsIAppStartup;
		  // Notify all windows that an application quit has been requested.
		  var os = Components.classes["@mozilla.org/observer-service;1"]
							 .getService(Components.interfaces.nsIObserverService);
		  var cancelQuit = Components.classes["@mozilla.org/supports-PRBool;1"]
									 .createInstance(Components.interfaces.nsISupportsPRBool);
		  os.notifyObservers(cancelQuit, "quit-application-requested", null);
		  // Something aborted the quit process. 
		  if (cancelQuit.data)
			return;
		  // Notify all windows that an application quit has been granted.
		  os.notifyObservers(null, "quit-application-granted", null);
		  // Enumerate all windows and call shutdown handlers
		  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							 .getService(Components.interfaces.nsIWindowMediator);
		  var windows = wm.getEnumerator(null);
		  while (windows.hasMoreElements()) {
			var win = windows.getNext();
			if (("tryToClose" in win) && !win.tryToClose())
			  return;
		  }
		  Components.classes["@mozilla.org/toolkit/app-startup;1"].getService(nsIAppStartup)
					.quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
		},

		cleanAndRestartApp: function() {
			// diegocr's way ;-)
			const XRE = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);
			if(typeof XRE.invalidateCachesOnRestart == 'function') {
				XRE.invalidateCachesOnRestart();
			} else {
				const files = ['compreg.dat','xpti.dat','extensions.cache','extensions.ini','extensions.rdf'];
				
				for each(var name in files) {
					var file = Components.classes["@mozilla.org/file/directory_service;1"]
						.getService(Components.interfaces.nsIProperties)
						.get("ProfD", Components.interfaces.nsIFile);
					
					file.append(name);
					if(file.exists()) {
						file.remove(false);
					}
				}
			}
			
			// Restart
			this.restartApp();
		},

		reloadChrome: function()
		{
		  try {
			Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService(Components.interfaces.nsIXULChromeRegistry).reloadChrome();
		  } catch(e) { alert(e) }
		},
		
		browseDir: function() {
			var f = new adhFilePicker();
			var newDir = f.getFolder();
			return newDir;
		},
		
		loadExtension: function (dir) {
			if(dir) {
				var file = Components.classes["@mozilla.org/file/local;1"].  
						   createInstance(Components.interfaces.nsILocalFile);  
				file.initWithPath(dir+"install.rdf");
				if(file.exists()) {
					var extId = this.getExtId(file);
					if(extId) {
						this.deployExtension(extId, dir);
					}
				} else {
					alert("Problem! There's no install.rdf file in selected folder!");
				}
			}
		},
		
		getExtId: function(file) {
			var fp = new adhFilePicker();
			var xml = fp.readFileContent(file);
			if(xml) {
				var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
									.createInstance(Components.interfaces.nsIDOMParser);
				var doc = parser.parseFromString(xml, "text/xml");
				var elm = doc.getElementsByTagName("em:id");
				for(var i=0; i<elm.length; i++) {
					if(elm[i].parentNode.hasAttribute("about")) { //about column is only present in extension desc
						if(elm[i].childNodes[0] && elm[i].childNodes[0].nodeValue) {
							return elm[i].childNodes[0].nodeValue;
						}
					}
				}
			}
		},
		
		deployExtension: function(extId, dir) {
			try {
				var file = Components.classes["@mozilla.org/file/directory_service;1"].
                     getService(Components.interfaces.nsIProperties).
                     get("ProfD", Components.interfaces.nsIFile);  
				file.append("extensions");
				file.append(extId);
				file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
				
				if(file.exists()) {
					var fp = new adhFilePicker();
					fp.writeToFile(file, dir);
					this.restartApp();
				}
			} catch(e) { alert("Problem! Could not deploy extension. File I/O Error! "+e); }
		}
};
window.addEventListener("load", addondeveloperhelper.onLoad, false);
