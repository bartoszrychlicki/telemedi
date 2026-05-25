import { NextResponse } from "next/server";

import { missingProductionEnv } from "@/lib/env";

export async function GET() {
  const missingEnv = missingProductionEnv();

  return NextResponse.json({
    ok: missingEnv.length === 0,
    service: "telemedi-medycyna-pracy",
    env: process.env.NODE_ENV ?? "development",
    missingEnv,
  });
}
