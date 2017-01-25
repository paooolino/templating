var fs = require('fs');
var path = require('path');
var config = require("./config.builder.js");

var TEMPLATE_ROOT = "./build/";
var REPO_ROOT = "./repo/";

for (var template in config) {
	createTemplateFolder(template);
	var custom_css = '';
	var custom_js = '';
	for (var page in config[template]) {
		var html = '';
		var libraries = {
			css: [],
			js: [],
			img: [],
			fonts: []
		};
		for (var module in config[template][page]) {
			var objresult = processModule(module, config[template][page][module]);
			html += objresult.html;
			libraries.css = libraries.css.concat(objresult.libraries.css);
			libraries.js = libraries.js.concat(objresult.libraries.js);
			libraries.img = libraries.img.concat(objresult.libraries.img);
			libraries.fonts = libraries.fonts.concat(objresult.libraries.fonts);
			custom_css += objresult.css;
			custom_js += objresult.js;
		}
		html = html.replace(/{{CSS_LIBRARIES}}/g, process_libraries("css", libraries.css));
		html = html.replace(/{{JS_LIBRARIES}}/g, process_libraries("js", libraries.js));

		writeLibraries(template, libraries);
		writeFile(TEMPLATE_ROOT + template + "/" + page, html);
	}
	writeFile(TEMPLATE_ROOT + template + '/css/custom.css', custom_css);
	writeFile(TEMPLATE_ROOT + template + '/js/custom.js', custom_js);
}

/**
 *******************************************************************************
 * Functions
 *******************************************************************************
 */

function writeLibraries(template_name, libraries) {
	for (var type in libraries) {
		for (var i = 0; i < libraries[type].length; i++) {
			var source = libraries[type][i];
			var destination = TEMPLATE_ROOT + template_name + '/' + type + '/' + path.basename(source);
			fs.createReadStream(source).pipe(fs.createWriteStream(destination));
		}
	}
}

function process_libraries(type, arr_path) {
	var templates = {
		"css": '<link rel="stylesheet" href="css/{{FILENAME}}">',
		"js": '<script src="js/{{FILENAME}}"></script>'
	}
	arr_path = arr_path.map(function(entry) {
		return templates[type].replace('{{FILENAME}}', path.basename(entry));
	});
	return arr_path.join('\r\n\t');
}

function createTemplateFolder(template_name) {
	createFolderIfNotExists(TEMPLATE_ROOT + template_name);
	createFolderIfNotExists(TEMPLATE_ROOT + template_name + '/css');
	createFolderIfNotExists(TEMPLATE_ROOT + template_name + '/js');
	createFolderIfNotExists(TEMPLATE_ROOT + template_name + '/img');
	createFolderIfNotExists(TEMPLATE_ROOT + template_name + '/fonts');
}

function processModule(module_name, module_content, deep) {
	var deep = deep || 0;
	
	var html = readFile(REPO_ROOT + module_name + "/html.html");
	var css = readFile(REPO_ROOT + module_name + "/css.css");
	var js = readFile(REPO_ROOT + module_name + "/js.js");
	
	var libraries = {
		css: [],
		js: [],
		img: [],
		fonts: []
	}
	if (fs.existsSync(REPO_ROOT + module_name + "/dependencies.js")) {
		var dependencies = require(REPO_ROOT + module_name + "/dependencies.js");
		for (ext in dependencies) {
			for (var i = 0; i < dependencies[ext].length; i++) {
				libraries[ext].push(REPO_ROOT + module_name + "/" + dependencies[ext][i]);
			}
		}
	}
	
	// process children
	var children_html = ''; 
	
	for (module in module_content) {
		var objresult = processModule(module, module_content[module], deep+1);
		children_html += objresult.html;
		libraries.css = libraries.css.concat(objresult.libraries.css);
		libraries.js = libraries.js.concat(objresult.libraries.js);
		libraries.img = libraries.img.concat(objresult.libraries.img);
		libraries.fonts = libraries.fonts.concat(objresult.libraries.fonts);
		css += objresult.css;
		js += objresult.js;
	}
	
	html = html.replace('{{CHILDREN}}', 
		insert_tabbed_html(html, children_html, '{{CHILDREN}}'));
	
	return {
		html: html,
		css: css,
		js: js,
		libraries: libraries
	}
}

function insert_tabbed_html(parent_html, content_html, tag) {
	// find and count numer of original tabs before tag
	var n_tabs = 0;
	var re = new RegExp('(.*?)' + tag, 'g');
	var children_row = parent_html.match(re);
	if (children_row) {
		n_tabs = (children_row[0].match(/\t/g) || []).length;
	}	
	
	// recompose rows
	var rows = content_html.split('\r\n');
	var new_rows = [];
	for (var i = 0; i < rows.length; i++) {
		var new_row = rows[i];
		if (i > 0) {
			new_row = '\t'.repeat(n_tabs) + new_row;
		}
		new_rows.push(new_row);
	}
	
	return new_rows.join('\r\n');
}

function createFolderIfNotExists(folder) {
	if (!fs.existsSync(folder)){
		fs.mkdirSync(folder);
	}
}

function writeFile(filename, content) {
	fs.writeFile(filename, content, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("Writing " + filename + " [OK]");
	}); 
}

function readFile(filename) {
	var content = '';
	try {
		content = fs.readFileSync(filename, 'utf8');
	} catch(err) {
		//console.log("Error reading file " + filename);
	}
	return content;
}