chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'popup-opened') {
        sendResponse({status: '0'});  // Respond immediately
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "insertDownloadUrlMenuItem",
        title: "Fileshare: securely publish content with download links (Ctrl+Shift+S)",
        contexts: ["all"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });

    chrome.contextMenus.create({
        id: "startFileTransferMenuItem",
        title: "Fileshare: transfer your files (Ctrl+Shift+F)",
        contexts: ["all"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });
    chrome.tabs.create({
        url: "https://secure.fileshare.ovh/videos/chrome_v3_2_0_3.mp4",
        active: true
    });
});

chrome.contextMenus.onClicked.addListener(
    (info, tab) => {
        if (info.menuItemId === "insertDownloadUrlMenuItem") {
            chrome.tabs.sendMessage(tab.id, {
                message: "insertDownloadUrl"
            });
        } else if (info.menuItemId === "startFileTransferMenuItem") {
            chrome.tabs.sendMessage(tab.id, {
                message: "startFileTransfer"
            });
        }
    }
);

async function getActiveTabId() {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs.length === 0) return null;
    return tabs[0].id ?? null;
}

chrome.commands.onCommand.addListener((command) => {
    if (command === "share-files") {
        getActiveTabId().then((tabId) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    message: "insertDownloadUrl"
                });
            }
        });
    } else if (command === "transfer-files") {
        getActiveTabId().then((tabId) => {
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    message: "startFileTransfer"
                });
            }
        });
    }
});
chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
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