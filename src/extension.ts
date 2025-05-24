import * as vscode from 'vscode';
import { load as loadYaml } from 'js-yaml';

import { BpmnEditor } from './bpmn-editor.js';

// Define a basic interface for the custom properties configuration
export interface CustomPropertiesConfig {
  common?: Array<{ label: string; xpath: string }>;
  elementSpecific?: Record<string, Array<{ label: string; xpath: string }>>;

  // Allow other properties if necessary, or make it stricter
  [key: string]: unknown; // Changed 'any' to 'unknown'
}
let customPropertiesConfig: CustomPropertiesConfig = {}; // To store the parsed config

async function loadCustomPropertiesConfig(_context: vscode.ExtensionContext) {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    const workspaceFolder = vscode.workspace.workspaceFolders[0]; // Assuming single root for simplicity
    const configFileUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'bpmn-custom-properties.yaml');

    try {
      const rawContent = await vscode.workspace.fs.readFile(configFileUri);
      const content = Buffer.from(rawContent).toString('utf8');
      const parsedConfig = loadYaml(content);
      if (parsedConfig && typeof parsedConfig === 'object') {
        customPropertiesConfig = parsedConfig as CustomPropertiesConfig;
        vscode.window.showInformationMessage('BPMN custom properties config loaded.');
        console.log('BPMN Custom Properties Config:', customPropertiesConfig);
      } else {
        vscode.window.showErrorMessage('.vscode/bpmn-custom-properties.yaml is not a valid YAML object.');
        customPropertiesConfig = {}; // Default to empty
      }
    } catch (error: unknown) { // Changed from any to unknown
      if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
        vscode.window.showInformationMessage('No .vscode/bpmn-custom-properties.yaml found. Using default behavior.');
        customPropertiesConfig = {}; // Default to empty or some predefined structure
      } else if (error instanceof Error && error.name === 'YAMLException') { // Type guard for Error
        vscode.window.showErrorMessage(`Error parsing .vscode/bpmn-custom-properties.yaml: ${error.message}`);
        customPropertiesConfig = {}; // Default on parsing error
      } else if (error instanceof Error) { // General error with a message
        vscode.window.showErrorMessage(`Error loading BPMN custom properties config: ${error.message}`);
        customPropertiesConfig = {}; // Default on other errors
      } else { // Fallback for other unknown error types
        vscode.window.showErrorMessage('Error loading BPMN custom properties config: An unknown error occurred');
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
