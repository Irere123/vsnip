import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';
import { ExplorePanel } from './providers/ExplorePanel';
import { Store } from './Store';
import { authenticate } from './authenticate';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "extension-2" is now active!');

  // Initialize global state
  Store.globalState = context.globalState;

  // Create and register the sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider,
    ),
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('extension-2.showWebview', () => {
      ExplorePanel.createOrShow(context.extensionUri);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension-2.authenticate', () => {
      authenticate(() => {
        vscode.window.showInformationMessage('Successfully authenticated');
      });
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension-2.reloadWebview', async () => {
      await vscode.commands.executeCommand('workbench.action.closeSidebar');
      await vscode.commands.executeCommand(
        'workbench.view.extension.snip-sidebar-view',
      );
      setTimeout(() => {
        vscode.commands.executeCommand(
          'workbench.action.webview.openDeveloperTools',
        );
      }, 500);
    }),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
