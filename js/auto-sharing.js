console.log('auto-sharing.js running on', window.location.href);

const pageId = uuid.v4().toString();

let lastClickedElement = null;

document.addEventListener("contextmenu", (event) => {
    lastClickedElement = event.target;
});

chrome.runtime.onMessage.addListener(async function (request) {
    if (request.message === "insertDownloadUrl") {
        if (lastClickedElement) {
            if (PushcaClient.isOpen()) {
                await PushcaClient.stopWebSocket();
            }
            await openWsConnection();
            window.open(
                `https://secure.fileshare.ovh/file-sharing-embedded.html?page-id=${pageId}`,
                "_blank",
                "toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600"
            );
        }
    }
});

function insertTextAtCaret(el, text) {
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;

    // Move selection to the last clicked element
    const range = sel.getRangeAt(0);
    sel.removeAllRanges();
    sel.addRange(range);

    // Insert text
    document.execCommand("insertText", false, text);
}

function appendTextToInput(text) {
    if (!lastClickedElement) return;

    // Check if it is an <input> or <textarea>
    if (lastClickedElement.tagName === "INPUT" && (lastClickedElement.type === "text" || lastClickedElement.type === "url")) {
        lastClickedElement.value += text; // Append text
    } else if (lastClickedElement.tagName === "TEXTAREA") {
        lastClickedElement.value += text; // textarea
    } else if (lastClickedElement.isContentEditable) {
        insertTextAtCaret(lastClickedElement, text);
    } else {
        console.log("Element is not a text input, textarea, or contenteditable.");
    }
}

PushcaClient.onMessageHandler = async function (ws, data) {
    if (data.startsWith("https://secure.fileshare.ovh/public-binary-ex.html")) {
        appendTextToInput(` ${data}`);
        await PushcaClient.stopWebSocket();
    }
}

async function openWsConnection() {
    if (!PushcaClient.isOpen()) {
        const pClient = new ClientFilter(
            "SecureFileShare",
            "file-sharing-embedded",
            pageId,
            "FILE-SHARING-CHROME-EXTENSION"
        );
        await PushcaClient.openWsConnection(
            'wss://secure.fileshare.ovh:31085',
            pClient,
            function (clientObj) {
                return new ClientFilter(
                    clientObj.workSpaceId,
                    clientObj.accountId,
                    clientObj.deviceId,
                    clientObj.applicationId
                );
            },
            null
        );
    }
}