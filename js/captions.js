var el = document.getElementById("movie_player");
el.setAttribute("data-played-seconds", 0);
el.setAttribute("data-played-time", new Date().getTime()/1000);
el.setAttribute("data-played-state", true);

//Utils
//Formats an entered value into a string in the format of MM:SS.MS
function timeFormat(value) { 
    if(value.match("^([0-9]*:)?[0-9]{2}:[0-9]{2}\\.[0-9]+$"))
        return value;
    
    var steps = ["[0-9]", "[0-9]", ":", "[0-9]", "[0-9]", ":", "[0-9]", "[0-9]", "\\.", "[0-9]+", ""];
    var placeholders = "00:00.0";
    
    var match = "";
    for(var i = steps.length - 1; i >= 0; i--) {
        match = steps[i] + match;
        if(value.match("^" + match + "$"))
            return placeholders.substring(0, i) + value.substring(0, steps.length - 1 - i);
    }
    
    return "";
    console.log("REGEX ERROR");
}

//Converts a time code to seconds.
function timeToSeconds(time) {
    var split = time.split(':');
    var total = 0;
    for(var i = split.length - 1; i >= 0; i--) {
        total += parseFloat(split[i]) * Math.pow(60, split.length - 1 - i);
    }
    
    return total;
}

//A parser for SBV files.
var PARSER_SBV = function(contents) {
    //Regex for matching SBV entries
    var REGEX = new RegExp("([\\d:.]+),([\\d:.]+)\\n([\\s\\S]*?)(?=$|\\n{2}(?:\\d{1,2}:)+)", "gm");
    
    //The resulting matches
    var result = [];
        
    while((match = REGEX.exec(contents)) !== null) {  
        var append = [];
        append.push(timeToSeconds(timeFormat(match[1].replace(",", "."))));
        append.push(timeToSeconds(timeFormat(match[2].replace(",", "."))));
        append.push(match[3]);
        
        result.push(append);
    }
    
    return result;
}; //https://fileinfo.com/img/ss/lg/sbv_4417.png

var captions;
var lastCaptionEndTime = 0;
var currCaption = 0;
function onDownloadCaptions(downloadedText) {
    captions = PARSER_SBV(downloadedText);
    
    chrome.storage.sync.get({
            showCaptions: false
        },
        function(items) {
            createUI(items.showCaptions);
            setInterval(changeCaption, 16);
        }
    );
}

var currTime = 0;
//Check what caption we should be on, and change it if necessary
function changeCaption() {
    //Gets the current time
    if(el.getAttribute("data-played-state") == "true")
        currTime = parseFloat(el.getAttribute("data-played-seconds")) + ((new Date().getTime()/1000) - parseFloat(el.getAttribute("data-played-time")));
        
    //If the current time is not between the end of the last caption and the end of the current one, we're not sure what caption we should be on.
    if(!(currTime >= lastCaptionEndTime && currTime <= captions[currCaption][1])) {
        //If the current caption isn't the last one, then we can check the following condition:
        //  If the current time is between the end time of this caption and the end time of the next one, the caption just needs to be advanced forwards, since the player just went past the current caption.
        if(currCaption < captions.length - 1 && currTime > captions[currCaption][1] && currTime < captions[currCaption + 1][1]) {
            lastCaptionEndTime = parseFloat(captions[currCaption][1]);
            currCaption++;
        } else {
            //Otherwise, we need to search the entire caption list for the correct caption.
            searchCaptions(currTime);
        }
    }
    
    if(currTime >= captions[currCaption][0] && currTime <= captions[currCaption][1])
        createCaption(captions[currCaption][2]);// + "\n" + currCaption + ": " + currTime + "\n" + lastCaptionEndTime + "-" + captions[currCaption][0] + " - " + captions[currCaption][1]);
    else
        createCaption("");//currCaption + ": " + currTime + "\n" + lastCaptionEndTime + "-" + captions[currCaption][0] + " - " + captions[currCaption][1]);
}

//Search the entire caption list for the caption the extension should have loaded right now.
function searchCaptions(time) {
    for(var i = 0; i < captions.length; i++) {
        //Get the end time of the previous and current caption.
        var et1 = i > 0 ? parseFloat(captions[i - 1][1]) : 0;
        var et2 = parseFloat(captions[i][1]);
        
        //If the current time is between the end of this caption and the end of the prior one, this is the caption we need.
        if(et1 <= time && et2 >= time) {
            lastCaptionEndTime = et1;            
            currCaption = i;
            break;
        }
    }
}