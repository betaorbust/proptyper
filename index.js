#! /usr/bin/env node
'use strict';
var _ = require('lodash');
var exec = require('child_process').exec;
var fs = require('fs');

/**
 * Array of either regex objects, or functions that take one argument (propName) and return a boolean if matched.
 * @type {Object<RegExp>}
 */
var PROP_DEFINITIONS = {
	bool: [/[eE]nable|[Dd]isable/, /[Ii]s[A-Z]/, /[Cc]hecked/, /^has[A-Z]/],
	func: [/[hH]andle/, /^[Oo]n/],
	number: [/[Tt]otal/,/[Ii]ndex/, /[a-z]Num/, /[a-z]Num/, /Max$|Min$|^min|^max/, /columnsInRow/, /[Dd]elay$/, /Count$/, /^num[A-Z]|Num$/, /Ms$/, /^id$|Id$/],
	string: [/[nN]ame/, /[Ll]abel/, /[Tt]ype/, /[Kk]ind/, /^src|Src$/, /[Tt]itle/, /Text$/, /^url|Url$/, /Prefix$/, /^query$/],
	object: [/[Oo]ptions/, /[Cc]onfig/, /^model$/, /[Cc]ontext/, /Ref$/],
	node: [/^children$/]
};

var COMPONENT_HEAD_TEST = /React.createClass/;

// Set up our general variables
var userArgs = process.argv.splice(2);
var propTypesearchPattern = '\\(this\\|self\\|scope\\)\\.props\\.[A-Za-z0-9\\-]*';
var searchLocation = userArgs[0] ? userArgs[0] : '*';
var propTypeFindCommand = 'grep -oh "' + propTypesearchPattern + '" '+searchLocation;
var propTypeDefinedCommand = 'grep -oh "propTypes:" ' +searchLocation;
var minorIndent = '    ';

// Find the search pattern in the provided file and return an array of uses.
console.log('Attempting to put proptypes into ' + searchLocation);
exec(propTypeDefinedCommand, function(err, stdout, stderr){
	if(stdout.length > 0){
		console.warn('Proptypes already defined in ' + searchLocation, '; skipping.');
		process.exit(1);
	}
});

exec(propTypeFindCommand, function(err, stdout, stderr) {
	var uses = stdout.split('\n').sort();
	processLines(uses, PROP_DEFINITIONS);
});

/**
 * Pad a string to a fixed length.
 * @param text        The text you want to pad.
 * @param finalLength The final lenght of the string you want
 * @returns {String}  The padded string.
 */
function padWhitespace(text, finalLength){
	if(text.length >= finalLength){
		return text;
	}else{
		return text + new Array(finalLength - text.length + 1).join(' ');
	}
}

function buildBlock(uses, propDefinitions, initialIndent){
	var indent = initialIndent + minorIndent;
	var output = [];
	uses = _.map(uses, function(use){
		return use.slice(11);
	});
	uses = _.without(_.uniq(uses, true), '', 'hasOwnProperty'); // get rid of built-in props
	output.push(indent+'//<proptypes>\n'+indent+'propTypes: {');
	var maxPropNameLength = _.max(uses, function(use){
		return use.length;
	}).length;
	_.forEach(uses, function(use, idx, collection){

		output.push(indent + minorIndent + padWhitespace(use + ': ', maxPropNameLength + 2) + parseType(use, propDefinitions) + (idx === (collection.length-1) ? '' : ','));
	});
	output.push(indent + '},\n' + indent + '//</proptypes>');
	console.log(output.join('\n')); // Print it in the console

	return output;
}

// Process the found lines, build up an output object, write it to the file.
function processLines(uses, propDefinitions){
	// Read the file
	fs.readFile(searchLocation, function(err, data) {
		if(err) {throw err;}
		var fileArray = data.toString().split('\n');

		var insertLine = _.findIndex(fileArray, function(line){return COMPONENT_HEAD_TEST.test(line);});
		if(!_.isNumber(insertLine) || insertLine < 0){
			console.warn('Couldn\'t find good place to inject proptypes! Skipping file.');
			process.exit(1);
		}

		console.log('insert line is:', insertLine);
		var indent = (/^[ \t]+/.exec(fileArray[insertLine]) || [''])[0];
		var output = buildBlock(uses, propDefinitions, indent);
		// Insert the content at specified line
		fileArray.splice.apply(fileArray, [insertLine + 1, 0].concat(output));

		fs.writeFile(searchLocation, fileArray.join('\n'), function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log('The file was saved!');
			}
		});
	});
}

// Does a *very* basic parse based on the propDefinitions object handed in.
/**
 * [parseType description]
 * @param  {String} propName        The name being processed. this.props.propName <-
 * @param  {Object} propDefinitions Name of type for key. Regex to match, or boolean function to test against for value.
 * @return {String}                 The React proptype string
 */
function parseType(propName, propDefinitions){
	var BASE = 'React.PropTypes.';
	var found = false;
	_.forEach(propDefinitions, function(checks, checkType, obj){
		_.forEach(checks, function(check, ind, arr){
			if(_.isRegExp(check) && check.test(propName) || _.isFunction(check) && check(propName)){
				found = BASE+checkType;
				return false;
			}
		});
		return !found;
	});
	// If it didn't match any check, just return the base.
	return found || BASE;
}