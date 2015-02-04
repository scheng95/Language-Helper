/*
 *  background.js
 *  The background script for the extension, only active when activated by the content script.
 *  Checks validity of the query, sends it to MDBG, gets the definitions, and passes them back
 *  to the content script.
 *
 *  Authors: Samuel Cheng, Sophia Feng
 *  20141207
 *  CS50, Harvard University 2014
 */


// The background script, which only runs when a message is received from the content script

// constants
const MAXLEN = 4;
const START = 0x4E00;       // beginning of Chinese characters in unicode
const END = 0x9FA6;         // end of Chinese characters in unicode
const MDBGURL = "http://www.mdbg.net/chindict/chindict.php?page=worddict&wdrst=0&wdqb=";

// listens for message from the content script, processes it, and responds to the content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var query = request.greeting;
    var len = query.length;

    // queries must not be existent and no more than 4 charaters long, otherwise an error
    // message is sent back to the content script
    if (len <= MAXLEN && len > 0) {
        // check if each character in the selection is a Chinese character
        var i = 0;
        var isChinese = true;
        while (i < len) {
            var charCode = query[i].charCodeAt();
            if (!(charCode >= START && charCode <= END))
                isChinese = false;
            i++;
        }
        if (isChinese) {
            // if all requirements are met, the query is sent to MDBG
            sendResponse({ farewell: "success" });
            loadXMLDoc(query);
        }
        else
            sendResponse({ farewell: "language" });
    }
    else if (len == 0)
        sendResponse({ farewell: "nonexistant" });
    else
        sendResponse({ farewell: "length" });
});

// loads and parses the HTML of the web page of the results of the query to MDBG
function loadXMLDoc(query) {
    var xhr = new XMLHttpRequest();
    var url = MDBGURL.concat(query);
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                // extracts the first two definitions from the MDBG HTML and messages them to the content script
                var defs = extractDefs(xhr.responseText);
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "def", def1: defs[0], def2: defs[1], query: query});
                });
            }
        }
    }
    xhr.send();
}

// parses the HTML from MDBG and returns the definitions
function extractDefs(doc) {
    // look for elements of the id "defs" and extract their contents
    var startIndex = doc.indexOf('<div class="defs">') + 18;
    var temp = doc.substring(startIndex);
    var endIndex = temp.indexOf('</div>');
    var def1 = temp.substring(0, endIndex);

    // look for second element, if exists
    var secondIndex = doc.lastIndexOf('<div class="defs">') + 18;
    if (startIndex != secondIndex) {
        temp = temp.substring(1);
        startIndex = temp.indexOf('<div class="defs">') + 18;
        temp = temp.substring(startIndex);
        endIndex = temp.indexOf('</div>');
        var def2 = temp.substring(0, endIndex);
    }

    // if second definition doesn't exist, send empty string
    if (def2)
        var definitions = [def1, def2];
    else
        var definitions = [def1, ""];

    return definitions;
}
