/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-editor.css';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import BpmnColorPickerModule from 'bpmn-js-color-picker';
import customTranslate, { setLanguage } from './i18n/customTranslate';

import { handleMacOsKeyboard } from './utils/macos-keyboard';

/**
 * @type { import('vscode') }
 */
const vscode = acquireVsCodeApi();

handleMacOsKeyboard();

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
  }
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
