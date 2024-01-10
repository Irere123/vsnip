import * as vscode from "vscode";
import { SidebarProvider } from "./providers/SidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snip.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from Snip!");
    })
  );
}

export function deactivate() {}
