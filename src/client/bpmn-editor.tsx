/* global acquireVsCodeApi */

import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-editor.css';

import { extractProperties, updateProperty } from './customPropsExtractor.js';
// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
// @ts-ignore
import BpmnColorPickerModule from 'bpmn-js-color-picker';
import customTranslate, { setLanguage } from './i18n/customTranslate';
import { handleMacOsKeyboard } from './utils/macos-keyboard';
import App from './ui/App';

declare const acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

handleMacOsKeyboard();

const customTranslateModule = {
  translate: [ 'value', customTranslate ]
};

let modeler: any = null;
let customPropertiesConfig: any = {};

const Editor = () => {
  const [properties, setProperties] = useState<any[] | string>('');

  const updatePropertiesFromSelection = useCallback((selection: any[]) => {
    if (selection && selection.length === 1) {
      const selectedElement = selection[0];
      const props = extractProperties(selectedElement, customPropertiesConfig);

      if (props && props.length > 0) {
        setProperties(props);
      } else {
        const elementId = String(selectedElement.id).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const elementType = String(selectedElement.type).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        setProperties(`
          <p><b>ID:</b> ${elementId}</p>
          <p><b>Type:</b> ${elementType}</p>
          <p>No configured custom properties found for this element, or an error occurred during extraction.</p>
        `);
      }
    } else {
      setProperties('');
    }
  }, []);

  const setupModelerListeners = useCallback((bpmnModeler: any) => {
    bpmnModeler.on('import.done', (event: any) => {
      vscode.postMessage({
        type: 'import',
        error: event.error?.message,
        warnings: event.warnings?.map((warning: any) => warning.message),
        idx: -1
      });
    });

    bpmnModeler.on('commandStack.changed', () => {
      const commandStack = bpmnModeler.get('commandStack');
      vscode.postMessage({
        type: 'change',
        idx: commandStack._stackIdx
      });
    });

    bpmnModeler.on('canvas.focus.changed', (event: any) => {
      vscode.postMessage({
        type: 'canvas-focus-change',
        value: event.focused
      });
    });

    bpmnModeler.on('selection.changed', (event: any) => {
      updatePropertiesFromSelection(event.newSelection);
    });
  }, [updatePropertiesFromSelection]);

  const initModeler = useCallback((container: HTMLElement) => {
    if (modeler) return;

    modeler = new BpmnModeler({
      container: container,
      additionalModules: [
        BpmnColorPickerModule,
        customTranslateModule
      ]
    });

    setupModelerListeners(modeler);

    window.addEventListener('message', async (event) => {
      const { type, body, requestId } = event.data;

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
          return modeler.saveXML({ format: true }).then((result: any) => {
            return vscode.postMessage({
              type: 'response',
              requestId,
              body: result.xml
            });
          });

        case 'focusCanvas':
          modeler.get('canvas').focus();
          return;

        case 'customConfig':
          customPropertiesConfig = event.data.body || {};
          console.log('Custom properties configuration received:', customPropertiesConfig);

          if (modeler) {
            const selection = modeler.get('selection').get();
            if (selection.length > 0) {
               updatePropertiesFromSelection(selection);
            }
          }
          return;
      }
    });

    vscode.postMessage({ type: 'ready' });

  }, [setupModelerListeners, updatePropertiesFromSelection]);


  const handleUpdateProperty = (propDef: any, newValue: any) => {
     if (!modeler) return;
     const selection = modeler.get('selection').get();
     if (selection.length === 1) {
        const modeling = modeler.get('modeling');
        const moddle = modeler.get('moddle');
        updateProperty(selection[0], propDef, newValue, modeling, moddle);

        const props = extractProperties(selection[0], customPropertiesConfig);
        setProperties(props);
     }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (!modeler) return;

    const { xml } = await modeler.saveXML({ format: true });

    modeler.destroy();

    // Re-use the existing container
    const container = document.getElementById('canvas');
    if (!container) return;

    const newModeler = new BpmnModeler({
      container: container,
      additionalModules: [
        BpmnColorPickerModule,
        customTranslateModule
      ]
    });

    await newModeler.importXML(xml);
    modeler = newModeler;
    setupModelerListeners(modeler);
  };

  return (
    <App
      onCanvasMount={initModeler}
      properties={properties}
      onUpdateProperty={handleUpdateProperty}
      onLanguageChange={handleLanguageChange}
    />
  );
};

// Create a root div
const rootDiv = document.createElement('div');
rootDiv.id = 'react-root';
document.body.appendChild(rootDiv);

const root = createRoot(rootDiv);
root.render(<Editor />);
