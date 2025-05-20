import * as vscode from 'vscode';
import { getNonce } from '../getNonce';
import { Store } from '../Store';
import { apiBaseUrl } from '../constants';
import { authenticate } from '../authenticate';

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  public static readonly viewType = 'snip-sidebar';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist/webview'),
        this._extensionUri,
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'logout': {
          console.log('Logging out');
          await Store.updateTokens('', '');
          webviewView.webview.postMessage({
            command: 'logout-complete',
          });
          break;
        }
        case 'login': {
          console.log('Logging in');
          authenticate((payload) => {
            webviewView.webview.postMessage({
              command: 'login-complete',
              payload,
            });
          });
          break;
        }
        case 'send-tokens': {
          console.log('Sending tokens to webview');
          webviewView.webview.postMessage({
            command: 'init-tokens',
            payload: {
              accessToken: Store.getAccessToken(),
              refreshToken: Store.getRefreshToken(),
              apiBaseUrl: apiBaseUrl,
            },
          });
          break;
        }
        case 'full-screen': {
          console.log('Opening Fullscreen panel');
          vscode.commands
            .executeCommand('snip.showWebview')
            .then(() =>
              vscode.commands.executeCommand('workbench.action.closeSidebar'),
            );
          break;
        }
        case 'onInfo': {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case 'onError': {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case 'tokens': {
          console.log('Received tokens from webview');
          await Store.updateTokens(data.accessToken, data.refreshToken);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
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

    const wsApiBaseUrl = apiBaseUrl.replace(/^http/, 'ws');

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src ${
          apiBaseUrl.includes('https')
            ? apiBaseUrl.replace('https', 'wss')
            : apiBaseUrl.replace('http', 'ws')
        } ${apiBaseUrl}; img-src https: data:; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>Snip</title>
        <script nonce="${nonce}">
          window.vscode = acquireVsCodeApi();
          window.apiBaseUrl = ${JSON.stringify(apiBaseUrl)};
          window.accessToken = ${JSON.stringify(Store.getAccessToken())};
          window.refreshToken = ${JSON.stringify(Store.getRefreshToken())};
          window.view = "sidebar";
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
