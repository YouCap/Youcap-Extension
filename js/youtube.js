//The URI for the language information JSON file
const LANGUAGE_URI = "https://raw.githubusercontent.com/YouCap/YouCap-Website/main/backend/youcap-info.json";

//The language information JSON object, with a default value.
var settings_JSON = JSON.parse('{"languages":[{"name":"English","code":"en","max-repo-number":"0"}]}');

//The video ID for the current video.
var vidID;

//The max repository ID for the current language.
var maxRepoID = 0;

//Downloads the available languages from the website
function downloadLanguages() {
    //Get the JSON data from the site.
    fetch(LANGUAGE_URI).then(response => response.json()).then(data => settings_JSON = data);
}

//Checks to see if captions exist for the current video and language.
function checkForCaption(repoID, lang) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(this.readyState == 4) {  
            /* If captions exist, then create the UI accordingly.
             * If captions don't exist, but there are other repositories to check, search them.
             * Otherwise, create the UI in accordance with failure.
             */
            if(this.status == 200) {
                onDownloadCaptions(this.responseText);
            } else if(repoID < maxRepoID) {
                checkForCaption(repoID + 1, lang);
            } else {
                onDownloadFailed();
            }
        }
    }

    xhr.open("get", "https://raw.githubusercontent.com/YouCap/captions-" + lang + "-" + repoID + "/main/published/" + vidID);
    xhr.send();
}

//Update the video ID with the URL
function getVidID() {
    var regex = new RegExp(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/(?:watch\?v=|embed\/)|\.be\/)([\w\-\_]*)(?:&[\w]+=[\w]+)*/gm);
    var urlMatch = regex.exec(window.location.href);

    return urlMatch[1];
}

//Load the captions and language information.
function loadCaptionInfo() {
    vidID = getVidID();
    
    chrome.storage.sync.get({
            language: 'english'
        },
        function(items) {    
            for(var i = 0; i < settings_JSON.languages.length; i++)
                if(settings_JSON.languages[i]["code"] == items.language)
                    maxRepoID = parseInt(settings_JSON.languages[i]["max-repo-number"]);

            checkForCaption(0, items.language);
        }
    );
}

//For when the URL changes but the page isn't switched (most notably the back/forward buttons)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // listen for messages sent from background.js
    if (request.message === 'yc_msg-urlChanged') {   
        const newVidID = getVidID();
        if (newVidID === vidID) {
            return;
        }
        
        //Delete the elements
        var sandbox_doc = document.getElementById("yc-iframe");
        sandbox_doc.parentNode.removeChild(sandbox_doc);
        
        document.getElementById("yc-button").setAttribute("aria-pressed", "false");

        //Delete the scripts
        var script = document.querySelectorAll("[src='" + chrome.runtime.getURL("/js/webpage.js") + "']");
        for(var i = 0; i < script.length; i++)
            script[i].parentNode.removeChild(script[i]);

        loadCaptionInfo();
    }
});

//First pass on downloading captions.
downloadLanguages();
loadCaptionInfo();