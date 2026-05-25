"use client";

import { sentinelClient } from "@better-auth/infra/client";
import { createAuthClient } from "better-auth/client";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [sentinelClient()],
});
