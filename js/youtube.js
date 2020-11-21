var settings_JSON = JSON.parse('{"languages":[{"name":"English","code":"en","max-repo-number":"0"}]}');




var regex = new RegExp(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/(?:watch\?v=|embed\/)|\.be\/)([\w\-\_]*)(?:&[\w]+=[\w]+)*/gm);
var urlMatch = regex.exec(window.location.href);

var vidID = urlMatch[1];
var maxRepoID = 0;

function checkForCaption(repoID, lang) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(this.readyState == 4) {  
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
    xhr.setRequestHeader("Access-Control-Allow-Origin","*");
    xhr.send();
}

chrome.storage.sync.get({
        language: 'english'
    },
    function(items) {    
        for(var i = 0; i < settings_JSON["languages"].length; i++)
            if(settings_JSON["languages"][i]["code"] == items.language)
                maxRepoID = parseInt(settings_JSON["languages"][i]["max-repo-number"]);

        checkForCaption(0, items.language);
    }
);