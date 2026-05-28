import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // واکشی پروژه‌ها به همراه لیست سایت‌هایشان
    const projects = await prisma.project.findMany({
      include: { sites: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در واکشی پروژه‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, clientName, contractNumber, contractDate, contractAmount, sites } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'کد کارگاه و نام پروژه الزامی هستند' }, { status: 400 });
    }

    // بررسی تکراری نبودن کد کارگاه
    const exists = await prisma.project.findUnique({ where: { id } });
    if (exists) {
      return NextResponse.json({ error: 'پروژه‌ای با این کد کارگاه قبلاً ثبت شده است' }, { status: 400 });
    }

    // ثبت پروژه و سایت‌ها به صورت هم‌زمان
    const newProject = await prisma.project.create({
      data: {
        id,
        name,
        clientName: clientName || "نامشخص",
        contractNumber: contractNumber || "نامشخص",
        contractDate: contractDate || "نامشخص",
        contractAmount: contractAmount ? parseFloat(contractAmount.toString()) : 0,
        sites: {
          create: Array.isArray(sites) ? sites.map((siteName: string) => ({ name: siteName })) : []
        }
      },
      include: { sites: true }
    });

    return NextResponse.json(newProject);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ایجاد پروژه' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, clientName, contractNumber, contractDate, contractAmount, sites } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 });
    }

    // در ویرایش پروژه: ابتدا سایت‌های قدیمی این پروژه را پاک می‌کنیم و سایت‌های جدید را جایگزین می‌کنیم
    // (این ساده‌ترین و مطمئن‌ترین روش برای دیتابیس‌های لوکال/عمرانی است)
    await prisma.site.deleteMany({ where: { projectId: id } });

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        clientName,
        contractNumber,
        contractDate,
        contractAmount: contractAmount ? parseFloat(contractAmount.toString()) : 0,
        sites: {
          create: Array.isArray(sites) ? sites.map((siteName: string) => ({ name: siteName })) : []
        }
      },
      include: { sites: true }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ویرایش پروژه' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });

    // به دلیل وجود onDelete: Cascade در اسکیما، با حذف پروژه، سایت‌ها و صورت‌وضعیت‌ها هم پاک می‌شوند
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف پروژه' }, { status: 500 });
  }
}