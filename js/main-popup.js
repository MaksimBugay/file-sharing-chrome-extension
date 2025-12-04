document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({action: 'popup-opened'});

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });

    // Keyboard navigation for tabs
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && (e.key === '1' || e.key === '2')) {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            if (tabButtons[tabIndex]) {
                tabButtons[tabIndex].click();
            }
        }
    });

    // Refresh button functionality
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            // Find the currently active iframe
            const activePane = document.querySelector('.tab-pane.active');
            if (activePane) {
                const iframe = activePane.querySelector('iframe');
                if (iframe) {
                    // Refresh iframe by reloading its source
                    const currentSrc = iframe.src;
                    iframe.src = '';
                    setTimeout(() => {
                        iframe.src = currentSrc;
                    }, 100);
                } else {
                    window.location.reload();
                }
            }
        });
    }

    // Open in new window button functionality
    const openWindowBtn = document.getElementById('openWindowBtn');
    if (openWindowBtn) {
        openWindowBtn.addEventListener('click', function () {
            // Find the currently active iframe
            const activePane = document.querySelector('.tab-pane.active');
            if (activePane) {
                const shareFilesContainer = activePane.querySelector('#shareFilesContainer');
                if (shareFilesContainer) {
                    // Open the iframe source in a new window that fits the screen
                    chrome.windows.create({
                        url: "https://secure.fileshare.ovh/file-sharing-embedded.html",
                        type: 'popup',
                        state: 'maximized',
                        focused: true
                    });
                } else {
                    chrome.windows.create({
                        url: "https://secure.fileshare.ovh/file-transfer-embedded.html",
                        type: 'popup',
                        state: 'maximized',
                        focused: true
                    });
                }
            }
        });
    }

    const startTransferBtn = document.getElementById("startTransferBtn");
    if (startTransferBtn) {
        startTransferBtn.addEventListener('click', function () {
            chrome.windows.create({
                url: "https://secure.fileshare.ovh/file-transfer-embedded.html",
                type: 'popup',
                state: 'maximized',
                focused: true
            });
        });
    }
});