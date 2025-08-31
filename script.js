<<<<<<< HEAD
const form = document.getElementById("genForm");
const previewImg = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const submitBtn = document.getElementById("submitBtn");
const results = document.getElementById("results");

const outIG = document.getElementById("outInstagram");
const outTW = document.getElementById("outTwitter");
const outLI = document.getElementById("outLinkedIn");

imageInput.addEventListener("change", () => {
  const f = imageInput.files?.[0];
  if (!f) { previewImg.style.display = "none"; return; }
  const ok = ["image/png","image/jpeg","image/webp"].includes(f.type);
  if (!ok || f.size > 5 * 1024 * 1024) {
    alert("Allowed: png/jpg/webp up to 5MB.");
    imageInput.value = "";
    previewImg.style.display = "none";
    return;
  }
  const r = new FileReader();
  r.onload = () => { previewImg.src = r.result; previewImg.style.display = "block"; };
  r.readAsDataURL(f);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true; submitBtn.textContent = "Generating…";

  const sourceText = document.getElementById("sourceText").value.trim();
  const tone = document.getElementById("tone").value;
  const outputsSel = Array.from(document.getElementById("outputs").selectedOptions).map(o => o.value);

  let imageDataUrl = null;
  if (imageInput.files?.[0]) {
    imageDataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(imageInput.files[0]);
    });
  }

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ sourceText, tone, outputs: outputsSel, imageDataUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed");

    results.classList.remove("hidden");
    outIG.innerHTML = data.instagram ? `<h3>Instagram</h3><pre>${data.instagram}</pre>` : "";
    outTW.innerHTML = data.twitter ? `<h3>Twitter/X</h3><pre>${data.twitter}</pre>` : "";
    outLI.innerHTML = data.linkedin ? `<h3>LinkedIn</h3><pre>${data.linkedin}</pre>` : "";
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = "Generate";
  }
});
=======
const form = document.getElementById("genForm");
const previewImg = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const submitBtn = document.getElementById("submitBtn");
const results = document.getElementById("results");

const outIG = document.getElementById("outInstagram");
const outTW = document.getElementById("outTwitter");
const outLI = document.getElementById("outLinkedIn");

imageInput.addEventListener("change", () => {
  const f = imageInput.files?.[0];
  if (!f) { previewImg.style.display = "none"; return; }
  const ok = ["image/png","image/jpeg","image/webp"].includes(f.type);
  if (!ok || f.size > 5 * 1024 * 1024) {
    alert("Allowed: png/jpg/webp up to 5MB.");
    imageInput.value = "";
    previewImg.style.display = "none";
    return;
  }
  const r = new FileReader();
  r.onload = () => { previewImg.src = r.result; previewImg.style.display = "block"; };
  r.readAsDataURL(f);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true; submitBtn.textContent = "Generating…";

  const sourceText = document.getElementById("sourceText").value.trim();
  const tone = document.getElementById("tone").value;
  const outputsSel = Array.from(document.getElementById("outputs").selectedOptions).map(o => o.value);

  let imageDataUrl = null;
  if (imageInput.files?.[0]) {
    imageDataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(imageInput.files[0]);
    });
  }

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ sourceText, tone, outputs: outputsSel, imageDataUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed");

    results.classList.remove("hidden");
    outIG.innerHTML = data.instagram ? `<h3>Instagram</h3><pre>${data.instagram}</pre>` : "";
    outTW.innerHTML = data.twitter ? `<h3>Twitter/X</h3><pre>${data.twitter}</pre>` : "";
    outLI.innerHTML = data.linkedin ? `<h3>LinkedIn</h3><pre>${data.linkedin}</pre>` : "";
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = "Generate";
  }
});
>>>>>>> 8018758 (first commit)
