async function extractTextFromPDF(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
        reader.onload = async function () {
            const typedArray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
            let text = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(" ");
            }
            resolve(text);
        };
        reader.readAsArrayBuffer(file);
    });
}

async function extractTextFromDocx(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
        reader.onload = function (event) {
            mammoth.extractRawText({ arrayBuffer: event.target.result })
                .then(result => resolve(result.value))
                .catch(err => console.log(err));
        };
        reader.readAsArrayBuffer(file);
    });
}

function cleanText(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase();
}

function cosineSimilarity(text1, text2) {
    const words1 = new Set(cleanText(text1).split(" "));
    const words2 = new Set(cleanText(text2).split(" "));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    return ((intersection.size / Math.sqrt(words1.size * words2.size)) * 100).toFixed(2);
}

async function analyzeResume() {
    const fileInput = document.getElementById("resumeUpload");
    const jobDescription = document.getElementById("jobDescription").value;
    const resultElement = document.getElementById("result");

    if (!fileInput.files.length) {
        resultElement.innerText = "Please upload a resume.";
        return;
    }

    const file = fileInput.files[0];
    let resumeText = "";

    if (file.name.endsWith(".pdf")) {
        resumeText = await extractTextFromPDF(file);
    } else if (file.name.endsWith(".docx")) {
        resumeText = await extractTextFromDocx(file);
    } else {
        resultElement.innerText = "Invalid file format!";
        return;
    }

    if (resumeText && jobDescription) {
        const similarityScore = cosineSimilarity(resumeText, jobDescription);
        resultElement.innerText = `Resume Similarity Score: ${similarityScore}%`;
    } else {
        resultElement.innerText = "Could not analyze resume.";
    }
}
