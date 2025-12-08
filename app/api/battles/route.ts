import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { battles } from "@/db/schema"
import { desc, eq, or } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get("model")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    let battleRecords

    if (model) {
      battleRecords = await db
        .select()
        .from(battles)
        .where(or(eq(battles.modelA, model), eq(battles.modelB, model)))
        .orderBy(desc(battles.id))
        .limit(limit)
        .offset(offset)
    } else {
      battleRecords = await db
        .select()
        .from(battles)
        .orderBy(desc(battles.id))
        .limit(limit)
        .offset(offset)
    }

    return NextResponse.json({
      success: true,
      data: battleRecords,
      count: battleRecords.length
    })
  } catch (error) {
    console.error("Error fetching battles:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch battles" },
      { status: 500 }
    )
  }
}