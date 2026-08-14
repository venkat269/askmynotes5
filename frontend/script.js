document.addEventListener("DOMContentLoaded", () => {
  // Existing element references
  const questionEl    = document.querySelector("#question");
  const askBtn        = document.querySelector("#ask-btn");
  const statusEl      = document.querySelector("#status");
  const answerSection = document.querySelector("#answer-section");
  const answerEl      = document.querySelector("#answer");
  const answerTextEl  = document.querySelector("#answer-text");
  const qtypePill     = document.querySelector("#type-pill");
  const toolPill      = document.querySelector("#tool-pill");
  const sourcesEl     = document.querySelector("#sources");
  const sourcesListEl = document.querySelector("#sources-list");

  // Upload file elements
  const pdfInput     = document.querySelector("#pdf-input");
  const filePreview  = document.querySelector("#file-preview");
  const fileCountEl  = document.querySelector("#file-count");
  const fileListEl   = document.querySelector("#file-list");
  const uploadStatus = document.querySelector("#upload-status");
  let selectedFiles = [];

  // Color mapping for question type pills
  const QTYPE_COLORS = {
    definition: "bg-blue-100 text-blue-700",
    example:    "bg-green-100 text-green-700",
    comparison: "bg-purple-100 text-purple-700",
  };

  // ── Helper: reset answer UI to hidden/empty state ─────────────────────────
  function resetAnswerUI() {
    // Hide answer section and answer box
    answerSection.classList.add("hidden");
    answerEl.classList.add("hidden");

    // Clear answer text
    answerTextEl.textContent = "";

    // Hide and clear question-type pill
    qtypePill.classList.add("hidden");
    qtypePill.textContent = "";
    qtypePill.className = "hidden";

    // Hide and clear tool pill
    toolPill.classList.add("hidden");
    toolPill.textContent = "";

    // Hide sources accordion and clear list
    if (sourcesEl) sourcesEl.classList.add("hidden");
    if (sourcesListEl) sourcesListEl.innerHTML = "";
  }

  // ── Upload handler ─────────────────────────────────────────────────────────
  pdfInput.addEventListener("change", handleUpload);

  function handleUpload() {
    const newFiles = Array.from(pdfInput.files);
    if (!newFiles.length) {
      clearFilePreview();
      return;
    }

    newFiles.forEach((file) => {
      const alreadyAdded = selectedFiles.some(
        (existing) => existing.name === file.name && existing.size === file.size && existing.type === file.type
      );
      if (!alreadyAdded) {
        selectedFiles.push(file);
      }
    });

    syncInputFiles();
    updateFileList(selectedFiles);
    uploadStatus.textContent = `Selected ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`;
    uploadStatus.className = "text-sm text-slate-500";
  }

  function updateFileList(files) {
    filePreview.classList.remove("hidden");
    fileCountEl.textContent = `${files.length} item${files.length > 1 ? "s" : ""}`;
    fileListEl.innerHTML = "";

    files.forEach((file, index) => {
      const listItem = document.createElement("li");
      listItem.className =
        "flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3";

      const nameSpan = document.createElement("span");
      nameSpan.className = "text-sm text-slate-700 truncate";
      nameSpan.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className =
        "text-slate-500 hover:text-slate-900 font-semibold rounded-full px-2 py-1 transition-all duration-200";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => removeFile(index));

      listItem.append(nameSpan, removeBtn);
      fileListEl.appendChild(listItem);
    });
  }

  function removeFile(removeIndex) {
    selectedFiles = selectedFiles.filter((_, index) => index !== removeIndex);
    syncInputFiles();

    if (selectedFiles.length) {
      updateFileList(selectedFiles);
      uploadStatus.textContent = `Selected ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`;
    } else {
      clearFilePreview();
    }
  }

  function syncInputFiles() {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    pdfInput.files = dataTransfer.files;
  }

  function clearFilePreview() {
    selectedFiles = [];
    pdfInput.value = "";
    filePreview.classList.add("hidden");
    fileListEl.innerHTML = "";
    fileCountEl.textContent = "";
    uploadStatus.textContent = "No file uploaded yet.";
    uploadStatus.className = "text-sm text-slate-500 mt-3 font-medium";
  }

  // ── Submit handler ─────────────────────────────────────────────────────────
  askBtn.addEventListener("click", () => {

    // Step 1 — Read and validate input
    const rawValue = questionEl.value;
    const question = rawValue.trim();

    if (!question) {
      statusEl.textContent = "Please type a question first.";
      statusEl.className   = "text-sm text-red-500 mt-2 min-h-[1.25rem]";
      resetAnswerUI();
      return;
    }

    // Step 2 — Show loading state
    resetAnswerUI();
    statusEl.textContent = "Thinking...";
    statusEl.className   = "text-sm text-gray-500 mt-2 min-h-[1.25rem]";
    askBtn.dataset.originalText = askBtn.innerHTML;
    askBtn.disabled = true;

    askBtn.innerHTML = `
                          <svg class="animate-spin h-5 w-5 mr-2 text-white inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24">
                              <circle
                                  class="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  stroke-width="4">
                              </circle>
                              <path
                                  class="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
                              </path>
                          </svg>
                          Loading...
                        `;

    // Step 3 — Simulate backend delay (ONE setTimeout, 600ms)
    setTimeout(() => {

      // Step 4 — Determine placeholder question type
      const lower = question.toLowerCase();
      let placeholderType;

      if (lower.startsWith("what is")) {
        placeholderType = "definition";
      } else if (
        lower.startsWith("give") ||
        lower.includes("example")
      ) {
        placeholderType = "example";
      } else if (
        lower.includes("vs") ||
        lower.includes("versus") ||
        lower.includes("compare") ||
        lower.includes("difference")
      ) {
        placeholderType = "comparison";
      } else {
        placeholderType = "definition";
      }

      // Step 5 — Determine placeholder tool
      const isArithmetic = /^[\d\s+\-*/()%.^]+$/.test(question);
      const placeholderTool = isArithmetic ? "calculator" : "search_notes";

      // Step 6 — Build placeholder answer
      const placeholderAnswer =
        `Placeholder answer for: "${question}". Real answers will appear here once the backend is connected.`;

      // Step 7 — Populate UI

      // Answer text
      answerTextEl.textContent = placeholderAnswer;

      // Question-type pill
      const typeColors = QTYPE_COLORS[placeholderType] || "bg-gray-100 text-gray-700";
      qtypePill.textContent = `type: ${placeholderType}`;
      qtypePill.className   = `inline-block rounded-full px-3 py-1 text-xs font-semibold ${typeColors}`;

      // Tool pill
      toolPill.textContent = `tool: ${placeholderTool}`;
      toolPill.classList.remove("hidden");

      // Sources list
      if (sourcesListEl) {
        sourcesListEl.innerHTML = "";

        const chunks = [
          "Sample source chunk 1 — example excerpt from the uploaded notes.",
          "Sample source chunk 2 — another excerpt.",
          "Sample source chunk 3 — final excerpt.",
        ];

        chunks.forEach((chunkText) => {
          const li = document.createElement("li");
          li.textContent = chunkText;
          sourcesListEl.appendChild(li);
        });
      }

      // Calculator path: keep sources hidden; otherwise show
      if (placeholderTool === "calculator") {
        if (sourcesEl) sourcesEl.classList.add("hidden");
      } else {
        if (sourcesEl) sourcesEl.classList.remove("hidden");
      }

      // Reveal answer section and answer box
      answerSection.classList.remove("hidden");
      answerEl.classList.remove("hidden");

      // Clear status message
      statusEl.textContent = "";
      askBtn.disabled = false;
    askBtn.innerHTML = askBtn.dataset.originalText;
    }, 2000);
  });
});
