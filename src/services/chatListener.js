import tmi from "tmi.js";
import { pushMessage, checkSpike } from "./spikeService.js";
import { handleSpike } from "./clipService.js"; // function to create clip

const clients = new Map(); // channel -> client

export const startListening = (channel) => {
  if (clients.has(channel)) return;

  const client = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    channels: [channel],
  });

  client.connect().catch(err => console.error("TMI connect err:", err));

  client.on("message", (target, context, msg, self) => {
    if (self) return;
    const now = Date.now();
    pushMessage(channel, now);

    const spike = checkSpike(channel);
    if (spike) {
      console.log(`⚡ Spike detected on ${channel}`, spike);
      // handle spike (async): create clip or enqueue job
      handleSpike(channel, { spike }).catch(err => console.error("handleSpike err:", err));
    }
  });

  clients.set(channel, client);
};

export const stopListening = async (channel) => {
  const c = clients.get(channel);
  if (!c) return;
  await c.disconnect();
  clients.delete(channel);
};
