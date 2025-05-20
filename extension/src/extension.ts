import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';
import { SidebarFullScreenPanel } from './providers/SidebarFullScreenPanel';
import { Store } from './Store';
import { authenticate } from './authenticate';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "snip" is now active!');

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
    vscode.commands.registerCommand('snip.showWebview', () => {
      SidebarFullScreenPanel.createOrShow(context.extensionUri);
    }),
    vscode.commands.registerCommand("snip.hidePanel", () => {
      sidebarProvider._view?.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('snip.authenticate', () => {
      authenticate(() => {
        vscode.window.showInformationMessage('Successfully authenticated');
      });
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('snip.reloadWebview', async () => {
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
export function deactivate() { }
