import React, { ChangeEvent } from 'react';
import { Form, Input, Select } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

export interface Property {
  label: string;
  value: any;
  propDef: any;
}

interface PropertiesPanelProps {
  properties: Property[] | string;
  onUpdate: (propDef: any, value: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ properties, onUpdate }) => {
  if (typeof properties === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: properties }} style={{ padding: 16 }} />;
  }

  if (!properties || properties.length === 0) {
    return <div style={{ padding: 16, color: '#666' }}>Select a BPMN element to see its configured properties.</div>;
  }

  const handleChange = (propDef: any, value: any) => {
    onUpdate(propDef, value);
  };

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <Form layout="vertical" size="small">
        {properties.map((prop, index) => {
          const { propDef, value, label } = prop;

          let inputElement;

          if (propDef?.type === 'elementText') {
            inputElement = (
              <TextArea
                rows={4}
                value={value}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(propDef, e.target.value)}
              />
            );
          } else if (propDef?.type === 'date') {
             inputElement = (
               <Input
                 type="date"
                 value={value}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(propDef, e.target.value)}
               />
             );
          } else if (propDef?.type === 'number') {
             inputElement = (
               <Input
                 type="number"
                 value={value}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(propDef, e.target.value)}
               />
             );
          } else if (propDef?.type === 'boolean' || (propDef?.type === 'json' && propDef?.inputType === 'boolean')) {
            const isNumericBoolean = (value === '1' || value === '0');
            const stringValue = String(value);

             inputElement = (
               <Select
                 value={stringValue}
                 onChange={(val) => handleChange(propDef, val)}
               >
                 {isNumericBoolean ? (
                   <>
                    <Option value="1">True</Option>
                    <Option value="0">False</Option>
                   </>
                 ) : (
                   <>
                    <Option value="true">True</Option>
                    <Option value="false">False</Option>
                   </>
                 )}
               </Select>
             );
          } else if (propDef?.type === 'json' && propDef?.inputType === 'number') {
            inputElement = (
               <Input
                 type="number"
                 value={value}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(propDef, e.target.value)}
               />
             );
          } else if (propDef?.type === 'json' && propDef?.inputType === 'date') {
            inputElement = (
               <Input
                 type="date"
                 value={value}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(propDef, e.target.value)}
               />
             );
          } else {
            inputElement = (
              <Input
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(propDef, e.target.value)}
              />
            );
          }

          return (
            <Form.Item key={index} label={label} style={{ marginBottom: 12 }}>
              {inputElement}
            </Form.Item>
          );
        })}
      </Form>
    </div>
  );
};

export default PropertiesPanel;
