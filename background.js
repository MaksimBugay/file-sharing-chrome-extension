

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'popup-opened') {
        sendResponse({status: '0'});  // Respond immediately

        return false;
    }
});

