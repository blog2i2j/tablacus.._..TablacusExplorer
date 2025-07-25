//Tablacus Explorer

function _s() {
	try {
		window.te = external;
		api = te.WindowsAPI;
		sha = api.CreateObject("sha");
		wsh = api.CreateObject("wsh");
		arg = api.CommandLineToArgv(api.GetCommandLine());
		if (/rundll32\.?(exe)?"?$/i.test(arg[0])) {
			arg.shift();
		}
		location = { href: arg[2], hash: '' };
		var parent = GetParentFolderName(api.GetModuleFileName(null));
		if (!/^[A-Z]:\\|^\\\\/i.test(location.href)) {
			location.href = BuildPath(parent, location.href);
		}
		var sw = sha.Windows();
		for (var i = 0; i < sw.Count; ++i) {
			var x = sw.item(i);
			if (x && x.Document) {
				var w = x.Document.parentWindow;
				if (w && w.Exchange && w.Exchange[arg[3]]) {
					window.MainWindow = w;
					var rc = api.Memory('RECT');
					api.GetWindowRect(w.te.hwnd, rc);
					api.MoveWindow(te.hwnd, (rc.Left + rc.Right) / 2, (rc.Top + rc.Bottom) / 2, 0, 0, false);
				}
			}
		}
		api.AllowSetForegroundWindow(-1);
		return _es(location.href);
	} catch (e) {
		wsh.Popup((e.stack || e.description || e.toString()), 0, 'Tablacus Explorer', 0x10);
	}
}

function _es(fn) {
	if (!/^[A-Z]:\\|^\\\\/i.test(fn)) {
		fn = BuildPath(/^\\/.test(fn) ? GetParentFolderName(api.GetModuleFileName(null)) : GetParentFolderName(location.href), fn);
	}
	var s;
	try {
		var ado = api.CreateObject("ads");
		ado.CharSet = 'utf-8';
		ado.Open();
		ado.LoadFromFile(fn);
		s = ado.ReadText();
		ado.Close();
	} catch (e) {
		if (window.MainWindow && MainWindow.Exchange) {
			MainWindow.Exchange[arg[3]] = void 0;
		}
		wsh.Popup((e.description || e.toString()) + '\n' + fn, 0, 'Tablacus Explorer', 0x10);
	}
	if (s) {
		if (!/consts\.js$/i.test(fn)) {
			s = FixScript(s);
		}
		try {
			return new Function(s)();
		} catch (e) {
			wsh.Popup((e.stack || e.description || e.toString()) + '\n' + fn, 0, 'Tablacus Explorer', 0x10);
		}
	}
}

function importScripts() {
	for (var i = 0; i < arguments.length; ++i) {
		_es(arguments[i]);
	}
}

function FixScript(s) {
	s = s.replace(/([^\.\w])(async |await )/g, "$1");
	if ("undefined" == typeof ScriptEngineMajorVersion) {
		return s;
	}
	s = s.replace(/(\([^\(\)]*\))\s*=>\s*\{/g, "function $1 {");
	return ScriptEngineMajorVersion() > 10 ? s : s.replace(/([^\.\w])(const |let )/g, "$1var ").replace(/^const |^let /, "var ");
}

BuildPath = function () {
	var s = "";
	var q;
	for (var i = 0; i < arguments.length; ++i) {
		if (q = String(arguments[i]).replace(/[\/\\]$/, "")) {
			if (s) {
				s += "\\" + (q.replace(/^[\/\\]+/, ""));
			} else {
				s = q;
			}
		}
	}
	return s.replace(/\//g, "\\");
};

GetParentFolderName = function (s) {
	var res = /^(.*)([\\\/])/.exec(s);
	var d = res && /^[A-Z]:/i.test(res[1]) ? 3 : 1;
	var r = res ? res[1].length < d ? res[1] + res[2] : res[1] : "";
	return r != s && r != "\\" && r.length >= d ? r : "";
}
