document.addEventListener('DOMContentLoaded', () => {
    const setDetailsBtn = document.getElementById('setDetailsBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const message = document.getElementById('message');

    setDetailsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('details.html') });
    });

    // Check if knowledge base is ready
    chrome.storage.local.get('knowledgeBase', (result) => {
        if (result.knowledgeBase) {
            downloadBtn.disabled = false;
            message.textContent = "Knowledge base is ready to download!";
        }
    });

    downloadBtn.addEventListener('click', () => {
        chrome.storage.local.get('knowledgeBase', (result) => {
            if (result.knowledgeBase) {
                const blob = new Blob([JSON.stringify(result.knowledgeBase, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                chrome.downloads.download({
                    url: url,
                    filename: 'knowledge_base.txt',
                    saveAs: true
                });
            }
        });
    });
});