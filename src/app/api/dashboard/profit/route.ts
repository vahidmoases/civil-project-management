import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) return NextResponse.json({ error: 'کد کارگاه الزامی است' }, { status: 400 });

    // ۱. جمع کل درآمدها (صورت‌وضعیت‌های تایید شده کارفرمای اصلی پروژه)
    const projectInvoices = await prisma.projectInvoice.findMany({
      where: { projectId }
    });
    const totalRevenue = projectInvoices.reduce((sum, inv) => sum + inv.cumulativeApproved, 0);

    // ۲. جمع کل هزینه‌ها (کارکرد ناخالص تمام پیمانکاران جزء در این پروژه)
    const subcontractors = await prisma.subcontractor.findMany({
      where: { projectId },
      include: { invoices: true }
    });

    let totalExpense = 0;
    subcontractors.forEach(sub => {
      sub.invoices.forEach(inv => {
        totalExpense += inv.grossAmount; // کارکرد ناخالص پیمانکار جزء ملاک هزینه کارگاه است
      });
    });

    // ۳. محاسبه سود خالص مدیریت کارگاه
    const netProfit = totalRevenue - totalExpense;
    const profitMarginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return NextResponse.json({
      projectId,
      totalRevenue,       // کل درآمد کارفرما
      totalExpense,       // کل هزینه اکیپ‌ها
      netProfit,          // سود خالص پروژه
      profitMarginPercentage: parseFloat(profitMarginPercentage.toFixed(2)) // درصد سوددهی کارگاه
    });

  } catch (error) {
    return NextResponse.json({ error: 'خطا در محاسبه تراز سود و زیان داشبورد' }, { status: 500 });
  }
}