import * as assert from 'assert';
import { extractProperties } from '../../client/customPropsExtractor.js';

describe('CustomPropsExtractor', () => {
  describe('extractProperties', () => {
    let mockBpmnElement;
    let config;

    beforeEach(() => {
      // Reset mocks before each test
      mockBpmnElement = {
        type: 'bpmn:Task',
        businessObject: {
          $attrs: {},
          documentation: [],
          // name: undefined, // Explicitly undefined for some tests
          // text: undefined, // Explicitly undefined for some tests
        },
      };
      config = {
        common: [],
        elementSpecific: {},
      };
    });

    it('should return an empty array if no config is provided', () => {
      const props = extractProperties(mockBpmnElement, null);
      assert.deepStrictEqual(props, []);
    });

    it('should return an empty array if bpmnElement or businessObject is missing', () => {
      assert.deepStrictEqual(extractProperties(null, config), []);
      assert.deepStrictEqual(extractProperties({ type: 'bpmn:Task', businessObject: null }, config), []);
    });

    it('should return an empty array if no common or element-specific configs apply', () => {
      mockBpmnElement.type = 'bpmn:Process';
      config.elementSpecific['bpmn:Task'] = [{ label: 'Task Prop', xpath: '@taskAttr' }];
      const props = extractProperties(mockBpmnElement, config);
      assert.deepStrictEqual(props, []);
    });

    // Tests for displayType: 'property' (or undefined)
    describe("displayType: 'property'", () => {
      it('should extract attribute from $attrs', () => {
        mockBpmnElement.businessObject.$attrs.taskAttr = 'value1';
        config.common.push({ label: 'Task Attr', xpath: '@taskAttr' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Task Attr', value: 'value1' }]);
      });

      it('should extract attribute directly from businessObject if not in $attrs (e.g., id)', () => {
        mockBpmnElement.businessObject.id = 'elementId123';
        config.common.push({ label: 'ID', xpath: '@id' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'ID', value: 'elementId123' }]);
      });

      it('should extract businessObject.name if xpath is "name"', () => {
        mockBpmnElement.businessObject.name = 'Test Name';
        config.common.push({ label: 'Name', xpath: 'name' }); // No displayType, defaults to property-like
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Name', value: 'Test Name' }]);
      });
      
      it('should extract documentation', () => {
        mockBpmnElement.businessObject.documentation = [{ text: 'Test documentation' }];
        config.common.push({ label: 'Documentation', xpath: 'bpmn:documentation/text()' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Documentation', value: 'Test documentation' }]);
      });

      it('should extract conditionExpression body', () => {
        mockBpmnElement.businessObject.conditionExpression = { body: 'x > 5' };
        config.common.push({ label: 'Condition', xpath: 'bpmn:conditionExpression/text()' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Condition', value: 'x > 5' }]);
      });

      it('should return "N/A" for missing property type data', () => {
        config.common.push({ label: 'Missing Attr', xpath: '@missingAttr' });
        config.common.push({ label: 'Missing Doc', xpath: 'bpmn:documentation/text()' });
        config.common.push({ label: 'Missing Cond', xpath: 'bpmn:conditionExpression/text()' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [
          { label: 'Missing Attr', value: 'N/A' },
          { label: 'Missing Doc', value: 'N/A' },
          { label: 'Missing Cond', value: 'N/A' },
        ]);
      });
    });

    // Tests for displayType: 'textValue'
    describe("displayType: 'textValue'", () => {
      it('should extract businessObject property specified by xpath', () => {
        mockBpmnElement.businessObject.customTextProp = 'Custom Text Value';
        config.common.push({ label: 'Custom Text', xpath: 'customTextProp', displayType: 'textValue' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Custom Text', value: 'Custom Text Value' }]);
      });

      it('should extract businessObject.name when xpath is "name"', () => {
        mockBpmnElement.businessObject.name = 'Element Name';
        config.common.push({ label: 'Name (textValue)', xpath: 'name', displayType: 'textValue' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Name (textValue)', value: 'Element Name' }]);
      });
      
      it('should extract businessObject.text for bpmn:TextAnnotation (xpath "text")', () => {
        mockBpmnElement.type = 'bpmn:TextAnnotation';
        mockBpmnElement.businessObject.text = 'Annotation Text';
        config.common.push({ label: 'Annotation', xpath: 'text', displayType: 'textValue' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Annotation', value: 'Annotation Text' }]);
      });

      it('should extract businessObject.text for bpmn:TextAnnotation (generic xpath, fallback)', () => {
        mockBpmnElement.type = 'bpmn:TextAnnotation';
        mockBpmnElement.businessObject.text = 'Annotation Text Fallback';
        // xpath is not 'text', but for TextAnnotation, .text should be prioritized by current logic
        config.common.push({ label: 'Annotation Fallback', xpath: 'someOtherProp', displayType: 'textValue' });
        const props = extractProperties(mockBpmnElement, config);
        // The current logic in customPropsExtractor for 'textValue' is:
        // 1. businessObject[propDef.xpath]
        // 2. if (value === undefined) { if (type === 'bpmn:TextAnnotation' && bo.text) value = bo.text else if (bo.name) value = bo.name }
        // So, if 'someOtherProp' is not on businessObject, it will fallback to .text for TextAnnotation
        assert.deepStrictEqual(props, [{ label: 'Annotation Fallback', value: 'Annotation Text Fallback' }]);
      });

      it('should fallback to businessObject.name if xpath property is not found', () => {
        mockBpmnElement.businessObject.name = 'Fallback Name';
        config.common.push({ label: 'Fallback', xpath: 'nonExistentProp', displayType: 'textValue' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Fallback', value: 'Fallback Name' }]);
      });
      
      it('should return "N/A" if xpath property, .text, and .name are all missing', () => {
        // businessObject.name and businessObject.text are not set by default in beforeEach for this test
        config.common.push({ label: 'Missing Text', xpath: 'nonExistentProp', displayType: 'textValue' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Missing Text', value: 'N/A' }]);
      });
    });

    it('should combine common and elementSpecific properties', () => {
      mockBpmnElement.businessObject.$attrs.commonAttr = 'common';
      mockBpmnElement.businessObject.$attrs.taskAttr = 'task';
      mockBpmnElement.type = 'bpmn:Task';

      config.common.push({ label: 'Common', xpath: '@commonAttr' });
      config.elementSpecific['bpmn:Task'] = [{ label: 'Task Specific', xpath: '@taskAttr' }];
      
      const props = extractProperties(mockBpmnElement, config);
      assert.deepStrictEqual(props, [
        { label: 'Common', value: 'common' },
        { label: 'Task Specific', value: 'task' },
      ]);
    });
    
    it('should handle errors during property extraction gracefully', () => {
        // This test relies on the current implementation's catch block.
        // To make it more robust, we could try to force an error if there was complex logic.
        // For now, using an invalid XPath that doesn't match simple patterns and isn't an attribute.
        config.common.push({ label: 'Error Prone', xpath: 'bpmn:invalid?/complex/[[[@' });
        const props = extractProperties(mockBpmnElement, config);
        assert.deepStrictEqual(props, [{ label: 'Error Prone', value: 'Error evaluating' }]);
    });
  });
});
