#!/usr/bin/env node
var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var URL_NOT_INFORMED = "URL_NOT_INFORMED"
var FILE_NOT_INFORMED = "FILE_NOT_INFORMED";
var CHECKSFILE_DEFAULT = "checks.json";
var DOWNLOAD_FILE_PATH = "/home/ubuntu/bitstarter/downloadedFile.html";

var assertFileExists = function(infile) {
    return infile.toString();
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var downloadFile = function(url) {
  //console.log('downloadFile: ' + url);
  rest.get(url).on('complete', function(result) {
      if (result instanceof Error) {
         console.error('Error: ' + result.message);
         this.retry(5000);  //try again in 5 sec
      } else {
         //console.log('result: ' + result);
         fs.writeFile(DOWNLOAD_FILE_PATH, result, function(err) {
             if (err) throw err;
             //console.log('Saved!');
         });
      }
  });
}

var cheerioURL = function(url) {
    //console.log('cheerioURL ' + url);
    downloadFile(url);
    return cheerio.load(fs.readFileSync(DOWNLOAD_FILE_PATH));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkURL = function(url, checksfile) {
    $ = cheerioURL(url);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), FILE_NOT_INFORMED)
        .option('-u, --url <url>', 'URL to index.html', clone(assertFileExists), URL_NOT_INFORMED)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);

/*
rest.get('http://google.com').on('complete', function(result) {
  if (result instanceof Error) {
    console.log('Error: ' + result.message);
    this.retry(5000); // try again after 5 sec
  } else {
    console.log(result);
    fs.writeFile(DOWNLOAD_FILE_PATH, result, function(err) {
       if (err) throw err;
       console.log('It\'s saved!');
    });
  }
});
*/

    if (program.file == FILE_NOT_INFORMED && program.url == URL_NOT_INFORMED) {
        console.error('Error: Neither File nor URL was informed');
    } else if (program.file != FILE_NOT_INFORMED && program.url != URL_NOT_INFORMED) {
	console.error('Error: Both File and URL as informed');
    } else if (program.file == FILE_NOT_INFORMED && program.url != URL_NOT_INFORMED) {
        //console.log('OK: URL informed');
        var checkJson = checkURL(program.url, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    } else if (program.file != FILE_NOT_INFORMED && program.url == URL_NOT_INFORMED) {
        //console.log('OK: File informed');
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
