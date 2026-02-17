/**
 * Katsaus AI – Firebase Cloud Functions (Node.js).
 * Alustus: funktiot tulevat tähän kun Firebase-projekti on valmis.
 */

import { onRequest } from "firebase-functions/v2/https";
import type { Request, Response } from "express";

export const hello = onRequest((_req: Request, res: Response) => {
  res.json({ message: "Katsaus AI – functions ready" });
});
