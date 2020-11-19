//The base URL on the YouCap website for creating captions.
const CREATE_CAPTION_URL = "https://youcap.video/pages/create";

//The URI for the language information JSON file
const LANGUAGE_URI = "https://raw.githubusercontent.com/YouCap/YouCap-Website/main/backend/youcap-info.json";

//A regex for identifying valid YouTube URLs.
const URL_REGEX = /^http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\=]*)?$/gm;

//All select lists in the popup (currently only 1)
var selects = document.querySelectorAll("button.select");

//Downloads the available languages from the website
async function downloadLanguages() {
    //Get the JSON data from the site.
    const response = await fetch(LANGUAGE_URI);
    const data = await response.json();
    
    //Loop through each language and create a menu item for it.
    data.languages.forEach(obj => {
        //Create a menu item for each language
        var el = document.createElement("div");
        el.setAttribute("value", obj.name.toLocaleLowerCase());
        
        //Create a paragraph element
        var p = document.createElement("p");
        
        //Append things together
        p.appendChild(document.createTextNode(obj.name));
        el.appendChild(p);
        document.querySelector("button[name=vid-lang] > div").appendChild(el);
    });
}

//Initializes the selection menu.
async function initSelectMenus(language) {
    //Make sure all of the languages are downloaded.
    await downloadLanguages();
    
    //For each list
    for(var i = 0; i < selects.length; i++) {
        //Add an event listener to the button to make it open a dropdown.
        selects[i].addEventListener("click", function() {
            //When clicked, toggle the class and set the bottom margin
            if(!this.classList.contains("opened")) {
                this.classList.add("opened");        
                this.style.marginBottom = (this.querySelector("div").offsetHeight + 10) + "px";
            } else
                //Deselect when closing
                this.dispatchEvent(new Event("blur"));
        });
        //Blurring resets the dropdown menu
        selects[i].addEventListener("blur", function() {
            this.classList.remove("opened");

            this.style.marginBottom = "10px";
        });

        //Loop through each option
        var options = selects[i].querySelectorAll("div div");
        for(var j = 0; j < options.length; j++) {
            //Set the dropdown menu to have a value matching the current selection
            if(selects[i].classList.contains("language") && options[j].getAttribute("value") == language) {
                options[j].classList.add("selected");
                selects[i].querySelector("p").textContent = options[j].textContent;
            }

            //If an option is selected, change the current value.
            options[j].addEventListener("click", function(event) {
                event.stopPropagation();
                
                for(var k = 0; k < options.length; k++)
                    options[k].classList.remove("selected");

                var select = this.parentNode.parentNode;
                select.dispatchEvent(new Event("blur"));
                this.classList.add("selected");

                select.querySelector("p").textContent = this.textContent;

                chrome.storage.sync.set({
                    language: this.getAttribute("value")
                });
            })
        }
    }
}

chrome.storage.sync.get({
        language: "english"
    },
    function(items) {
        //Initialize the select menu with the current language
        initSelectMenus(items.language);
    
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            //Get the current URL
            let url = tabs[0].url;
            
            //Find the YouTube video ID
            var match = new RegExp(URL_REGEX).exec(url);
            
            //Make the caption button open the create site.
            document.querySelector("button.caption-button").addEventListener("click", function() { 
                window.open(CREATE_CAPTION_URL + "?vidId=" + match[1], "_blank");
            });
        });
    }
);

//Returns the page offset of an element.
function offset(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return { 
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft
    }
} //Credit: https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/