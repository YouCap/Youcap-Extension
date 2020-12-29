chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostContains: 'youtube.com'},
            })
        ],
        actions: [
            new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
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