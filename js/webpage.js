//MutationObserver for all but webkit-based browsers
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

//Get the movie player
var movie_player = document.getElementById("movie_player");

var sandbox_doc = document.getElementById("yc-iframe").contentDocument;

//Font Family setting map
const FONT_FAMILIES = [
    "'Courier New', Courier, 'Nimbus Mono L', 'Cutive Mono', monospace",
    "'Times New Roman', Times, Georgia, Cambria, 'PT Serif Caption', serif",
    "'Deja Vu Sans Mono', 'Lucida Console', Monaco, Consolas, 'PT Mono', monospace",
    "'YouTube Noto', Roboto, 'Arial Unicode Ms', Arial, Helvetica, Verdana, 'PT Sans Caption', sans-serif",
    "'Comic Sans MS', Impact, Handlee, fantasy",
    "'Monotype Corsiva', 'URW Chancery L', 'Apple Chancery', 'Dancing Script', cursive",
    "'Arial Unicode Ms', Arial, Helvetica, Verdana, 'Marcellus SC', sans-serif; font-variant: small-caps",
];

//Char edge style setting map
CHAR_EDGE_STYLES = [
    "text-shadow: rgb(34, 34, 34) 1px 1px 1.5px, rgb(34, 34, 34) 1px 1px 2px, rgb(34, 34, 34) 1px 1px 2.5px;",
    "text-shadow: rgb(34, 34, 34) 1px 1px;",
    "text-shadow: rgb(204, 204, 204) 1px 1px, rgb(34, 34, 34) -1px -1px;",
    "text-shadow: rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px;",
];

//Multipliers for font size changes relative to the video container size.
FONT_MULTS = [1 / 45, 1 / 30, 1 / 22.5, 1 / 18, 1 / 15, 1 / 12.85, 1 / 11.25];

//Updates the caption style when settings are changed or when the window's resized.
function updateCaptionStyle() {    
    if(observer !== null && observer !== undefined)
        observer.disconnect();

    var settings = movie_player.getSubtitlesUserSettings();
        
    var captionStyle =
        "background-color: " +
        hexToRgbA(settings.background, settings.backgroundOpacity) +
        ";color: " +
        hexToRgbA(settings.color, settings.textOpacity) +
        ";font-family: " +
        FONT_FAMILIES[settings.fontFamily - 1] +
        ";" +
        CHAR_EDGE_STYLES[settings.charEdgeStyle] +
        "font-size:" +
        document.getElementById("player-container").offsetHeight * FONT_MULTS[settings.fontSizeIncrement + 2] +
        "px;";

    var windowStyle = "background-color: " + hexToRgbA(settings.windowColor, settings.windowOpacity);
    
    var helperSVGDim = (document.getElementById("player-container").offsetHeight * FONT_MULTS[settings.fontSizeIncrement + 2] + 2) + "px";
    
    //Set styles for all elements
    sandbox_doc.getElementById("yc-caption").setAttribute("style", captionStyle);
    sandbox_doc.getElementById("yc-window").setAttribute("style", windowStyle);
    
    var window_helper = sandbox_doc.getElementById("yc-window-helper");
        
    window_helper.setAttribute("style", windowStyle);
    window_helper.querySelector(".yc-caption").setAttribute("style", captionStyle);

    if(window_helper.querySelector(".yc-caption").innerHTML != "") {
        window_helper.querySelector("svg").setAttribute("height", helperSVGDim);
        window_helper.querySelector("svg").setAttribute("width", helperSVGDim);
        window_helper.querySelector("path").setAttribute("fill", hexToRgbA(settings.color, settings.textOpacity));
    }
}

//Convert a hex color to rgba, including the provided opacity as the alpha value.
//Credit: https://stackoverflow.com/a/21648508/9146863
function hexToRgbA(hex, opacity) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex))
        return 3 == (c = hex.substring(1).split("")).length && (c = [c[0], c[0], c[1], c[1], c[2], c[2]]), "rgba(" + [((c = "0x" + c.join("")) >> 16) & 255, (c >> 8) & 255, 255 & c].join(",") + "," + opacity + ")";
    throw new Error("Bad Hex");
}

//Create a MutationObserver that restyles the captions after they're first created.
var observer = new MutationObserver(function(mutations) {
    if(document.getElementById("yc-iframe") != null) {
        updateCaptionStyle();
    }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

//If settings are changed or window resized, restyle captions.
document.addEventListener("click", function (e) {
    e.target.matches("div.ytp-menuitem-label") && updateCaptionStyle();
});

window.addEventListener("resize", updateCaptionStyle);