import type http from 'node:http';
import type WebSocket from 'ws';
import { Server } from 'ws';
import url from 'node:url';
import { verify } from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../schema';
import { eq, and } from 'drizzle-orm';
import { config } from '../config';
import { markConversationAsRead } from '../services/conversation.service';

const wsUsers: Record<
  string,
  { ws: WebSocket; openChatUserId: string | null }
> = {};

/**
 * Sends a JSON stringified message to a user if they are connected via WebSocket.
 * @param userId The ID of the user to send the message to.
 * @param data The data to send.
 */
export const wsSend = (userId: string, data: any) => {
  if (userId in wsUsers) {
    try {
      wsUsers[userId].ws.send(JSON.stringify(data));
    } catch (error) {
      console.error(
        `Error sending WebSocket message to user ${userId}:`,
        error,
      );
    }
  }
};

export const initializeWebSockets = (server: http.Server) => {
  const wss = new Server({ noServer: true });

  wss.on('connection', (ws: WebSocket, userId: string) => {
    if (!userId) {
      ws.terminate();
      return;
    }

    wsUsers[userId] = { openChatUserId: null, ws };

    ws.on('message', (messageData: WebSocket.RawData) => {
      try {
        const parsedMessage = JSON.parse(messageData.toString());
        const {
          type,
          userId: openChatUserId,
        }: { type: 'message-open'; userId: string } = parsedMessage;

        if (type === 'message-open') {
          if (userId in wsUsers) {
            wsUsers[userId].openChatUserId = openChatUserId;
            markConversationAsRead(userId, openChatUserId).catch((error) => {
              console.error(
                `Error calling markConversationAsRead for user ${userId} and ${openChatUserId}:`,
                error,
              );
            });
          }
        }
      } catch (error) {
        console.error(
          `Failed to parse WebSocket message from user ${userId}:`,
          messageData.toString(),
          error,
        );
      }
    });

    ws.on('close', () => {
      delete wsUsers[userId];
    });

    ws.on('error', (error) => {
      console.log(error)
      if (userId in wsUsers) {
        delete wsUsers[userId];
      }
    });
  });

  server.on('upgrade', async (request, socket, head) => {
    const unauthorized = () => {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    };

    try {
      const requestUrl = request.url;
      if (!requestUrl) {
        return unauthorized();
      }

      const { query } = url.parse(requestUrl, true);
      const accessToken = query.accessToken as string | undefined;
      const refreshToken = query.refreshToken as string | undefined;

      if (!accessToken || !refreshToken) {
        console.log('WebSocket upgrade: Missing tokens');
        return unauthorized();
      }
      if (!config.accessTokenSecret || !config.refreshTokenSecret) {
        console.error(
          'WebSocket upgrade: Token secrets not configured on server.',
        );
        return unauthorized();
      }

      try {
        const decodedAccessToken = verify(
          accessToken,
          config.accessTokenSecret,
        ) as { userId: string };
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, decodedAccessToken.userId);
        });
        return;
      } catch (jwtError) {
        console.log(
          'WebSocket upgrade: Access token invalid or expired, trying refresh token.',
        );
      }

      try {
        const decodedRefreshToken = verify(
          refreshToken,
          config.refreshTokenSecret,
        ) as { userId: string; tokenVersion: number };
        const [user] = await db
          .select({ id: users.id, tokenVersion: users.tokenVersion })
          .from(users)
          .where(
            and(
              eq(users.id, decodedRefreshToken.userId),
              eq(users.tokenVersion, decodedRefreshToken.tokenVersion),
            ),
          );

        if (!user) {
          return unauthorized();
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, decodedRefreshToken.userId);
        });
      } catch (jwtError) {
        console.log('WebSocket upgrade: Refresh token invalid or expired.');
        return unauthorized();
      }
    } catch (e) {
      console.error('WebSocket upgrade: Error during processing:', e);
      return unauthorized();
    }
  });

  console.log('WebSocket server initialized and attached to HTTP server.');
};
