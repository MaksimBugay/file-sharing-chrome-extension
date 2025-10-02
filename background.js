chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'popup-opened') {
        sendResponse({status: '0'});  // Respond immediately

        return false;
    }
});

chrome.webNavigation.onCompleted.addListener((details) => {
    if ((details.frameId === 0)) { // only top-level frames
        injectAutoSharingIntoTab(details.tabId);
    }
}, {
    url: [{schemes: ["http", "https"]}]
});

function injectAutoSharingIntoTab(tabId) {
    getTab(tabId, function (tab) {
        if (tab.url.startsWith("https://secure.fileshare.ovh/file-sharing-embedded.html")) {
            return;
        }
        chrome.scripting.executeScript(
            {
                target: {tabId: tab.id},
                files: [
                    'js/pushca.min.js'
                ]
            }
        ).then(() => {
            chrome.scripting.executeScript(
                {
                    target: {tabId: tab.id},
                    files: [
                        'js/auto-sharing.js'
                    ]
                }
            );
        });
    });
}

function getTab(tabId, callback) {
    chrome.tabs.get(tabId, function (tab) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            chrome.tabs.remove(tabId);
            return;
        }
        callback(tab);
    });
}