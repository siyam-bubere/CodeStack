// Array holding your appends in runtime memory
let codeStack = [];

// 1. Generate and render the workspace sidebar UI
const panel = document.createElement('div');
panel.id = 'jupyter-collector-panel';
panel.innerHTML = `
  <h3>Stack Code Collector</h3>
  <div id="collected-preview">No code blocks appended yet. Click "➕ Append" on any snippet block below!</div>
  <button id="copy-all-btn" class="collector-btn">📋 Copy Combined Code</button>
  <button id="clear-panel-btn" class="collector-btn">❌ Clear Stack</button>
`;
document.body.appendChild(panel);

const previewDiv = document.getElementById('collected-preview');
const copyBtn = document.getElementById('copy-all-btn');
const clearBtn = document.getElementById('clear-panel-btn');

function updatePreview() {
  if (codeStack.length === 0) {
    previewDiv.innerText = "No code blocks appended yet. Click \"➕ Append\" on any snippet block below!";
    previewDiv.style.color = "#a0aec0";
  } else {
    previewDiv.innerText = codeStack.join("\n\n# --- Next Appended Block --- \n\n");
    previewDiv.style.color = "#f7fafc";
  }
}

// 2. Generic, multi-platform raw text parser
function getTargetBlockText(node) {
  // Try platform-specific text targets (CodeMirror blocks, pre tags, or markdown displays)
  const codeEditorBlock = node.querySelector('.CodeMirror-code, .cm-content, pre, code');
  if (codeEditorBlock) {
    return codeEditorBlock.innerText || codeEditorBlock.textContent || "";
  }
  
  // Fallback structural target for interactive textareas
  const inputArea = node.querySelector('textarea');
  return inputArea ? inputArea.value : "";
}

// 3. Injector engine scanning for code elements
function injectCellButtons() {
  // Query targets: Jupyter Classic (.cell), JupyterLab (.jp-Notebook-cell), Google Colab (.cell), ChatGPT (pre), GitHub (.blob-wrapper or pre)
  const selectors = '.cell, .jp-Notebook-cell, pre, .blob-wrapper';
  const blocks = document.querySelectorAll(selectors);

  blocks.forEach(block => {
    // Skip if button is already present, or if it's our own preview window
    if (block.querySelector('.jupyter-append-cell-btn') || block.id === 'collected-preview') return;

    // Isolate appropriate nested header toolbar or fall back to the frame parent element
    const containerAnchor = block.querySelector('.cell-toolbar-wrapper, .jp-Cell-toolbar, .toolbar') || block;
    
    const appendBtn = document.createElement('button');
    appendBtn.className = 'jupyter-append-cell-btn';
    appendBtn.innerText = '➕ Append';
    appendBtn.type = 'button';

    appendBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const parsedText = getTargetBlockText(block);
      
      if (parsedText && parsedText.trim().length > 0) {
        // Strip out injected button's own text if nested inside text processing fallback loop
        let cleanText = parsedText.replace('➕ Append', '').replace('✅ Added!', '').trim();
        
        codeStack.push(cleanText);
        updatePreview();
        
        // Provide successful interaction notification on target node
        appendBtn.innerText = '✅ Added!';
        appendBtn.style.backgroundColor = '#48bb78';
        appendBtn.style.color = '#ffffff';
        setTimeout(() => {
          appendBtn.innerText = '➕ Append';
          appendBtn.style.backgroundColor = '';
          appendBtn.style.color = '';
        }, 1200);
      }
    });

    // Layout configuration rule based on structural fallback selection
    if (containerAnchor === block) {
      appendBtn.style.position = 'relative';
      appendBtn.style.float = 'right';
      appendBtn.style.zIndex = '10';
      block.insertBefore(appendBtn, block.firstChild);
    } else {
      containerAnchor.appendChild(appendBtn);
    }
  });
}

// 4. Fire on setup, then pass tracking to background observer
injectCellButtons();
const webObserver = new MutationObserver(() => injectCellButtons());
webObserver.observe(document.body, { childList: true, subtree: true });

// 5. Global Action Handlers
copyBtn.addEventListener('click', () => {
  if (codeStack.length === 0) return;
  const deliveryPayload = codeStack.join("\n\n");
  
  navigator.clipboard.writeText(deliveryPayload).then(() => {
    alert(`Success: Copied ${codeStack.length} combined code block(s) onto your main system clipboard! Ready to paste.`);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
});

clearBtn.addEventListener('click', () => {
  codeStack = [];
  updatePreview();
});