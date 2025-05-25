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
      let attrName, pathParts, currentObj;

      switch (propDef.type) {
      case 'attribute':
        attrName = propDef.xpath.startsWith('@') ?
          propDef.xpath.substring(1) : propDef.xpath;
        value = businessObject.$attrs?.[attrName] ?? businessObject[attrName];
        break;
      case 'elementText':
        pathParts = propDef.xpath.split('/');
        currentObj = businessObject;
        for (const part of pathParts) {
          if (!currentObj) break;
          currentObj = currentObj[part.replace('bpmn:', '')];
        }
        value = currentObj;
        break;
      case 'fullXPath':

        // TODO: Implement full XPath evaluation
        // Requires serializeBusinessObject implementation
        console.warn('Full XPath evaluation not yet implemented');
        break;
      default:
        console.warn(`Unknown xpath type: ${propDef.type}`);
      }

      if (value !== undefined && value !== null && value !== '') {
        properties.push({ label: propDef.label, value: String(value) });
      } else {
        properties.push({ label: propDef.label, value: 'N/A' });
      }
    } catch (e) {
      console.warn(`Error evaluating XPath "${propDef.xpath}" for element ${bpmnElement.id}:`, e);
      properties.push({ label: propDef.label, value: 'Error evaluating' });
    }
  }

  return properties;
}
