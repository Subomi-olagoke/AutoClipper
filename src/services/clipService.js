// src/services/clipService.js
import { clipQueue } from "../jobs/clipQueue.js";

export const requestClipForChannel = async (channel, opts = {}) => {
  // add job to queue
  const job = await clipQueue.add({ channel, meta: opts });
  return job;
};


