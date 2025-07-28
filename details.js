if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
}

function parseResumeText(text) {
    const resume = {};
    const lines = text.split('\n').filter(line => line.trim().length > 0); // Split and remove empty lines

    let currentSection = null;
    let currentContent = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();

        // Heuristic for detecting a heading: ALL CAPS and relatively short.
        const isHeading = /^[A-Z\s&-\/]+$/.test(trimmedLine) && trimmedLine.length < 50 && isNaN(trimmedLine);

        if (isHeading) {
            // If we were in a previous section, save its content.
            if (currentSection) {
                // Convert the key to snake_case for consistency
                const sectionKey = currentSection.toLowerCase().replace(/[\s&]+/g, '_').replace(/_+/g, '_').replace(/[()]/g, '');
                resume[sectionKey] = currentContent.join('\n').trim();
            }

            // Start a new section
            currentSection = trimmedLine;
            currentContent = [];
        } else {
            // This line is content for the current section
            if (currentSection) {
                currentContent.push(trimmedLine);
            }
        }
    });

    // Don't forget to save the last section
    if (currentSection) {
        const sectionKey = currentSection.toLowerCase().replace(/[\s&]+/g, '_').replace(/_+/g, '_').replace(/[()]/g, '');
        resume[sectionKey] = currentContent.join('\n').trim();
    }

    return resume;
}


document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const experience = document.getElementById('experience').value.trim();
    const resumeFile = document.getElementById('resume').files[0];
    const statusDiv = document.getElementById('status');
    const resumeStatus = document.getElementById('resumeStatus');

    if (!resumeFile || resumeFile.type !== 'application/pdf') {
        statusDiv.textContent = "Please upload a valid PDF file.";
        return;
    }

    resumeStatus.textContent = "Extracting text from PDF...";

    try {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            const items = content.items.sort((a, b) => {
                if (a.transform[5] > b.transform[5]) return -1;
                if (a.transform[5] < b.transform[5]) return 1;
                if (a.transform[4] < b.transform[4]) return -1;
                if (a.transform[4] > b.transform[4]) return 1;
                return 0;
            });

            let lastY = -1;
            let line = '';
            for (const item of items) {
                const currentY = item.transform[5];
                if (lastY !== -1 && Math.abs(currentY - lastY) > 2) { // Tighter tolerance
                    fullText += line.trim() + '\n';
                    line = '';
                }
                line += item.str + ' ';
                lastY = currentY;
            }
            fullText += line.trim() + '\n';
        }
        resumeStatus.textContent = "PDF text extracted.";

        const resumeData = parseResumeText(fullText);
        const knowledgeBase = { name, email, phone, experience, resume: resumeData };

        chrome.storage.local.set({ knowledgeBase }, () => {
            statusDiv.textContent = "Details saved! You can now download your knowledge base from the popup.";
        });
    } catch (err) {
        resumeStatus.textContent = "Failed to extract PDF text.";
        statusDiv.textContent = err.message;
    }
});
