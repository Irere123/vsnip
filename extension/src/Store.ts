import type * as vscode from 'vscode';
import { accessTokenKey, refreshTokenKey } from './constants';

export class Store {
  static globalState: vscode.ExtensionContext['globalState'];

  static getRefreshToken() {
    return Store.globalState.get<string>(refreshTokenKey) || '';
  }

  static getAccessToken() {
    return Store.globalState.get<string>(accessTokenKey) || '';
  }

  static isLoggedIn() {
    return (
      !!Store.globalState.get(accessTokenKey) &&
      !!Store.globalState.get(refreshTokenKey)
    );
  }
}
