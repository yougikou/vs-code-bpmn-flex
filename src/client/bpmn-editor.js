/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-editor.css';
import './sidebar/sidebar.css';

import Sidebar from './sidebar/sidebar.js';
import { extractProperties } from './customPropsExtractor.js';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import BpmnColorPickerModule from 'bpmn-js-color-picker';
import customTranslate, { setLanguage } from './i18n/customTranslate';

import { handleMacOsKeyboard } from './utils/macos-keyboard';

/**
 * @type { import('vscode') }
 */
const vscode = acquireVsCodeApi();

handleMacOsKeyboard();

// Initialize sidebar
const sidebarInstance = new Sidebar({ container: document.body });
sidebarInstance.init();

let customPropertiesConfig = {}; // Initialize with a default

const customTranslateModule = {
  translate: [ 'value', customTranslate ]
};

const languageSelectorHTML = `
<div id="language-selector">
  <select id="language-select">
    <option value="ja">日本語</option>
    <option value="zh">中文</option>
    <option value="en">English</option>
  </select>
</div>
`;

document.body.insertAdjacentHTML('afterbegin', languageSelectorHTML);

// 语言切换事件
document.getElementById('language-select').addEventListener('change', async (e) => {
  setLanguage(e.target.value);

  // 保存当前内容并重建Modeler以完全刷新界面
  const { xml } = await modeler.saveXML({ format: true });

  // 销毁旧Modeler
  modeler.destroy();

  // 创建新Modeler实例
  const newModeler = new BpmnModeler({
    container: '#canvas',
    additionalModules: [
      BpmnColorPickerModule,
      customTranslateModule
    ]
  });

  // 重新导入之前的内容
  await newModeler.importXML(xml);

  // 更新modeler引用
  modeler = newModeler;
});

let modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    BpmnColorPickerModule,
    customTranslateModule
  ]
});

modeler.on('import.done', event => {
  return vscode.postMessage({
    type: 'import',
    error: event.error?.message,
    warnings: event.warnings.map(warning => warning.message),
    idx: -1
  });
});

modeler.on('commandStack.changed', () => {

  /**
   * @type { import('diagram-js/lib/command/CommandStack').default }
   */
  const commandStack = modeler.get('commandStack');

  return vscode.postMessage({
    type: 'change',
    idx: commandStack._stackIdx
  });
});

modeler.on('canvas.focus.changed', (event) => {
  return vscode.postMessage({
    type: 'canvas-focus-change',
    value: event.focused
  });
});

modeler.on('selection.changed', function(event) {
  const newSelection = event.newSelection;

  if (newSelection && newSelection.length === 1) {
    const selectedElement = newSelection[0];
    const props = extractProperties(selectedElement, customPropertiesConfig);

    if (props && props.length > 0) {
      let htmlContent = '<ul>';
      for (const prop of props) {

        // Basic HTML escaping
        const displayLabel = String(prop.label).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const displayValue = String(prop.value).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        htmlContent += `<li><b>${displayLabel}:</b> ${displayValue}</li>`;
      }
      htmlContent += '</ul>';
      sidebarInstance.updateCustomProperties(htmlContent);
    } else {

      // Display basic info and a message if no custom props or error
      const elementId = String(selectedElement.id).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const elementType = String(selectedElement.type).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      sidebarInstance.updateCustomProperties(`
        <p><b>ID:</b> ${elementId}</p>
        <p><b>Type:</b> ${elementType}</p>
        <p>No configured custom properties found for this element, or an error occurred during extraction.</p>
      `);
    }
  } else {
    sidebarInstance.updateCustomProperties(
      '<p>Select a BPMN element to see its configured properties.</p>'
    );
  }
});


// handle messages from the extension
window.addEventListener('message', async (event) => {

  const {
    type,
    body,
    requestId
  } = event.data;

  switch (type) {
  case 'init':
    if (!body.content) {
      return modeler.createDiagram();
    } else {
      return modeler.importXML(body.content);
    }

  case 'update': {
    if (body.content) {
      return modeler.importXML(body.content);
    }

    if (body.undo) {
      return modeler.get('commandStack').undo();
    }

    if (body.redo) {
      return modeler.get('commandStack').redo();
    }

    break;
  }

  case 'getText':
    return modeler.saveXML({ format: true }).then(({ xml }) => {
      return vscode.postMessage({
        type: 'response',
        requestId,
        body: xml
      });
    });

  case 'focusCanvas':
    modeler.get('canvas').focus();
    return;
  case 'customConfig': // Handler for receiving custom properties configuration
    customPropertiesConfig = event.data.body || {};
    console.log('Custom properties configuration received:', customPropertiesConfig);

    // Optionally, trigger an update if an element is already selected
    // This could be done by manually invoking a selection check or letting the next selection event handle it.
    // For now, we'll rely on the next selection event.
    return;
  }
});

// Create download button elements
const downloadButtonContainer = document.createElement('div');
const downloadButton = document.createElement('button');
// const dropdownMenu = document.createElement('div'); // No longer needed
const exportSvgLink = document.createElement('a'); // Still defined but not used in DOM
// const exportExcelLink = document.createElement('a'); // Removed

// Style and configure download button elements
downloadButtonContainer.id = 'download-button-container';
downloadButton.id = 'download-button';
// downloadButton.textContent = 'Download'; // Will be set to "Download SVG"
// dropdownMenu.id = 'download-dropdown-menu'; // No longer needed
// dropdownMenu.style.display = 'none'; // No longer needed

exportSvgLink.id = 'export-svg-link'; // Still defined but not used in DOM
exportSvgLink.textContent = 'Export as SVG'; // Still defined but not used in DOM
exportSvgLink.href = '#'; // Still defined but not used in DOM
// exportExcelLink related definitions are removed by removing the whole block of Excel code.

// Store the SVG export function
const svgExportFunction = async (event) => {
  event.preventDefault(); // Prevent default link behavior
  try {
    const { svg } = await modeler.saveSVG();
    triggerDownload('diagram.svg', svg, 'image/svg+xml');
  } catch (err) {
    console.error('Error exporting SVG:', err);
    alert('Error exporting SVG: ' + err.message);
  }
};

// Change downloadButton to be a direct SVG export button
downloadButton.textContent = 'Download SVG';
// Remove old dropdown toggle listener by cloning the button
const newDownloadButton = downloadButton.cloneNode(true);
// Replace the old button with the new one in the DOM.
// We need to ensure downloadButton.parentNode exists.
// It will exist if downloadButton was already part of downloadButtonContainer,
// but downloadButtonContainer is appended to document.body later.
// For now, this relies on the structure where downloadButton is created,
// then newDownloadButton is made from it, and then newDownloadButton is appended.
if (downloadButton.parentNode) {
    downloadButton.parentNode.replaceChild(newDownloadButton, downloadButton);
}
newDownloadButton.addEventListener('click', svgExportFunction);


// Helper function to trigger file download
function triggerDownload(filename, data, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// The event listener for SVG export is now directly on newDownloadButton.
// exportSvgLink is no longer used in the main DOM.

// All Excel related functions (exportDiagramAsCsv, svgElementToPngDataUri, 
// Excel constants, and Excel event listeners) are removed by deleting the large block.


// Append elements
// dropdownMenu.appendChild(exportSvgLink); // No longer needed
// dropdownMenu.appendChild(exportExcelLink); // Removed
downloadButtonContainer.appendChild(newDownloadButton); // Add the new button with updated listener
// downloadButtonContainer.appendChild(dropdownMenu); // Dropdown menu is no longer added
document.body.appendChild(downloadButtonContainer);

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
