//MutationObserver for all but webkit-based browsers
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

const GEAR_IMAGE_SVG_TEXT = '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><use class="ytp-svg-shadow" xlink:href="#ytp-id-19"></use><path d="m 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,-0.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z" fill="#fff" id="ytp-id-19"></path></svg>';
const GEAR_IMAGE_SVG = (new DOMParser().parseFromString(GEAR_IMAGE_SVG_TEXT, `text/html`).getElementsByTagName(`svg`));

//The window that the captions are displayed in.
var yc_window;

//The windows that the help message is displayed in.
var yc_window_helper;

//The caption element.
var yc_caption;

//The YouCap toolbar button.
var yc_button;

//Changes a caption to the correct text.
function createCaption(text) {
    if(yc_caption != undefined) {
        yc_caption.textContent = text;
    }
}

/* A function that creates the UI for YouCap.
 * It starts by adding the YouCap button to the toolbar
 * Then wait until any advertisement is gone before creating the caption elements.
 */
function createUI(showCaptionsDefault, foundCaptions) {    
    var movie_player = document.getElementById("movie_player");
    
    //Create a sandbox for establishing a security layer between the captions and the user's browser
    var sandbox = document.createElement("iframe");
    movie_player.prepend(sandbox);
    
    //Firefox requires any dynamic iframe processing be handled after the load event is called.
    sandbox.addEventListener("load", function() {
        if(document.getElementById("yc-button") != null)
            return;
        
        sandbox.id = "yc-iframe";

        var sandbox_head = sandbox.contentDocument.head;
        var sandbox_body = sandbox.contentDocument.body;

        var stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = chrome.extension.getURL("css/youtube.css");
        sandbox_head.appendChild(stylesheet);

        //Create the control button for enabling/disabling YouCap
        yc_button = document.createElement("button");
        yc_button.id = "yc-button";
        yc_button.setAttribute("class", "ytp-button");
        yc_button.setAttribute("title", "YouCap Subtitles");
        yc_button.setAttribute("aria-label", "YouCap subtitles");
        yc_button.setAttribute("aria-pressed", showCaptionsDefault);
        if(!foundCaptions)
            yc_button.setAttribute("disabled", "");

        yc_button.addEventListener("click", function() {
            var pressed = (this.getAttribute("aria-pressed") == "false");
            this.setAttribute("aria-pressed", pressed);

            if(pressed) {
                yc_window.classList.add("show");
                showHelperWindow();
            }
            else
                yc_window.classList.remove("show");

            //Disable the default captions button when the YouCap subtitles are enabled.
            if(pressed)
                document.querySelector(".ytp-subtitles-button").setAttribute("disabled", "");
            else
                document.querySelector(".ytp-subtitles-button").removeAttribute("disabled");

            chrome.storage.sync.set({
                showCaptions: pressed
            });
        });

        {
            //The image element for the toolbar button
            var yc_button_img = document.createElement("img");
            yc_button_img.src = chrome.runtime.getURL("/icons/logo-white-128.png");
            yc_button_img.setAttribute("height", "100%");
        }

        yc_button.appendChild(yc_button_img);
        document.querySelector(".ytp-right-controls").prepend(yc_button);

        //Disable YouTube's captions if YouCap's are enabled.
        if(showCaptionsDefault)
            document.querySelector(".ytp-subtitles-button").setAttribute("disabled", "");
        else
            document.querySelector(".ytp-subtitles-button").removeAttribute("disabled");

        //Disables YouCap captions when YouTube's are enabled.
        document.querySelector(".ytp-subtitles-button").addEventListener("click", function() {
            if(this.getAttribute("aria-pressed") == "true")
                yc_button.setAttribute("disabled", "");
            else if(foundCaptions)
                yc_button.removeAttribute("disabled");
        });

        //An internal function to create the caption UI once an advertisement is no longer playing.
        var createUI_internal = function() {            
            if(observer !== null && observer !== undefined)
                observer.disconnect();

            //Delete all occurences of the script.
            var script = document.querySelectorAll("[src='" + chrome.runtime.getURL("/js/webpage.js") + "']");
            for(var i = 0; i < script.length; i++)
                script[i].parentNode.removeChild(script[i]);
            
            //Create an injected script for handling page content
            script = document.createElement("script");
            script.src = chrome.runtime.getURL("js/webpage.js");
            document.querySelector("body").appendChild(script);

            //If no captions were found, make sure captions aren't shown by default
            if(!foundCaptions)
                showCaptionsDefault = false;


            //Create the helper window
            yc_window_helper = document.createElement("div");
            yc_window_helper.id = "yc-window-helper";
            yc_window_helper.classList.add("yc-window");
            {
                //Create the help message element.
                var yc_caption_helper = document.createElement("span");
                yc_caption_helper.classList.add("yc-caption");
            }
            yc_window_helper.appendChild(yc_caption_helper);
            sandbox_body.appendChild(yc_window_helper);

            //If the captions are shown by default, the help message should automatically appear.
            if(showCaptionsDefault)
                showHelperWindow();

            //The window for displaying the captions in
            yc_window = document.createElement("div");
            yc_window.id = "yc-window";
            yc_window.classList.add("yc-window");
            if(showCaptionsDefault)
                yc_window.classList.add("show");

            //The actual caption element
            yc_caption = document.createElement("span");
            yc_caption.id = "yc-caption";
            yc_caption.classList.add("yc-caption");
            yc_caption.textContent = "";

            yc_window.appendChild(yc_caption);
            sandbox_body.appendChild(yc_window);

            movie_player.dispatchEvent(new Event("captionRestyle"));
        }

        /* If no advertisement is playing, immediately create the caption UI
         * Otherwise, wait until the advertisement stops by using a Mutation Observer.
         */
        var observer;
        if(!movie_player.classList.contains("ad-showing") && document.querySelector("yt-player-error-message-renderer") == null) {
            createUI_internal();
        } else {
            //Creates a Mutation Observer to check for when an advertisement stops playing.
            observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if(mutation.attributeName == "class"){
                        if(!mutation.target.classList.contains('ad-showing') && document.querySelector("yt-player-error-message-renderer") == null) {
                            createUI_internal();
                        }
                    }
                });
            });

            //Create the observer for the movie_player element.
            observer.observe(movie_player, {attributes: true});
        }
    });
}

//Shows the helper caption, setting the appropriate content.
function showHelperWindow() {
    chrome.storage.sync.get({
            language: "english"
        },
        function(items) {
            //Gets a pretty language name
            var lang = capitalizeFirstLetter(items.language);
        
            //Adds the content for the help message if necessary
            if(yc_window_helper.querySelector(".yc-caption").innerHTML == "") {                
                
                var appends = [
                    document.createTextNode(lang + "\nClick "),
                    GEAR_IMAGE_SVG.item(0),
                    document.createTextNode(" for settings")
                ];
                
                for(var el of appends)
                    yc_window_helper.querySelector(".yc-caption").appendChild(el);
                
                yc_window_helper.dispatchEvent(new Event("change"));
            }
        
            yc_window_helper.classList.add("show");
        
            setTimeout(function() {
                yc_window_helper.classList.remove("show");
            }, 2500);
        }
    );
}

//Capitilizes the first letter of a provided string.
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}