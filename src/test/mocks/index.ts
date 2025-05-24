const noop = () => {};

const noopDisposable = (): Disposable => {
  return new Disposable();
};

const noopThenable = (): Thenable<boolean> => {
  return new Promise(resolve => {
    resolve(true);
  });
};

const noopUri = (): Uri => {
  return new Uri();
};

export class ExtensionContext {
  extensionPath = 'foo/bar';
  subscriptions = [];
  workspaceState = null;
  globalState = null;
  asAbsolutePath = null;
  storagePath = null;
  globalStoragePath = null;
  logPath = null;
}

export class WebviewOptions {

}

export class Uri {
  authority = '';
  fragment = '';
  fsPath = '';
  path = '';
  query = '';
  scheme = '';
  toJSON = noop;
  with = noopUri;

  constructor(options?: { fsPath: string }) {
    if (options) {
      this.fsPath = options.fsPath;
    }
  }
}

export class Disposable {
  dispose = noop;
}

export class Webview {
  asWebviewUri = noopUri;
  options = new WebviewOptions();
  html = '';
  onDidReceiveMessage = noopDisposable;
  postMessage = noopThenable;
  cspSource = '';

  constructor(options?: { resourcePath?: string }) {

    if (options && typeof options.resourcePath === 'string') {
      const actualResourcePath: string = options.resourcePath; // Explicitly typed variable
      this.asWebviewUri = () => {
        return new Uri({
          fsPath: actualResourcePath // Use the new variable
        });
      };
    }

    // If resourcePath is not provided or not a string, asWebviewUri will remain the default noopUri
  }
}
