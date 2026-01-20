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
      <div id="custom-properties-content">
        <p>Select a BPMN element to see its configured properties.</p>
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

  updateCustomProperties(properties, onUpdate) {
    if (!this.customPropertiesContent) {
      return;
    }

    // If string is passed (legacy/error message), render it directly
    if (typeof properties === 'string') {
      this.customPropertiesContent.innerHTML = properties;
      return;
    }

    this.customPropertiesContent.innerHTML = '';
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';

    properties.forEach((prop, _index) => {
      const item = document.createElement('li');
      item.style.marginBottom = '10px';

      const label = document.createElement('label');
      label.textContent = prop.label;
      label.style.display = 'block';
      label.style.fontWeight = 'bold';
      label.style.marginBottom = '5px';
      item.appendChild(label);

      let input;
      if (prop.propDef && prop.propDef.type === 'elementText') {
        input = document.createElement('textarea');
        input.rows = 4;
      } else if (prop.propDef && prop.propDef.type === 'date') {
        input = document.createElement('input');
        input.type = 'date';
      } else if (prop.propDef && prop.propDef.type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
      } else if (prop.propDef && (prop.propDef.type === 'boolean' || (prop.propDef.type === 'json' && prop.propDef.inputType === 'boolean'))) {
        input = document.createElement('select');
        const trueOpt = document.createElement('option');
        trueOpt.text = 'True';
        trueOpt.value = 'true';
        const falseOpt = document.createElement('option');
        falseOpt.text = 'False';
        falseOpt.value = 'false';
        input.add(trueOpt);
        input.add(falseOpt);
      } else if (prop.propDef && prop.propDef.type === 'json' && prop.propDef.inputType === 'number') {
        input = document.createElement('input');
        input.type = 'number';
      } else if (prop.propDef && prop.propDef.type === 'json' && prop.propDef.inputType === 'date') {
        input = document.createElement('input');
        input.type = 'date';
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }

      if (prop.propDef && (prop.propDef.type === 'boolean' || (prop.propDef.type === 'json' && prop.propDef.inputType === 'boolean'))) {

        // For simple boolean type, we try to preserve 0/1 if present.
        // For JSON boolean, typically it's stored as boolean primitive in JSON, but here everything is stringified for sidebar.
        // We will assume string 'true'/'false' for JSON boolean updates via this simple editor unless we do type casting.
        // For now, consistent behavior with the 'boolean' type logic:
        if (prop.value === '1' || prop.value === '0') {
          input.options[0].value = '1';
          input.options[1].value = '0';
          input.value = prop.value;
        } else {

          // Reset options to true/false in case reused
          input.options[0].value = 'true';
          input.options[1].value = 'false';

          if (String(prop.value) === 'true') input.value = 'true';
          else if (String(prop.value) === 'false') input.value = 'false';
          else input.value = 'false';
        }
      } else {
        input.value = prop.value;
      }
      input.style.width = '100%';
      input.style.padding = '5px';
      input.style.boxSizing = 'border-box';

      // Attach change listener
      if (onUpdate && prop.propDef) {
        input.addEventListener('change', (e) => {
          onUpdate(prop.propDef, e.target.value);
        });
      } else {
        input.disabled = true;
      }

      item.appendChild(input);
      list.appendChild(item);
    });

    this.customPropertiesContent.appendChild(list);
  }
}
