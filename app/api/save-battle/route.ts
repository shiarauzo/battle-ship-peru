import { NextResponse } from "next/server";
import { db } from "@/db";
import { battles } from "@/db/schema";

export async function POST(req: Request) {
  const data = await req.json();

  await db.insert(battles).values({
    modelA: data.modelA,
    modelB: data.modelB,
    accuracyA: data.accuracyA,
    accuracyB: data.accuracyB,
    hitsA: data.hitsA,
    hitsB: data.hitsB,
    missesA: data.missesA,
    missesB: data.missesB,
    winner: data.winner,
  });

  return NextResponse.json({ ok: true });
}
