import * as vscode from "vscode";
import { SidebarProvider } from "./providers/SidebarProvider";
import { authenticate } from "./authenticate";
import { Store } from "./Store";

export function activate(context: vscode.ExtensionContext) {
  Store.globalState = context.globalState;
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snip.authenticate", () => {
      authenticate(() => {});
    })
  );

  vscode.commands.registerCommand("snip.reloadSidebar", async () => {
    await vscode.commands.executeCommand("workbench.action.closeSidebar");
    await vscode.commands.executeCommand(
      "workbench.view.extension.snip-sidebar-view"
    );
    setTimeout(() => {
      vscode.commands.executeCommand(
        "workbench.action.webview.openDeveloperTools"
      );
    }, 500);
  });
}

export function deactivate() {}
