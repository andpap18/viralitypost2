// DOM Elements
const form = document.getElementById("genForm");
const source = document.getElementById("sourceText");
const imageInput = document.getElementById("imageInput");
const imageUploadArea = document.getElementById("imageUploadArea");
const previewImg = document.getElementById("previewImg");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImage");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const results = document.getElementById("results");
const toast = document.getElementById("toast");

// Debug: Check if elements exist
console.log("Image elements check:", {
    imageInput: !!imageInput,
    imageUploadArea: !!imageUploadArea,
    previewImg: !!previewImg,
    imagePreview: !!imagePreview,
    removeImageBtn: !!removeImageBtn
});

// Platform checkboxes
const platformCheckboxes = document.querySelectorAll('.platform-option input[type="checkbox"]');

// Tone selector
const toneSelect = document.getElementById("tone");

// Helper text
const helper = document.getElementById("helper");

// Toast notification function
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Get selected platforms
function getSelectedPlatforms() {
    return Array.from(platformCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
}

// Check if form can be submitted
function canGenerate() {
    const hasText = source.value.trim().length > 0;
    const hasImage = imageInput.files && imageInput.files.length > 0;
    const hasSelectedPlatforms = Array.from(platformCheckboxes).some(cb => cb.checked);
    
    return (hasText || hasImage) && hasSelectedPlatforms;
}

// Update submit button state
function updateSubmitButton() {
    const canSubmit = canGenerate();
    submitBtn.disabled = !canSubmit;
    
    if (canSubmit) {
        helper.textContent = "Ready to generate content!";
        helper.style.color = "var(--success)";
    } else {
        helper.textContent = "Write an idea or upload an image and select at least one platform.";
        helper.style.color = "var(--text-muted)";
    }
}

// Image upload handling
if (imageUploadArea && imageInput) {
    imageUploadArea.addEventListener("click", () => {
        console.log("Image upload area clicked");
        imageInput.click();
    });
} else {
    console.error("Image upload elements not found!");
}

if (imageUploadArea) {
    imageUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = "var(--primary)";
        imageUploadArea.style.background = "rgba(99, 102, 241, 0.05)";
    });

    imageUploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = "rgba(255, 255, 255, 0.2)";
        imageUploadArea.style.background = "var(--bg-input)";
    });

    imageUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = "rgba(255, 255, 255, 0.2)";
        imageUploadArea.style.background = "var(--bg-input)";
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && imageInput) {
            imageInput.files = files;
            handleImageUpload();
        }
    });
}

if (imageInput) {
    imageInput.addEventListener("change", handleImageUpload);
}

function handleImageUpload() {
    const file = imageInput.files?.[0];
    
    if (!file) {
        hideImagePreview();
        updateSubmitButton();
        return;
    }
    
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
        showToast("Please upload a PNG, JPG, or WEBP image.", "error");
        imageInput.value = "";
        hideImagePreview();
        updateSubmitButton();
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB.", "error");
        imageInput.value = "";
        hideImagePreview();
        updateSubmitButton();
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.classList.add("show");
        updateSubmitButton();
    };
    reader.readAsDataURL(file);
}

function hideImagePreview() {
    imagePreview.classList.remove("show");
    previewImg.src = "";
}

if (removeImageBtn) {
    removeImageBtn.addEventListener("click", () => {
        if (imageInput) {
            imageInput.value = "";
        }
        hideImagePreview();
        updateSubmitButton();
    });
}

// Copy to clipboard function
async function copyToClipboard(text, platform) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(`${platform} content copied to clipboard!`, "success");
    } catch (err) {
        showToast("Failed to copy content", "error");
    }
}

// Show/hide result cards based on selected platforms
function updateResultCardsVisibility() {
    const selectedPlatforms = getSelectedPlatforms();
    const allResultCards = document.querySelectorAll('.result-card');
    
    // Only proceed if we have result cards and the results section exists
    if (allResultCards.length === 0) {
        return;
    }
    
    allResultCards.forEach(card => {
        const platformValue = card.id.replace('Card', '').toLowerCase();
        const isSelected = selectedPlatforms.includes(platformValue);
        
        if (isSelected) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Render content block
function renderContentBlock(container, platform, content) {
    if (!content || content.trim() === "") {
        container.innerHTML = '<div class="result-content"></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="result-content">${content}</div>
    `;
    
    // Add copy functionality
    const copyBtn = container.closest('.result-card').querySelector('.copy-btn');
    copyBtn.onclick = () => copyToClipboard(content, platform);
}

// Form submission
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!canGenerate()) {
        showToast("Please provide an idea or image and select at least one platform.", "error");
        return;
    }
    
    // Show loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    
    try {
        // Prepare image data
        let imageDataUrl = null;
        if (imageInput.files?.[0]) {
            imageDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(imageInput.files[0]);
            });
        }
        
        // Get selected platforms
        const selectedPlatforms = Array.from(platformCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        console.log("Selected platforms:", selectedPlatforms);
        
        // Prepare request data
        const requestData = {
            sourceText: source.value.trim(),
            tone: toneSelect.value,
            outputs: selectedPlatforms,
            imageDataUrl
        };
        
        console.log("Request data:", requestData);
        
        // Make API request
        console.log("Sending request to API...");
        const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData)
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Received data:", data);
        
        // Debug: Log each platform's content
        console.log("Instagram content:", data.instagram);
        console.log("Twitter content:", data.twitter);
        console.log("LinkedIn content:", data.linkedin);
        console.log("Facebook content:", data.facebook);
        console.log("TikTok content:", data.tiktok);
        console.log("YouTube content:", data.youtube);
        console.log("Pinterest content:", data.pinterest);
        
        // Get selected platforms
        const selectedPlatforms = getSelectedPlatforms();
        
        // Render results only for selected platforms
        if (selectedPlatforms.includes('instagram')) {
            renderContentBlock(document.getElementById("outInstagram"), "Instagram", data.instagram);
        }
        if (selectedPlatforms.includes('twitter')) {
            renderContentBlock(document.getElementById("outTwitter"), "Twitter", data.twitter);
        }
        if (selectedPlatforms.includes('linkedin')) {
            renderContentBlock(document.getElementById("outLinkedIn"), "LinkedIn", data.linkedin);
        }
        if (selectedPlatforms.includes('facebook')) {
            renderContentBlock(document.getElementById("outFacebook"), "Facebook", data.facebook);
        }
        if (selectedPlatforms.includes('tiktok')) {
            renderContentBlock(document.getElementById("outTikTok"), "TikTok", data.tiktok);
        }
        if (selectedPlatforms.includes('youtube')) {
            renderContentBlock(document.getElementById("outYouTube"), "YouTube", data.youtube);
        }
        if (selectedPlatforms.includes('pinterest')) {
            renderContentBlock(document.getElementById("outPinterest"), "Pinterest", data.pinterest);
        }
        
        // Update visibility of result cards
        updateResultCardsVisibility();
        
        // Show results section
        results.classList.remove("hidden");
        results.scrollIntoView({ behavior: "smooth", block: "start" });
        
        showToast("Content generated successfully!", "success");
        
    } catch (error) {
        console.error("Generation error:", error);
        showToast(error.message || "Failed to generate content. Please try again.", "error");
    } finally {
        // Hide loading state
        submitBtn.classList.remove("loading");
        updateSubmitButton();
    }
});

// Reset form
resetBtn.addEventListener("click", () => {
    form.reset();
    hideImagePreview();
    results.classList.add("hidden");
    
    // Clear all result containers
    document.getElementById("outInstagram").innerHTML = "";
    document.getElementById("outTwitter").innerHTML = "";
    document.getElementById("outLinkedIn").innerHTML = "";
    document.getElementById("outFacebook").innerHTML = "";
    document.getElementById("outTikTok").innerHTML = "";
    document.getElementById("outYouTube").innerHTML = "";
    document.getElementById("outPinterest").innerHTML = "";
    
    updateSubmitButton();
    showToast("Form cleared", "success");
});

// Event listeners for form validation
source.addEventListener("input", updateSubmitButton);
platformCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", updateSubmitButton);
});

// Initialize
updateSubmitButton();

// Initialize result cards visibility after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    updateResultCardsVisibility();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);