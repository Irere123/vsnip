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

  context.subscriptions.push(
    vscode.commands.registerCommand("snip.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from Snip!");
    })
  );
}

export function deactivate() {}
