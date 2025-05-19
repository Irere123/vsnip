import * as vscode from 'vscode';
import { getNonce } from '../getNonce';
import { apiBaseUrl } from '../constants';
import { Store } from '../Store';

export class ExplorePanel {
  public static currentPanel: ExplorePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (ExplorePanel.currentPanel) {
      ExplorePanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'snipExplore',
      'Snip Explore',
      column || vscode.ViewColumn.One,
      {
        // Enable JavaScript in the webview
        enableScripts: true,
        // Restrict the webview to only load resources from the dist directory
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist/webview'),
          extensionUri,
        ],
        retainContextWhenHidden: true,
      },
    );

    ExplorePanel.currentPanel = new ExplorePanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables,
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'onInfo': {
            if (!message.value) {
              return;
            }
            vscode.window.showInformationMessage(message.value);
            break;
          }
          case 'onError': {
            if (!message.value) {
              return;
            }
            vscode.window.showErrorMessage(message.value);
            break;
          }
          case 'logout': {
            console.log('Logging out');
            await Store.updateTokens('', '');
            this._panel.webview.postMessage({
              command: 'logout-complete',
            });
            break;
          }
          case 'tokens': {
            console.log('Received tokens from webview');
            await Store.updateTokens(message.accessToken, message.refreshToken);
            break;
          }
        }
      },
      null,
      this._disposables,
    );
  }

  public dispose() {
    ExplorePanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Snip Explore';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview
    // and then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'webview.js'),
    );

    // Same for stylesheet
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'webview.css'),
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${apiBaseUrl}">
        <link href="${styleUri}" rel="stylesheet">
        <title>Snip Explore</title>
        <script nonce="${nonce}">
          window.vscode = acquireVsCodeApi();
          window.apiBaseUrl = ${JSON.stringify(apiBaseUrl)};
          window.accessToken = ${JSON.stringify(Store.getAccessToken())};
          window.refreshToken = ${JSON.stringify(Store.getRefreshToken())};
          window.view = "explore";
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
