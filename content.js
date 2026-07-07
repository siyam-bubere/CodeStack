let codeStack = [];

// 1. Generate the sidebar structure with a Header/Drag bar and Content section
const panel = document.createElement('div');
panel.id = 'jupyter-collector-panel';
panel.innerHTML = `
  <div class="panel-header" id="panel-drag-handle">
    <h3>☰ CodeStack</h3>
    <button id="collapse-panel-btn">➖ Minimize</button>
  </div>
  <div class="panel-content" id="panel-main-content">
    <div id="collected-preview">No code blocks appended yet. Click "➕ Append" on any snippet block below!</div>
    <button id="copy-all-btn" class="collector-btn">📋 Copy Combined Code</button>
    <button id="clear-panel-btn" class="collector-btn">❌ Clear Stack</button>
  </div>
`;
document.body.appendChild(panel);

const previewDiv = document.getElementById('collected-preview');
const copyBtn = document.getElementById('copy-all-btn');
const clearBtn = document.getElementById('clear-panel-btn');
const collapseBtn = document.getElementById('collapse-panel-btn');
const mainContent = document.getElementById('panel-main-content');
const dragHandle = document.getElementById('panel-drag-handle');

let isCollapsed = false;

function updatePreview() {
  if (codeStack.length === 0) {
    previewDiv.innerText = "No code blocks appended yet. Click \"➕ Append\" on any snippet block below!";
    previewDiv.style.color = "#a0aec0";
  } else {
    previewDiv.innerText = codeStack.join("\n\n# --- Next Appended Block --- \n\n");
    previewDiv.style.color = "#f7fafc";
  }
}

// 2. Collapsible Panel Logic
collapseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  isCollapsed = !isCollapsed;
  if (isCollapsed) {
    mainContent.style.display = 'none';
    panel.style.height = '35px'; // Only show the drag bar header
    panel.style.width = '150px';
    collapseBtn.innerText = '➕ Expand';
  } else {
    mainContent.style.display = 'flex';
    panel.style.height = '380px';
    panel.style.width = '280px';
    collapseBtn.innerText = '➖ Minimize';
  }
});

// 3. Movable/Draggable Logic
let isDragging = false;
let offsetX, offsetY;

dragHandle.addEventListener('mousedown', (e) => {
  isDragging = true;
  // Calculate relative cursor position inside the header
  offsetX = e.clientX - panel.getBoundingClientRect().left;
  offsetY = e.clientY - panel.getBoundingClientRect().top;
  dragHandle.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  
  // Set position variables relative to page bounds
  let newX = e.clientX - offsetX;
  let newY = e.clientY - offsetY;
  
  panel.style.left = `${newX}px`;
  panel.style.top = `${newY}px`;
  panel.style.right = 'auto';  // Break default CSS anchoring alignment
  panel.style.bottom = 'auto';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  dragHandle.style.cursor = 'move';
});

// 4. Multi-platform raw text parser
function getTargetBlockText(node) {
  const codeEditorBlock = node.querySelector('.CodeMirror-code, .cm-content, pre, code');
  if (codeEditorBlock) {
    return codeEditorBlock.innerText || codeEditorBlock.textContent || "";
  }
  const inputArea = node.querySelector('textarea');
  return inputArea ? inputArea.value : "";
}

// 5. Injector engine scanning for code elements
function injectCellButtons() {
  const selectors = '.cell, .jp-Notebook-cell, pre, .blob-wrapper';
  const blocks = document.querySelectorAll(selectors);

  blocks.forEach(block => {
    if (block.querySelector('.jupyter-append-cell-btn') || block.id === 'collected-preview' || block.closest('#jupyter-collector-panel')) return;

    const containerAnchor = block.querySelector('.cell-toolbar-wrapper, .jp-Cell-toolbar, .toolbar') || block;
    
    const appendBtn = document.createElement('button');
    appendBtn.className = 'jupyter-append-cell-btn';
    appendBtn.innerText = '➕ Append';
    appendBtn.type = 'button';

    appendBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const parsedText = getTargetBlockText(block);
      
      if (parsedText && parsedText.trim().length > 0) {
        let cleanText = parsedText.replace('➕ Append', '').replace('✅ Added!', '').trim();
        codeStack.push(cleanText);
        updatePreview();
        
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

// 6. Execution Hooks
injectCellButtons();
const webObserver = new MutationObserver(() => injectCellButtons());
webObserver.observe(document.body, { childList: true, subtree: true });

copyBtn.addEventListener('click', () => {
  if (codeStack.length === 0) return;
  const deliveryPayload = codeStack.join("\n\n");
  navigator.clipboard.writeText(deliveryPayload).then(() => {
    alert(`Success: Copied ${codeStack.length} combined code block(s)!`);
  });
});

clearBtn.addEventListener('click', () => {
  codeStack = [];
  updatePreview();
});
