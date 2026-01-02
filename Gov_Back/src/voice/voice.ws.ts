import WebSocket, { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

type VoiceMessage =
  | { type: "START_SESSION"; payload?: { userId?: string | null } }
  | { type: "AUDIO_CHUNK"; payload: { audio: string } }
  | { type: "END_CALL" };

export function startVoiceWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    let voiceSessionId: string | null = null;

    console.log("Voice client connected");

    ws.on("message", async (raw) => {
      let message: VoiceMessage;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        console.log("Invalid JSON message");
        return;
      }

      switch (message.type) {
        case "START_SESSION": {
          voiceSessionId = randomUUID();

          await prisma.voiceSession.create({
            data: {
              id: voiceSessionId,
              sessionStatus: "ACTIVE",
            },
          });

          console.log("START_SESSION", voiceSessionId);

          ws.send(
            JSON.stringify({
              type: "SESSION_STARTED",
              payload: { voiceSessionId },
            })
          );
          break;
        }

        case "AUDIO_CHUNK": {
          if (!voiceSessionId) {
            console.log("AUDIO_CHUNK before START_SESSION");
            return;
          }
          console.log("AUDIO_CHUNK received (ignored for now)");
          break;
        }

        case "END_CALL": {
          if (voiceSessionId) {
            await prisma.voiceSession.update({
              where: { id: voiceSessionId },
              data: { sessionStatus: "COMPLETED" },
            });
          }

          console.log("END_CALL", voiceSessionId);
          ws.close();
          break;
        }

        default:
          console.log("Unknown message type");
      }
    });

    ws.on("close", () => {
      console.log("Voice connection closed", voiceSessionId);
    });
  });

  console.log(`Voice WebSocket server running on ws://localhost:${port}`);
}
