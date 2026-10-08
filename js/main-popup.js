document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({action: 'popup-opened'});

    const externalLinks = {
        exploreToolsBtn: 'https://secure.fileshare.ovh/',
        howToButton: 'https://secure.fileshare.ovh/videos/file-sharing-promo.webm',
        privacyButton: 'https://secure.fileshare.ovh/privacy/file-sharing-privacy.html'
    };

    Object.entries(externalLinks).forEach(([id, url]) => {
        document.getElementById(id).addEventListener('click', function () {
            chrome.tabs.create({url});
        });
    });
});
