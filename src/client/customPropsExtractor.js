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
    let value = undefined; // Initialize to undefined to distinguish from null or empty string
    try {
      if (propDef.displayType === 'textValue') {
        // Attempt to get direct text content
        // Option 1: Use xpath as the direct property name
        if (propDef.xpath && businessObject.hasOwnProperty(propDef.xpath)) {
          value = businessObject[propDef.xpath];
        }
        // Option 2: Specific fallbacks if Option 1 didn't yield a value
        if (value === undefined) { // Check if value is still not set
          if (bpmnElement.type === 'bpmn:TextAnnotation' && businessObject.text) {
            value = businessObject.text;
          } else if (businessObject.name) { // Common for many elements
            value = businessObject.name;
          }
        }
      } else { // Default to 'property' (XPath-like evaluation) or if displayType is undefined
        if (propDef.xpath.startsWith('@')) { // Attribute
          const attrName = propDef.xpath.substring(1);
          value = businessObject.$attrs?.[attrName];
          if (value === undefined && businessObject[attrName] !== undefined) {
            // Fallback for some common attributes not in $attrs (e.g. 'name' on many elements)
            value = businessObject[attrName];
          }
        } else if (propDef.xpath.includes('bpmn:documentation/text()')) {
          // More robust check for documentation
          if (businessObject.documentation && businessObject.documentation.length > 0) {
            value = businessObject.documentation[0].text;
          }
        } else if (propDef.xpath.includes('bpmn:conditionExpression/text()')) {
          // Check for conditionExpression specifically
          if (businessObject.conditionExpression && businessObject.conditionExpression.body) {
            value = businessObject.conditionExpression.body;
          }
        }
        // TODO: Add more cases for common extensionElements patterns if possible,
        // but full XPath on bpmn:extensionElements is complex without proper XML DOM.
      }

      if (value !== undefined && value !== null) {
        properties.push({ label: propDef.label, value: String(value) });
      } else {
        properties.push({ label: propDef.label, value: 'N/A' });
      }
    } catch (e) {
      console.warn(`Error processing property "${propDef.label}" (xpath: "${propDef.xpath}", displayType: "${propDef.displayType}") for element ${bpmnElement.id}:`, e);
      properties.push({ label: propDef.label, value: 'Error evaluating' });
    }
  }

  return properties;
}
