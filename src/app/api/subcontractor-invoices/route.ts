import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 💡 پیشنهاد می‌شود از نمونه واحد پرایزما پروژه استفاده کنید تا کانکشن‌ها منفجر نشوند
// اگر فایل فوق را ندارید، همان خط‌های خودتان را نگه دارید:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// 📁 ۱. واکشی ریز صورت‌وضعیت‌های یک پیمانکار خاص
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subcontractorId = searchParams.get('subcontractorId');

    if (!subcontractorId) {
      return NextResponse.json({ error: 'شناسه پیمانکار الزامی است' }, { status: 400 });
    }

    const invoices = await prisma.subcontractorInvoice.findMany({
      where: { subcontractorId },
      orderBy: { invoiceNumber: 'asc' }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در واکشی صورت‌وضعیت‌ها' }, { status: 500 });
  }
}

// 🧾 ۲. ثبت صورت‌وضعیت جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      subcontractorId, 
      invoiceNumber, 
      grossAmount, 
      retentionDeduction, 
      guaranteeDeduction, 
      netApproved, 
      centralApproved, 
      actualPaid 
    } = body;

    if (!subcontractorId || !invoiceNumber) {
      return NextResponse.json({ error: 'اطلاعات اجباری صورت‌وضعیت وارد نشده است' }, { status: 400 });
    }

    const newInvoice = await prisma.subcontractorInvoice.create({
      data: {
        subcontractorId,
        invoiceNumber: parseInt(invoiceNumber.toString()),
        grossAmount: parseFloat(grossAmount.toString() || '0'),
        retentionDeduction: parseFloat(retentionDeduction.toString() || '0'),
        guaranteeDeduction: parseFloat(guaranteeDeduction.toString() || '0'),
        netApproved: parseFloat(netApproved.toString() || '0'),
        centralApproved: centralApproved ? parseFloat(centralApproved.toString()) : parseFloat(netApproved.toString()),
        actualPaid: actualPaid ? parseFloat(actualPaid.toString()) : 0
      }
    });

    return NextResponse.json(newInvoice);
  } catch (error) {
    console.error('Invoice Creation Error:', error);
    return NextResponse.json({ error: 'خطا در ثبت ریز صورت‌وضعیت در دیتابیس' }, { status: 500 });
  }
}

// ✏️ ۳. ویرایش و بروزرسانی صورت‌وضعیت موجود (PUT) - حل مشکل دکمه ویرایش فرانت‌اند
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      invoiceNumber, 
      grossAmount, 
      retentionDeduction, 
      guaranteeDeduction, 
      netApproved, 
      centralApproved, 
      actualPaid 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه صورت‌وضعیت برای ویرایش الزامی است' }, { status: 400 });
    }

    const updatedInvoice = await prisma.subcontractorInvoice.update({
      where: { id },
      data: {
        invoiceNumber: parseInt(invoiceNumber.toString()),
        grossAmount: parseFloat(grossAmount.toString() || '0'),
        retentionDeduction: parseFloat(retentionDeduction.toString() || '0'),
        guaranteeDeduction: parseFloat(guaranteeDeduction.toString() || '0'),
        netApproved: parseFloat(netApproved.toString() || '0'),
        centralApproved: parseFloat(centralApproved.toString() || '0'),
        actualPaid: parseFloat(actualPaid.toString() || '0')
      }
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Invoice Update Error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی صورت‌وضعیت در دیتابیس' }, { status: 500 });
  }
}

// ❌ ۴. حذف یک صورت‌وضعیت خاص
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه صورت‌وضعیت الزامی است' }, { status: 400 });
    }

    await prisma.subcontractorInvoice.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'صورت‌وضعیت با موفقیت حذف شد' });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف صورت‌وضعیت' }, { status: 500 });
  }
}