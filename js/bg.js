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