// src/client/customPropsExtractor.js

// Note: Depending on the exact xpath library, the import might be different,
// e.g., const select = require('xpath'); const dom = require('xmldom').DOMParser;
// For now, assuming ES6 module imports will be handled by the bundler (Rollup)
// However, 'xpath' and 'xmldom' are typically CommonJS.
// If Rollup doesn't handle this well, we might need to use require or adjust rollup config.
// For this step, proceeding with ES6 import syntax as per initial instruction.
import { DOMParser as _DOMParser } from 'xmldom';
import _xpath from 'xpath';


export function extractProperties(bpmnElement, config) {
  if (!bpmnElement || !config) {
    return [];
  }

  const businessObject = bpmnElement.businessObject;
  if (!businessObject) {
    return [];
  }

  const properties = [];

  // const elementProperties = []; // This variable was declared but not used in the provided snippet. Removing for now.

  // Determine applicable property configurations
  const configToApply = [];
  if (config.common) {
    configToApply.push(...config.common);
  }
  if (config.elementSpecific && config.elementSpecific[bpmnElement.type]) {
    configToApply.push(...config.elementSpecific[bpmnElement.type]);
  }

  if (configToApply.length === 0) {
    return [];
  }

  // This is where the actual XML string would be needed for a generic XPath evaluator.
  // Given the complexity of serializing moddle elements to a generic XML string
  // that standard XPath libraries can consume without full bpmn-moddle context,
  // let's try a direct access approach for simple XPath-like expressions first,
  // and then note that a full XPath engine would require proper XML serialization.

  for (const propDef of configToApply) {
    let value = undefined;
    try {

      // Dynamic XPath evaluation based on config type
      let pathParts, currentObj;

      pathParts = propDef.xpath.split('/');
      currentObj = businessObject;
      if (!currentObj) continue;

      // 处理嵌套属性访问
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i].replace('bpmn:', '');

        // 获取当前层级的属性
        if (currentObj[part] !== undefined) {
          currentObj = currentObj[part];
        } else if (currentObj.$attrs && currentObj.$attrs[part] !== undefined) {
          currentObj = currentObj.$attrs[part];
        } else {
          currentObj = undefined;
        }

        // 中间路径处理：数组取第一个元素
        if (currentObj) {
          if (Array.isArray(currentObj)) {
            currentObj = currentObj[0];
          }
        }
      }

      if (!currentObj) continue;

      switch (propDef.type) {
      case 'attribute':
      case 'date':
      case 'number':
      case 'boolean':
        value = currentObj;
        break;
      case 'elementText':
        value = currentObj.text;
        break;
      case 'fullXPath':

        // TODO: Implement full XPath evaluation
        // Requires serializeBusinessObject implementation
        console.warn('Full XPath evaluation not yet implemented');
        break;
      default:
        console.warn(`Unknown xpath type: ${propDef.type}`);
      }

      if (value !== undefined && value !== null) {
        properties.push({ label: propDef.label, value: String(value), propDef });
      } else {
        properties.push({ label: propDef.label, value: '', propDef });
      }
    } catch (e) {
      console.warn(`Error evaluating XPath "${propDef.xpath}" for element ${bpmnElement.id}:`, e);
      properties.push({ label: propDef.label, value: 'Error evaluating', propDef });
    }
  }

  return properties;
}

export function updateProperty(element, propDef, newValue, modeling, moddle) {
  if (!element || !propDef || !modeling || !moddle) return;

  const businessObject = element.businessObject;
  const pathParts = propDef.xpath.split('/');

  // Helper to get simple property name from xpath part
  const getPropName = (part) => part.replace('bpmn:', '');

  if (['attribute', 'date', 'number', 'boolean'].includes(propDef.type)) {

    // Traverse to the parent object of the attribute
    let currentObj = businessObject;
    let propName = '';

    for (let i = 0; i < pathParts.length; i++) {
      const part = getPropName(pathParts[i]);

      if (i === pathParts.length - 1) {
        propName = part;
      } else {

        // Traverse down
        if (!currentObj[part]) {

          // If intermediate object missing, we can't update.
          // In future we might support creation.
          console.warn(`Cannot update property ${propDef.xpath}: intermediate path ${part} missing.`);
          return;
        }
        currentObj = currentObj[part];
        if (Array.isArray(currentObj)) {
          currentObj = currentObj[0];
        }
      }
    }

    if (currentObj && propName) {
      if (currentObj === businessObject) {
        modeling.updateProperties(element, { [propName]: newValue });
      } else {
        modeling.updateModdleProperties(element, currentObj, { [propName]: newValue });
      }
    }

  } else if (propDef.type === 'elementText') {

    // For elementText (like documentation), we traverse to the element itself
    // and update its 'text' property.

    // Handle bpmn:documentation specifically for creation if missing
    if (propDef.xpath === 'bpmn:documentation' && (!businessObject.documentation || businessObject.documentation.length === 0)) {
      const newDoc = moddle.create('bpmn:Documentation', { text: newValue });
      modeling.updateProperties(element, { documentation: [ newDoc ] });
      return;
    }

    let currentObj = businessObject;
    for (let i = 0; i < pathParts.length; i++) {
      const part = getPropName(pathParts[i]);

      if (!currentObj[part]) {
        console.warn(`Cannot update property ${propDef.xpath}: path ${part} missing.`);
        return;
      }

      currentObj = currentObj[part];
      if (Array.isArray(currentObj)) {
        currentObj = currentObj[0];
      }
    }

    if (currentObj) {
      modeling.updateModdleProperties(element, currentObj, { text: newValue });
    }
  }
}
