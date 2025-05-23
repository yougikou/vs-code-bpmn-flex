import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

import { BpmnEditor } from './bpmn-editor';

let customPropertiesConfig: any = {}; // To store the parsed config

async function loadCustomPropertiesConfig(context: vscode.ExtensionContext) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceFolder = vscode.workspace.workspaceFolders[0]; // Assuming single root for simplicity
        const configFileUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'bpmn-custom-properties.yaml');

        try {
            const rawContent = await vscode.workspace.fs.readFile(configFileUri);
            const content = Buffer.from(rawContent).toString('utf8');
            const parsedConfig = yaml.load(content);
            if (parsedConfig && typeof parsedConfig === 'object') {
                customPropertiesConfig = parsedConfig;
                vscode.window.showInformationMessage('BPMN custom properties config loaded.');
                console.log('BPMN Custom Properties Config:', customPropertiesConfig);
            } else {
                vscode.window.showErrorMessage('.vscode/bpmn-custom-properties.yaml is not a valid YAML object.');
                customPropertiesConfig = {}; // Default to empty
            }
        } catch (error: any) { // Explicitly type error for better handling
            if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
                vscode.window.showInformationMessage('No .vscode/bpmn-custom-properties.yaml found. Using default behavior.');
                customPropertiesConfig = {}; // Default to empty or some predefined structure
            } else if (error && error.name === 'YAMLException') { // Check if error is defined before accessing name
                vscode.window.showErrorMessage(`Error parsing .vscode/bpmn-custom-properties.yaml: ${error.message}`);
                customPropertiesConfig = {}; // Default on parsing error
            } else {
                vscode.window.showErrorMessage(`Error loading BPMN custom properties config: ${error.message || error}`);
                customPropertiesConfig = {}; // Default on other errors
            }
        }
    } else {
        vscode.window.showInformationMessage('No workspace folder open. BPMN custom properties will not be loaded.');
        customPropertiesConfig = {}; // No workspace, use default
    }
}


export async function activate(context: vscode.ExtensionContext) {
  await loadCustomPropertiesConfig(context);

  // register our custom editor providers
  context.subscriptions.push(BpmnEditor.register(context, customPropertiesConfig)); // Pass config here
}
