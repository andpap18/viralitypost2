const form = document.getElementById("genForm");
const source = document.getElementById("sourceText");
const imageInput = document.getElementById("imageInput");
const previewImg = document.getElementById("preview");
const outputsSel = document.getElementById("outputs");
const toneSel = document.getElementById("tone");
const btn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const results = document.getElementById("results");
const outIG = document.getElementById("outInstagram");
const outTW = document.getElementById("outTwitter");
const outLI = document.getElementById("outLinkedIn");

function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"), 1600);
}

function canGenerate(){
  return source.value.trim().length > 0 || (imageInput.files && imageInput.files.length > 0);
}
function refreshBtn(){ btn.disabled = !canGenerate(); }
source.addEventListener("input", refreshBtn);

imageInput.addEventListener("change", () => {
  const f = imageInput.files?.[0];
  if (!f) { previewImg.style.display = "none"; refreshBtn(); return; }
  const ok = ["image/png","image/jpeg","image/webp"].includes(f.type);
  if (!ok || f.size > 5 * 1024 * 1024) {
    toast("Allowed: png/jpg/webp up to 5MB."); imageInput.value = "";
    previewImg.style.display = "none"; refreshBtn(); return;
  }
  const r = new FileReader();
  r.onload = () => { previewImg.src = r.result; previewImg.style.display = "block"; };
  r.readAsDataURL(f);
  refreshBtn();
});

function copyBlock(text){
  navigator.clipboard.writeText(text || "").then(()=> toast("Copied!"));
}
function renderBlock(container, title, text){
  if(!text){ container.innerHTML=""; return; }
  container.innerHTML = `
    <div class="block">
      <div class="block-head">
        <h3>${title}</h3>
        <button class="copy-btn" type="button">Copy</button>
      </div>
      <pre>${text}</pre>
    </div>`;
  container.querySelector(".copy-btn").onclick = ()=> copyBlock(text);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!canGenerate()) { toast("Write an idea or upload an image."); return; }

  btn.classList.add("btn-loading"); btn.textContent = "Generating…"; btn.disabled = true;

  let imageDataUrl = null;
  if (imageInput.files?.[0]) {
    imageDataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(imageInput.files[0]);
    });
  }

  const outs = Array.from(outputsSel.selectedOptions).map(o => o.value);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        sourceText: source.value.trim(),
        tone: toneSel.value,
        outputs: outs,
        imageDataUrl
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }
    
    const data = await res.json();

    renderBlock(outIG, "Instagram", data.instagram);
    renderBlock(outTW, "Twitter/X", data.twitter);
    renderBlock(outLI, "LinkedIn", data.linkedin);
    results.classList.remove("hidden");
  } catch (err) {
    toast(err.message);
  } finally {
    btn.classList.remove("btn-loading"); btn.textContent = "Generate"; refreshBtn();
  }
});

resetBtn.addEventListener("click", ()=>{
  form.reset(); previewImg.src=""; previewImg.style.display="none";
  results.classList.add("hidden");
  outIG.innerHTML = outTW.innerHTML = outLI.innerHTML = "";
  refreshBtn(); toast("Cleared");
});

// init
refreshBtn();
