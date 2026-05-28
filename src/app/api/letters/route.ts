import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// دریافت نامه‌های یک پروژه
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'شناسه کارگاه الزامی است' }, { status: 400 });
    }

    const letters = await prisma.letter.findMany({
      where: { projectId },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(letters);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در واکشی نامه‌ها' }, { status: 500 });
  }
}

// ثبت نامه جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, letterNumber, title, type, sender, receiver, date, archivePath } = body;

    if (!projectId || !letterNumber || !title || !type || !sender || !receiver || !date) {
      return NextResponse.json({ error: 'فیلدهای اجباری پر نشده‌اند' }, { status: 400 });
    }

    // بررسی یکتا بودن شماره اندیکاتور برای جلوگیری از ارور دیتابیس
    const exists = await prisma.letter.findUnique({ where: { letterNumber } });
    if (exists) {
      return NextResponse.json({ error: 'این شماره اندیکاتور قبلاً ثبت شده است' }, { status: 400 });
    }

    const newLetter = await prisma.letter.create({
      data: {
        projectId,
        letterNumber,
        title,
        type,
        sender,
        receiver,
        date,
        archivePath: archivePath || null
      }
    });

    return NextResponse.json(newLetter);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ثبت نامه در دیتابیس' }, { status: 500 });
  }
}

// حذف نامه
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه نامه الزامی است' }, { status: 400 });
    }

    await prisma.letter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف نامه' }, { status: 500 });
  }
}