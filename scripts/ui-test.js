const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.resolve(__dirname, '..');

// Simple HTTP Server
const server = http.createServer((req, res) => {
  const filePath = path.join(ROOT, req.url === '/' ? 'scripts/mock-webview.html' : req.url);

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.woff':
    case '.woff2':
      contentType = 'font/woff';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT'){
        console.log(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const bpmnXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>SequenceFlow_0b6cm13</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_0zlv465" name="foo">
      <bpmn:incoming>SequenceFlow_0b6cm13</bpmn:incoming>
      <bpmn:outgoing>SequenceFlow_17w8608</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="SequenceFlow_0b6cm13" sourceRef="StartEvent_1" targetRef="Task_0zlv465" />
    <bpmn:endEvent id="EndEvent_09arx8f">
      <bpmn:incoming>SequenceFlow_17w8608</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="SequenceFlow_17w8608" sourceRef="Task_0zlv465" targetRef="EndEvent_09arx8f" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="188" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="146" y="224" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_0zlv465_di" bpmnElement="Task_0zlv465">
        <dc:Bounds x="264" y="303" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_0b6cm13_di" bpmnElement="SequenceFlow_0b6cm13">
        <di:waypoint xsi:type="dc:Point" x="209" y="206" />
        <di:waypoint xsi:type="dc:Point" x="237" y="206" />
        <di:waypoint xsi:type="dc:Point" x="237" y="343" />
        <di:waypoint xsi:type="dc:Point" x="264" y="343" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="192.5" y="110" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="EndEvent_09arx8f_di" bpmnElement="EndEvent_09arx8f">
        <dc:Bounds x="431" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="404" y="138" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_17w8608_di" bpmnElement="SequenceFlow_17w8608">
        <di:waypoint xsi:type="dc:Point" x="364" y="343" />
        <di:waypoint xsi:type="dc:Point" x="398" y="343" />
        <di:waypoint xsi:type="dc:Point" x="398" y="120" />
        <di:waypoint xsi:type="dc:Point" x="431" y="120" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="353.5" y="110" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

(async () => {
  server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Navigating to app...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // 1. Initial Load (English default)
    console.log('Initializing BPMN...');
    await page.evaluate((xml) => {
      window.postMessage({ type: 'init', body: { content: xml } }, '*');
    }, bpmnXML);

    // Wait for rendering
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-default-en.png') });
    console.log('Screenshot: ui-default-en.png');

    // 2. Switch to Chinese
    console.log('Switching to Chinese...');
    await page.select('#language-select', 'zh');
    await page.evaluate(() => {
        const select = document.getElementById('language-select');
        const event = new Event('change');
        select.dispatchEvent(event);
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-chinese.png') });
    console.log('Screenshot: ui-chinese.png');

    // 3. Switch to Japanese
    console.log('Switching to Japanese...');
    await page.select('#language-select', 'ja');
    await page.evaluate(() => {
        const select = document.getElementById('language-select');
        const event = new Event('change');
        select.dispatchEvent(event);
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-japanese.png') });
    console.log('Screenshot: ui-japanese.png');

    // 4. Sidebar & Custom Properties
    console.log('Testing Sidebar & Custom Properties...');

    // Inject configuration
    const customConfig = {
      common: [
        { label: 'My Common Prop', xpath: 'bpmn:documentation' } // Using documentation as example
      ],
      elementSpecific: {
        'bpmn:Task': [
           { label: 'Task Type', xpath: 'custom:taskType' }
        ]
      }
    };

    await page.evaluate((config) => {
      window.postMessage({ type: 'customConfig', body: config }, '*');
    }, customConfig);

    // Select the Task (Task_0zlv465)
    // We can do this by interacting with the modeler instance if we expose it, or via clicking.
    // In bpmn-js, elements have data-element-id attributes in the SVG.

    // Wait for SVG elements
    await page.waitForSelector('[data-element-id="Task_0zlv465"]');

    // Click the task
    await page.click('[data-element-id="Task_0zlv465"]');
    await new Promise(r => setTimeout(r, 500)); // wait for selection event

    // Expand sidebar
    // Click #sidebar-toggle or #sidebar-expand
    // Check which one is visible. Initially sidebar is likely collapsed.
    // The CSS says: #sidebar.collapsed { width: 40px; }
    // #sidebar-expand is inside sidebar? No, #sidebar-toggle is at bottom left, #sidebar-expand is top right.

    // Let's click #sidebar-toggle
    try {
        await page.click('#sidebar-toggle');
    } catch (e) {
        console.log('Could not click #sidebar-toggle, maybe already expanded or different ID? Trying #sidebar-expand');
        await page.click('#sidebar-expand');
    }

    await new Promise(r => setTimeout(r, 1000)); // wait for animation

    await page.screenshot({ path: path.join(ROOT, 'ui-sidebar-custom-props.png') });
    console.log('Screenshot: ui-sidebar-custom-props.png');

    await browser.close();
    server.close();
  } catch (error) {
    console.error('Test failed:', error);
    server.close();
    process.exit(1);
  }
})();
