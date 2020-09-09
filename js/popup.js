const CREATE_CAPTION_URL = "https://www.youcap.com/pages/create"
const URL_REGEX = /^http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\=]*)?$/gm;

var selects = document.querySelectorAll("button.select");

function initSelectMenus(language) {
    for(var i = 0; i < selects.length; i++) {
        selects[i].addEventListener("click", function() {
            if(!this.classList.contains("opened")) {
                this.classList.add("opened");        
                this.style.marginBottom = (this.querySelector("div").offsetHeight + 10) + "px";
            } else
                this.dispatchEvent(new Event("blur"));
        });
        selects[i].addEventListener("blur", function() {
            this.classList.remove("opened");

            this.style.marginBottom = "10px";
        });

        var options = selects[i].querySelectorAll("div div");
        for(var j = 0; j < options.length; j++) {
            if(selects[i].classList.contains("language") && options[j].getAttribute("value") == language) {
                options[j].classList.add("selected");
                selects[i].querySelector("p").textContent = options[j].textContent;
            }


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
        initSelectMenus(items.language);
    
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            let url = tabs[0].url;
            var match = new RegExp(URL_REGEX).exec(url);
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