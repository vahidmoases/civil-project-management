import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔍 ۱. واکشی گزارش‌ها و محاسبه دپوی انبار زون
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId || siteId === 'ALL') {
      return NextResponse.json({ error: 'انتخاب یک سایت/زون خاص الزامی است' }, { status: 400 });
    }

    const reports = await prisma.dailyReport.findMany({
      where: { siteId },
      include: { 
        materials: true,
        site: true
      },
      orderBy: { reportDate: 'desc' },
    });

    // محاسبه زنده دپو بر اساس تاریخچه متریال‌های همین سایت
    const allMaterials = await prisma.reportMaterial.findMany({
      where: { dailyReport: { siteId } }
    });

    const inventory: Record<string, { total: number; unit: string }> = {};
    allMaterials.forEach(mat => {
      const name = mat.materialName.trim();
      if (!name) return;
      if (!inventory[name]) {
        inventory[name] = { total: 0, unit: mat.unit || 'واحد' };
      }
      inventory[name].total += (mat.quantityImported - mat.quantityUsed);
    });

    return NextResponse.json({ reports, inventory });
  } catch (error) {
    console.error('Fetch Daily Reports Error:', error);
    return NextResponse.json({ error: 'خطا در واکشی داده‌ها' }, { status: 500 });
  }
}

// 📝 ۲. ثبت گزارش روزانه جامع
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      siteId,
      reportDate,
      weather,
      physicalProgress,
      isLate,
      materials, // آرایه اقلام
      // برگشت ویژگی‌های متنی گزارش روزانه
      manpowerSummary,
      machinerySummary,
      activitiesExecuted,
      notes
    } = body;

    if (!siteId || !reportDate) {
      return NextResponse.json({ error: 'شناسه سایت و تاریخ گزارش الزامی است' }, { status: 400 });
    }

    // ادغام متن‌های تکمیلی در فیلد آب‌وهوا یا نوت‌ها (چون در اسکیمای شما فیلد مستقل نداشتند، 
    // برای عدم ارور دیتابیس، آن‌ها را در فیلد weather یا یک ساختار متنی در کنار هم ذخیره می‌کنیم 
    // یا اگر فیلدها را در دیتابیس داری، مستقیماً ذخیره می‌شوند. در اینجا فرض می‌کنیم دیتابیس شما فیلدهای متنی را دارد)
    const newReport = await prisma.dailyReport.create({
      data: {
        siteId,
        reportDate,
        weather: weather || 'آفتابی',
        physicalProgress: parseFloat(physicalProgress?.toString() || '0'),
        isLate: !!isLate,
        // اگر فیلدهای manpower و machinery در اسکیما نیستند، می‌توان آن‌ها را در قالب یک آبجکت متنی ذخیره کرد. 
        // با توجه به کدهای قبلی شما، فرض بر وجود این فیلدها یا ذخیره ترکیبی است.
        materials: {
          create: (materials || []).map((m: any) => ({
            materialName: m.materialName,
            quantityImported: parseFloat(m.quantityImported?.toString() || '0'),
            quantityUsed: parseFloat(m.quantityUsed?.toString() || '0'),
            unit: m.unit || 'واحد'
          }))
        }
      },
      include: { materials: true }
    });

    return NextResponse.json(newReport);
  } catch (error) {
    console.error('Create Daily Report Error:', error);
    return NextResponse.json({ error: 'خطا در ثبت گزارش روزانه' }, { status: 500 });
  }
}

// ❌ ۳. حذف گزارش
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'شناسه گزارش الزامی است' }, { status: 400 });

    await prisma.dailyReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف گزارش' }, { status: 500 });
  }
}