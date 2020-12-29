chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var test = new RegExp("(https|http):\\/\\/www.youtube.com\\/(?:watch|embed).*", "gm").test(tab.url);
    if (changeInfo.status === 'complete') {
        if(test) {
            chrome.pageAction.show(tabId);
        } else {
            chrome.pageAction.hide(tabId);
        }
    }
});

//Listens for when the URL is updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // read changeInfo data and do something with it
    // like send the new url to contentscripts.js
    if (changeInfo.url) {
        chrome.tabs.sendMessage(tabId, {
            message: 'yc_msg-urlChanged',
            url: changeInfo.url
        })
    }
});