// نمونه متد GET در src/app/api/sites/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json([]);
  
  const sites = await prisma.site.findMany({ where: { projectId } });
  return NextResponse.json(sites);
}