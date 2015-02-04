/*

 *  content.js

 *  The content script for the extension, injected into the DOM of any web page.

 *  Listens for a press of the 'shift' key and messages the query to the background script.

 *  When definitions received from the background script, it creates an element to which to

 *  anchor a qTip2 tooltip containing the definitions of the query.

 *

 *  Authors: Samuel Cheng, Sophia Feng

 *  20141207

 *  CS50, Harvard University 2014

 */



// starts listening when the document is loaded

$(document).ready(function () {

    // listen for stroke of 'shift' key and message highlighted text to background.js

    document.addEventListener("keydown", getKey);



    // event listener that receives a message from background.js

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

        // if the message is a definition, pass it to the textbox function, else log the message

        if (request.type == "def") {

            textbox(request);

            console.log("textbox request sent");

        }

        else

            console.log(request.greeting);

    });



    var SHIFT = 16;

});





// If the 'shift' key is pressed the highlighted text is processed

function getKey(e) {

    var code = e.keyCode ? e.keyCode : e.charCode;

    if (code == SHIFT)

        getHighlight();

}



// Gets highlighted text and send it as a message to be picked up by background.js

// When background.js responds, it logs success or error

function getHighlight() {

    var seltext = getSelectionTextAndContainerElement().text;



    chrome.runtime.sendMessage({ greeting: seltext }, function (response) {

        switch (response.farewell) {

            case "success":

                console.log("From Language Helper: query sent successfully")

                break;

            case "length":

                console.error("From Language Helper: query is too long");

                break;

            case "language":

                console.error("From Language Helper: query must be entirely Chinese");

                break;

            case "nonexistant":

                console.warn("From Language Helper: shift key pressed, nothing selected");

                break;

        }

    });

}



// uses qTip2 jquery add-on to create a textbox

function textbox(request) {

    var def1 = request.def1;

    var def2 = request.def2;

    var query = request.query;



    // linebreak

    var formatDefs = def1 + "<br><br>" + def2;



    // creates a inline element in the DOM so that we can attach our textbox

    var id = markSelection();



    // this selects the elements in the DOM with the same id as was generated for the new element

    // and adds a qTip tooltip to it

    $('#' + id).each(function () {

        $(this).qtip({

            content: {

                text: formatDefs,

                title: {

                    text: query,

                    button: 'Close'

                }

            },

            style: {

                classes: 'qtip-bootstrap qtip-shadow myStyle'

            },

            position: {

                my: 'top center',

                at: 'bottom center',

                target: $('#' + id)

            },

            // doesn't close unless the close button is clicked

            show: {

                solo: true,

                modal: {

                    on: false,

                    blur: false

                }

            },

            hide: false

        });

    });

}



// This replaces the parent element of the highlighted text with one that replaced every occurence of the

// elements containing the highlighted text with a new <span></span> element containing the original text,

// but with a unique id that can be used to select it when using qTip2

function markSelection () {

    var text = getSelectionTextAndContainerElement().text;

    var element = getSelectionTextAndContainerElement().containerElement;

    var content = element.innerHTML;

    var newId = "" + new Date().getTime() + "_" + Math.random().toString().substr(2);

    var replaceText = '<span id="' + newId + '">' + text + '</span>';

    var newContent = content.replace(text, replaceText);

    element.innerHTML = newContent;

    return newId;

}



// returns text and the container element of highlighted text

// by: Tim Down, from: http://jsfiddle.net/timdown/Q9VZT/

function getSelectionTextAndContainerElement() {

    var text = "", containerElement = null;

    if (typeof window.getSelection != "undefined") {

        var sel = window.getSelection();

        if (sel.rangeCount) {

            var node = sel.getRangeAt(0).commonAncestorContainer;

            containerElement = node.nodeType == 1 ? node : node.parentNode;

            text = sel.toString();

        }

    } else if (typeof document.selection != "undefined" &&

               document.selection.type != "Control") {

        var textRange = document.selection.createRange();

        containerElement = textRange.parentElement();

        text = textRange.text;

    }

    return {

        text: text,

        containerElement: containerElement

    };

}
