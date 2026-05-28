import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "ارتباط با سرور برقرار است!", status: "success" });
}