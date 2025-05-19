import type * as vscode from 'vscode';
import { accessTokenKey, refreshTokenKey } from './constants';

export class Store {
  static globalState: vscode.Memento;

  static getAccessToken(): string {
    return Store.globalState.get<string>(accessTokenKey) || '';
  }

  static getRefreshToken(): string {
    return Store.globalState.get<string>(refreshTokenKey) || '';
  }

  static async updateTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await Store.globalState.update(accessTokenKey, accessToken);
    await Store.globalState.update(refreshTokenKey, refreshToken);
  }

  static isLoggedIn(): boolean {
    return (
      !!Store.globalState.get<string>(accessTokenKey) &&
      !!Store.globalState.get<string>(refreshTokenKey)
    );
  }
}
