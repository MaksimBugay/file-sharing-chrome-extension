document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({action: 'popup-opened'});
    
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
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
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === '1' || e.key === '2')) {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            if (tabButtons[tabIndex]) {
                tabButtons[tabIndex].click();
            }
        }
    });
});