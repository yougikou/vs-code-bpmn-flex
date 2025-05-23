// src/client/sidebar/sidebar.js

export default class Sidebar {
  constructor(options) {
    this.container = options.container || document.body;
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
      <!-- Sidebar content will go here -->
    </div>
  </div>
</div>
`;
    this.container.insertAdjacentHTML('afterbegin', sidebarHTML);

    this.sidebar = document.getElementById('sidebar');
    this.sidebarToggle = document.getElementById('sidebar-toggle');
    this.sidebarExpand = document.getElementById('sidebar-expand');
    this.sidebarMinimize = document.getElementById('sidebar-minimize');

    // Set initial state to collapsed
    this.sidebar.classList.add('collapsed');
    this.sidebarToggle.textContent = '←'; // Update toggle arrow for collapsed state

    this.sidebarToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('collapsed');
      this.sidebarToggle.textContent = this.sidebar.classList.contains('collapsed') ? '←' : '→';
    });

    this.sidebarExpand.addEventListener('click', () => {
      this.sidebar.classList.add('expanded');
    });

    this.sidebarMinimize.addEventListener('click', () => {
      this.sidebar.classList.remove('expanded');
    });
  }
}
