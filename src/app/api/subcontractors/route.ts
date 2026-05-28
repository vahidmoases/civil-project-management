import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1️⃣ دریافت لیست پیمانکاران (بدون تغییر در منطق اصلی شما)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const subcontractors = await prisma.subcontractor.findMany({
      where: projectId ? { projectId } : {}, 
      include: { site: true, invoices: true },
    });
    
    return NextResponse.json(subcontractors);
  } catch (error) {
    console.error("API Error (GET):", error);
    return NextResponse.json({ error: 'خطای سرور در دریافت اطلاعات' }, { status: 500 });
  }
}

// 2️⃣ ثبت پیمانکار جدید (POST) - متصل به پرایزما
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      projectId, siteId, name, trade, phoneNumber, 
      contractNumber, contractDate, durationDays, contractAmount, 
      guaranteeType, checkDetails 
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 });
    }

    const newSubcontractor = await prisma.subcontractor.create({
      data: {
        projectId,
        siteId: siteId || null, // اگر سایتی انتخاب نشده بود، null شود
        name,
        trade,
        phoneNumber: phoneNumber || null,
        contractNumber: contractNumber || null,
        contractDate: contractDate || null,
        durationDays: parseInt(durationDays || '0'),
        contractAmount: parseFloat(contractAmount || '0'),
        guaranteeType,
        checkDetails: guaranteeType === 'CHECK' ? checkDetails : null, // اگر چک نبود مشخصات پاک شود
      },
    });

    return NextResponse.json(newSubcontractor);
  } catch (error) {
    console.error("API Error (POST):", error);
    return NextResponse.json({ error: 'خطا در ثبت پیمانکار جدید' }, { status: 500 });
  }
}

// 3️⃣ ویرایش اطلاعات قرارداد پیمانکار (PUT) - متصل به پرایزما
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, siteId, name, trade, phoneNumber, 
      contractNumber, contractDate, durationDays, contractAmount, 
      guaranteeType, checkDetails 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه پیمانکار برای ویرایش الزامی است' }, { status: 400 });
    }

    const updatedSubcontractor = await prisma.subcontractor.update({
      where: { id },
      data: {
        siteId: siteId || null,
        name,
        trade,
        phoneNumber: phoneNumber || null,
        contractNumber: contractNumber || null,
        contractDate: contractDate || null,
        durationDays: parseInt(durationDays || '0'),
        contractAmount: parseFloat(contractAmount || '0'),
        guaranteeType,
        checkDetails: guaranteeType === 'CHECK' ? checkDetails : null,
      },
    });

    return NextResponse.json(updatedSubcontractor);
  } catch (error) {
    console.error("API Error (PUT):", error);
    return NextResponse.json({ error: 'خطا در بروزرسانی اطلاعات پیمانکار' }, { status: 500 });
  }
}

// 4️⃣ حذف پیمانکار (DELETE) - متصل به پرایزما
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    // ابتدا در صورت نیاز ریز صورت وضعیت‌ها حذف می‌شوند (اگر در دیتابیس Cascade تعریف نکرده باشید)
    await prisma.subcontractorInvoice.deleteMany({
      where: { subcontractorId: id }
    });

    await prisma.subcontractor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error (DELETE):", error);
    return NextResponse.json({ error: 'خطا در حذف پیمانکار' }, { status: 500 });
  }
}