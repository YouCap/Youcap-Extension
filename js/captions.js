//Get the HTMLMediaElement
var movie_player = document.querySelector("video");

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
}

//Converts a time code to seconds.
function timeToSeconds(time) {
    //The individual components of the time
    var split = time.split(':');
    
    var total = 0;
    for(var i = split.length - 1; i >= 0; i--) {
        total += parseFloat(split[i]) * Math.pow(60, split.length - 1 - i);
    }
    
    return total;
}

//A parser for SBV files, which is YouCap's file format.
var PARSER_SBV = function(contents) {
    contents = contents.replace(/\r\n/, "\n");
    
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

//The captions text
var captions;

//The time that the last caption ends at
var lastCaptionEndTime = 0;

//The index of the current caption
var currCaption = 0;

//A variable to stire tge caption checking interval.
var interval;

//The function responsible for handling caption download and UI creation if captions are available for the video
function onDownloadCaptions(downloadedText) {
    captions = PARSER_SBV(downloadedText);
    
    chrome.storage.sync.get({
            showCaptions: false
        },
        function(items) {
            createUI(items.showCaptions, true);
        
            //Constantly check whether the caption needs to be changed.
            if(!interval)
                interval = setInterval(changeCaption, 16);
        }
    );
}

//The function responsible for handling UI creation if no captions are available.
function onDownloadFailed() {
    createUI(false, false);
    document.getElementById("yc-button").setAttribute("disabled", "");
}

//A variable for keeping track of the current time.
var currTime = 0;

//Check what caption we should be on, and change it if necessary
function changeCaption() {    
    //Gets the current time
    if(!movie_player.paused)
        currTime = movie_player.currentTime;
        
    //If the current time is not between the end of the last caption and the end of the current one, we're not sure what caption we should be on.
    if(!(currTime >= lastCaptionEndTime && currTime <= captions[currCaption][1])) {
        /*
         * If the current caption isn't the last one, then we can check the following condition:
         * If the current time is between the end time of this caption and the end time of the next one,
         * the caption just needs to be advanced forwards, since the player just went past the current caption.
         */
        if(currCaption < captions.length - 1 && currTime > captions[currCaption][1] && currTime < captions[currCaption + 1][1]) {
            lastCaptionEndTime = parseFloat(captions[currCaption][1]);
            currCaption++;
        } else {
            //Otherwise, we need to search the entire caption list for the correct caption.
            searchCaptions(currTime);
        }
    }
    
    //If there's a caption at the current time, create it. Otherwise, set the caption to empty.
    if(currTime >= captions[currCaption][0] && currTime <= captions[currCaption][1])
        createCaption(captions[currCaption][2]);
    else
        createCaption("");
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