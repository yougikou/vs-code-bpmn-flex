// src/client/sidebar/sidebar.js

export default class Sidebar {
  constructor(options, translateFn) {
    this.container = options.container || document.body;
    this.translate = translateFn || ((key) => `${key}`); // Basic fallback for translateFn
    this.isDisplayingDefaultMessage = false; // Track if default message is shown
  }

  init() {
    const sidebarHTML = `
<div id="editor-container">
  <div id="canvas"></div>
  <div id="sidebar">
    <div id="sidebar-toggle">→</div>
    <div id="sidebar-expand">[+]</div>
    <div id="sidebar-minimize">[-]</div>
    <div id="sidebar-content">
      <div id="custom-properties-content">
        <!-- Initial content will be set by showDefaultSelectionMessage -->
      </div>
      <!-- Other sidebar content could potentially go here or above -->
    </div>
  </div>
</div>
`;
    this.container.insertAdjacentHTML('afterbegin', sidebarHTML);

    this.sidebar = document.getElementById('sidebar');
    this.sidebarToggle = document.getElementById('sidebar-toggle');
    this.sidebarExpand = document.getElementById('sidebar-expand');
    this.sidebarMinimize = document.getElementById('sidebar-minimize');
    this.customPropertiesContent = document.getElementById('custom-properties-content');
    this.sidebarContent = document.getElementById('sidebar-content');

    // Set initial state
    this.showDefaultSelectionMessage(); // Set initial message
    this.sidebar.classList.add('collapsed');
    this.sidebarContent.classList.add('content-hidden');
    this.sidebarToggle.textContent = '←';

    this.sidebarToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('collapsed');
      if (this.sidebar.classList.contains('collapsed')) {
        this.sidebarContent.classList.add('content-hidden');
        this.sidebarToggle.textContent = '←';
      } else {
        this.sidebarContent.classList.remove('content-hidden');
        this.sidebarToggle.textContent = '→';
      }
    });

    this.sidebarExpand.addEventListener('click', () => {
      this.sidebar.classList.add('expanded');
    });

    this.sidebarMinimize.addEventListener('click', () => {
      this.sidebar.classList.remove('expanded');
    });
  }

  showDefaultSelectionMessage() {
    if (this.customPropertiesContent) {
      const message = this.translate('selectElementPrompt') || 'Select a BPMN element to see its configured properties.'; // Fallback
      this.customPropertiesContent.innerHTML = `<p>${message}</p>`;
      this.isDisplayingDefaultMessage = true;
    }
  }

  updateCustomProperties(htmlContent) {
    if (this.customPropertiesContent) {
      this.customPropertiesContent.innerHTML = htmlContent;
      this.isDisplayingDefaultMessage = false; // When custom props are shown, it's not the default message
    }
  }
}
