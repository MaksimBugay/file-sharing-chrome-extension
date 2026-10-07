console.log('auto-sharing.js running on', window.location.href);

//-----------------------create spinner container ----------------------------------------------------------------------
function createCenteredContainer() {
    // Create the container
    const container = document.createElement("div");
    container.id = "centeredContainer";

    // Style it
    Object.assign(container.style, {
        position: "fixed",          // fixed so it stays centered on scroll
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)", // center exactly
        minWidth: "200px",
        minHeight: "200px",
        maxWidth: "80vw",           // 80% of viewport width
        maxHeight: "80vh",          // 80% of viewport height
        width: "auto",
        height: "auto",
        //backgroundColor: "transparent",   // default bg
        //boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        zIndex: "10000",
        padding: "20px",
        overflow: "auto",           // scroll if content exceeds max
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    });

    // Append to page
    document.body.appendChild(container);

    return container;
}

const spinnerContainer = createCenteredContainer();

function showEndlessSpinner() {
    showSpinner(spinnerContainer);
}

//----------------------------------------------------------------------------------------------------------------------
//-----------------------create dialogs---------------------------------------------------------------------------------

function createErrorDialog() {
    const errorDialog = document.createElement("div");
    errorDialog.id = "errorDialog";
    errorDialog.className = "consent-dialog";

    errorDialog.innerHTML = `
  <div class="error-content">
    <div class="error-caption">
      <div class="dialog-title">Error</div>
      <div class="close-btn-container">
        <span id="closeErrorBtn" class="close-btn">&times;</span>
      </div>
    </div>
    <div class="error-text centered-container">
      <p id="errorMsg" class="message-text"></p>
    </div>
  </div>
`;

    document.body.appendChild(errorDialog);

    return errorDialog;
}

function createInfoDialog() {
    const dialog = document.createElement("div");
    dialog.id = "infoDialog";
    dialog.className = "consent-dialog";

    dialog.innerHTML = `
    <div class="info-content">
      <div class="info-caption">
        <div class="dialog-title">Info</div>
        <div class="close-btn-container">
          <span id="closeInfoBtn" class="close-btn" style="color: darkblue">&times;</span>
        </div>
      </div>
      <div id="qrcode" class="centered-container"></div>
      <p id="infoMsg" class="message-text"></p>
    </div>
  `;

    document.body.appendChild(dialog);

    return dialog;
}

const errorDialog = createErrorDialog();
const infoDialog = createInfoDialog();

const infoMsg = document.getElementById("infoMsg");
const closeInfoBtn = document.getElementById("closeInfoBtn");

function showInfoDialog() {
    infoDialog.classList.add('visible');
}

function closeInfoDialog() {
    infoDialog.classList.remove('visible');
}

closeInfoBtn.addEventListener('click', function () {
    closeInfoDialog();
});

function showInfoMsg(msg) {
    infoMsg.textContent = msg;
    showInfoDialog();
}

//----------------------------------------------------------------------------------------------------------------------

const ProcessingMode = Object.freeze({
    INSERT_DOWNLOAD_URL: "INSERT_DOWNLOAD_URL",
    PUBLISH_REMOTE_STREAM: "PUBLISH_REMOTE_STREAM"
});

const AutoSharingContext = {}

AutoSharingContext.processingMode = null;

const pageId = uuid.v4().toString();

let lastClickedElement = null;

document.addEventListener("contextmenu", (event) => {
    updateLastClickedElement(event.target);
});

document.addEventListener("focusin", event => {
    console.log("focused:", event.target);
    updateLastClickedElement(event.target);
});

function updateLastClickedElement(candidate) {
    if (candidate === lastClickedElement) {
        return;
    }
    let isEditableInput = false;
    if (candidate.tagName === "INPUT" && (candidate.type === "text" || candidate.type === "url")) {
        isEditableInput = true; // Append text
    } else if (candidate.tagName === "TEXTAREA") {
        isEditableInput = true; // textarea
    } else if (candidate.isContentEditable) {
        isEditableInput = true;
    }

    if (isEditableInput) {
        lastClickedElement = candidate
    }
}

chrome.runtime.onMessage.addListener(async function (request) {
    if (AutoSharingContext.processingMode) {
        alert("File sharing processor is busy at the moment, please try later");
        return;
    }
    if (request.message === "insertDownloadUrl") {
        AutoSharingContext.processingMode = ProcessingMode.INSERT_DOWNLOAD_URL;
        const w = screen.availWidth;
        const h = screen.availHeight;
        const features = `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${w},height=${h},left=0,top=0`;

        if (lastClickedElement) {
            if (!PushcaClient.isOpen()) {
                await openWsConnection();
            }
            window.open(
                `https://secure.fileshare.ovh/file-sharing-embedded.html?page-id=${pageId}`,
                "_blank",
                features
            );
        } else {
            window.open(
                `https://secure.fileshare.ovh/file-sharing-embedded.html`,
                "_blank",
                features
            );
        }
    } else if (request.message === "startFileTransfer") {
        const w = screen.availWidth;
        const h = screen.availHeight;
        const features = `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${w},height=${h},left=0,top=0`;
        window.open(
            `https://secure.fileshare.ovh/file-transfer-embedded.html`,
            "_blank",
            features
        );
    } else if (request.message === 'publishRemoteStream') {
        showInfoMsg("Publish remote stream request processing was started. Please wait for the new Tab");
        delay(3000).then(
            () => closeInfoDialog()
        );
        window.showEndlessSpinner();
        try {
            AutoSharingContext.processingMode = ProcessingMode.PUBLISH_REMOTE_STREAM;
            if (!PushcaClient.isOpen()) {
                await openWsConnection();
            }
            const publicUrl = await sendDownloadRemoteStreamRequestToBinaryProxy(
                window.location.href,
                false,
                currentTimestampPlusDays(1)
            );
            window.open(
                publicUrl,
                "_blank"
            );
            PushcaClient.stopWebSocketPermanently();
        } finally {
            hideSpinner();
            AutoSharingContext.processingMode = null;
        }
    }
});

function currentTimestampPlusDays(n) {
    const now = Date.now(); // milliseconds
    const msInDay = 24 * 60 * 60 * 1000;
    return Math.floor((now + n * msInDay) / 1000);
}

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
    if (AutoSharingContext.processingMode === ProcessingMode.INSERT_DOWNLOAD_URL) {
        if (data.startsWith("https://secure.fileshare.ovh")) {
            try {
                appendTextToInput(` ${data}`);
                await PushcaClient.stopWebSocketPermanently();
            } finally {
                AutoSharingContext.processingMode = null;
            }
        }
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