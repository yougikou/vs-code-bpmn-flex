import React, { useRef, useEffect, useState } from 'react';
import { Layout, Button, Select } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, SettingOutlined } from '@ant-design/icons';
import PropertiesPanel, { Property } from './PropertiesPanel';

const { Sider, Content } = Layout;
const { Option } = Select;

interface AppProps {
  onCanvasMount: (container: HTMLElement) => void;
  properties: Property[] | string;
  onUpdateProperty: (propDef: any, value: any) => void;
  onLanguageChange: (lang: string) => void;
}

const App: React.FC<AppProps> = ({ onCanvasMount, properties, onUpdateProperty, onLanguageChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasMount(canvasRef.current);
    }
  }, [onCanvasMount]);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Content style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#fff' }}>
        <div ref={canvasRef} style={{ width: '100%', height: '100%' }} id="canvas" />

        {/* Sidebar Toggle */}
        <div
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            zIndex: 100,
          }}
        >
          <Button
            type="default"
            icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* Language Selector */}
        <div style={{ position: 'absolute', bottom: 15, left: 15, zIndex: 100 }}>
           <Select defaultValue="en" style={{ width: 120 }} onChange={onLanguageChange} id="language-select">
             <Option value="ja">日本語</Option>
             <Option value="zh">中文</Option>
             <Option value="en">English</Option>
           </Select>
        </div>

      </Content>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={0}
        width={300}
        theme="light"
        style={{ borderLeft: '1px solid #f0f0f0' }}
        trigger={null}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
           <div style={{
             padding: '12px 16px',
             borderBottom: '1px solid #f0f0f0',
             fontWeight: 600,
             display: 'flex',
             alignItems: 'center',
             background: '#fafafa'
           }}>
             <SettingOutlined style={{ marginRight: 8 }} />
             Properties
           </div>
           <PropertiesPanel properties={properties} onUpdate={onUpdateProperty} />
        </div>
      </Sider>
    </Layout>
  );
};

export default App;
