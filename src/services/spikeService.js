// src/services/spikeService.js
import { getRedisClient } from "../config/redis.js";
import { clipQueue } from "../jobs/clipQueue.js";

const WINDOW_MS = 60 * 1000;
const SPIKE_MULTIPLIER = 4;

const messagesKey = (channel) => `autoclipper:msgs:${channel}`;
const baselineKey = (channel) => `autoclipper:base:${channel}`;

export const pushMessage = async (channel, ts = Date.now()) => {
  const client = getRedisClient();
  await client.zAdd(messagesKey(channel), [{ score: ts, value: String(ts) }]);
  // expire key to keep memory small
  await client.expire(messagesKey(channel), 60 * 60 * 24);
};

export const checkSpike = async (channel) => {
  const client = getRedisClient();
  const now = Date.now();
  const start = now - WINDOW_MS;
  const count = await client.zCount(messagesKey(channel), start, now);

  let baseline = await client.get(baselineKey(channel));
  baseline = baseline ? parseInt(baseline, 10) : 1;

  // moving average (simple)
  const newBaseline = Math.max(1, Math.round((baseline * 4 + count) / 5));
  await client.set(baselineKey(channel), String(newBaseline), { EX: 60 * 60 * 24 });

  const isSpike = count >= Math.max(3, newBaseline * SPIKE_MULTIPLIER);
  return isSpike ? { channel, count, baseline: newBaseline } : null;
};

export const handleSpike = async (channel, opts = {}) => {
  const job = await clipQueue.add({ channel, opts });
  return job;
};
