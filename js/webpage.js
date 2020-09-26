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
    var settings = document.getElementById("movie_player").getSubtitlesUserSettings();
    
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
    document.getElementById("yc-caption").setAttribute("style", captionStyle);
    document.getElementById("yc-window").setAttribute("style", windowStyle);
    document.getElementById("yc-window-helper").setAttribute("style", windowStyle);
    document.getElementById("yc-window-helper").querySelector(".yc-caption").setAttribute("style", captionStyle);
    
    if(document.getElementById("yc-window-helper").querySelector(".yc-caption").innerHTML != "") {
        document.getElementById("yc-window-helper").querySelector("svg").setAttribute("height", helperSVGDim);
        document.getElementById("yc-window-helper").querySelector("svg").setAttribute("width", helperSVGDim);
        document.getElementById("yc-window-helper").querySelector("path").setAttribute("fill", hexToRgbA(settings.color, settings.textOpacity));
    }
}

//Convert a hex color to rgba, including the provided opacity as the alpha value.
function hexToRgbA(hex, opacity) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex))
        return 3 == (c = hex.substring(1).split("")).length && (c = [c[0], c[0], c[1], c[1], c[2], c[2]]), "rgba(" + [((c = "0x" + c.join("")) >> 16) & 255, (c >> 8) & 255, 255 & c].join(",") + "," + opacity + ")";
    throw new Error("Bad Hex");
}

//Set all of the caption's styling at the beginning
updateCaptionStyle();

//If settings are changed or window resized, restyle captions.
document.addEventListener("click", function (e) {
    e.target.matches("div.ytp-menuitem-label") && updateCaptionStyle();
});
window.addEventListener("resize", updateCaptionStyle);

//Also restyle the first time the helper window is displayed
document.getElementById("yc-window-helper").addEventListener("change", function() {
    updateCaptionStyle();
});

//If the document player's state changes, change values that are used for tracking the elapsed time.
document.getElementById("movie_player").addEventListener("onStateChange", function (state) {
    //The movie player element
    var el = document.getElementById("movie_player");
    
    //Played seconds represent the number of elapsed video seconds when the state changed
    el.setAttribute("data-played-seconds", el.getCurrentTime());
    //Played time represents the real-world time when the state changed
    el.setAttribute("data-played-time", new Date().getTime() / 1000);
    //Played state is true if the state was changed to the playing state (1). Otherwise, it's false
    el.setAttribute("data-played-state", state == 1);
});