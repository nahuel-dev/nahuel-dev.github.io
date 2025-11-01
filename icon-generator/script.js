const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const previewGrid = document.getElementById('previewGrid');
const downloadAllBtn = document.getElementById('downloadAllBtn');

const sizes = [16, 19, 32, 48, 128];
let generatedIcons = [];

// Click to select file
selectFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropZone.addEventListener('click', (e) => {
    if (e.target === selectFileBtn || e.target.closest('#selectFileBtn')) {
        return;
    }
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
});

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    if (e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Handle file
async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file (PNG, JPG, SVG, etc.)');
        return;
    }

    try {
        dropZone.style.display = 'none';
        errorMessage.style.display = 'none';
        
        await generateIcons(file);
        
        successMessage.style.display = 'block';
    } catch (error) {
        console.error('Error generating icons:', error);
        showError('Failed to generate icons. Please try again.');
    }
}

// Generate icons
async function generateIcons(file) {
    generatedIcons = [];
    previewGrid.innerHTML = '';

    const img = new Image();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = (e) => {
            img.onload = async () => {
                try {
                    for (const size of sizes) {
                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');

                        // Draw image with high quality
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, size, size);

                        // Convert to blob
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                        const url = URL.createObjectURL(blob);

                        generatedIcons.push({
                            size: size,
                            blob: blob,
                            url: url,
                            filename: `icon-${size}x${size}.png`
                        });

                        // Create preview
                        const previewItem = document.createElement('div');
                        previewItem.className = 'preview-item';
                        previewItem.innerHTML = `
                            <img src="${url}" alt="${size}x${size}">
                            <h4>${size}x${size}</h4>
                            <p>${(blob.size / 1024).toFixed(2)} KB</p>
                            <button class="download-btn" onclick="downloadIcon(${generatedIcons.length - 1})">Download</button>
                        `;
                        previewGrid.appendChild(previewItem);
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Download single icon
window.downloadIcon = function(index) {
    const icon = generatedIcons[index];
    const a = document.createElement('a');
    a.href = icon.url;
    a.download = icon.filename;
    a.click();
};

// Download all icons as ZIP
downloadAllBtn.addEventListener('click', async () => {
    const zip = new JSZip();
    
    for (const icon of generatedIcons) {
        zip.file(icon.filename, icon.blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firefox-extension-icons.zip';
    a.click();
    URL.revokeObjectURL(url);
});

// Show error
function showError(message) {
    errorText.textContent = message;
    dropZone.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'block';

    setTimeout(() => {
        resetForm();
    }, 3000);
}

// Reset form
function resetForm() {
    fileInput.value = '';
    dropZone.style.display = 'block';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    generatedIcons = [];
    previewGrid.innerHTML = '';
}
