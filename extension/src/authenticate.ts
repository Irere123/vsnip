import koa from "koa";
import Router from "@koa/router";
import * as vscode from "vscode";
import { accessTokenKey, apiBaseUrl, refreshTokenKey } from "./constants";
import { Store } from "./Store";

export const authenticate = (
  fn: (x: { accessToken: string; refreshToken: string }) => void
) => {
  const app = new koa();

  vscode.commands.executeCommand(
    "vscode.open",
    vscode.Uri.parse(`${apiBaseUrl}/auth/google`)
  );

  const router = new Router();

  router.get("/", (ctx) => {
    ctx.response.body = "Hello world";
  });

  router.get("/callback/:accessToken/:refreshToken", async (ctx) => {
    const { accessToken, refreshToken } = ctx.params;

    if (!accessToken || !refreshToken) {
      ctx.response.body = "Something went wrong";
      return;
    }

    await Store.globalState.update(accessTokenKey, accessToken);
    await Store.globalState.update(refreshTokenKey, refreshToken);

    fn({ accessToken, refreshToken });

    ctx.response.body = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src vscode-resource:; form-action vscode-resource:; frame-ancestors vscode-resource:; img-src vscode-resource: https:; script-src 'self' 'unsafe-inline' vscode-resource:; style-src 'self' 'unsafe-inline' vscode-resource:;"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      </head>
      <body>
          <h1>Success! You may now close this tab.</h1>
          <h3>Created by Irere</h3>
          <style>
            html, body {
              background-color: #1a1a1a;
              color: #c3c3c3;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100%;
              width: 100%;
              margin: 0;
            }

          </style>
      </body>
    </html>
    `;
  });

  app.use(router.routes());

  app.listen(54321);
};
