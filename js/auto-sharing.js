console.log('auto-sharing.js running on', window.location.href);

const pageId = uuid.v4().toString();

PushcaClient.onMessageHandler = async function (ws, data) {
    if (data.startsWith("https://secure.fileshare.ovh/public-binary-ex.html")) {
        alert(data);
        await PushcaClient.stopWebSocket();
    }
}

PushcaClient.onOpenHandler = async function () {
    window.open(`https://secure.fileshare.ovh/file-sharing-embedded.html?page-id=${pageId}`, "_blank");
}

openWsConnection();

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