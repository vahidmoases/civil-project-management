import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'شناسه کارگاه الزامی است' }, { status: 400 });
    }

    // دریافت اطلاعات پروژه به همراه تمام صورت‌وضعیت‌های آن
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        invoices: {
          orderBy: { invoiceNumber: 'asc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'کارگاه یافت نشد' }, { status: 404 });
    }

    // محاسبات تجمعی و تفاضلی دفتر کل
    let totalIncome = 0;      // جمع واریزی‌های واقعی کارفرما
    let totalTemporary = 0;   // جمع خالص صورت وضعیت‌های موقت
    let totalAdjustment = 0;  // جمع تعدیل‌ها
    let totalBarter = 0;      // جمع تهاتری‌ها
    let totalApprovedWithVat = 0; // جمع کل کارکرد تایید شده با ارزش افزوده

    const formattedInvoices = project.invoices.map((inv, index) => {
      const prevInvoice = index > 0 ? project.invoices[index - 1] : null;
      const prevApproved = prevInvoice ? Number(prevInvoice.cumulativeApproved) : 0;
      const prevSent = prevInvoice ? Number(prevInvoice.cumulativeSent) : 0;

      // ۱. کارکرد خالص دوره (تفاضل تجمعی فعلی از تجمعی قبلی)
      const periodPerformance = Number(inv.cumulativeApproved) - prevApproved;

      // ۲. محاسبه کسورات و ارزش افزوده بر اساس نوع سند
      const vatAmount = periodPerformance * 0.10;
      const retentionDeduction = periodPerformance * 0.10;
      
      // نرخ بیمه: برای تهاتری ۷.۸٪ و برای نقدی ۱.۶٪
      const insuranceRate = inv.invoiceType === 'BARTER' ? 0.078 : 0.016;
      const insuranceDeduction = periodPerformance * insuranceRate;

      const totalDeductions = retentionDeduction + insuranceDeduction;
      const netPayment = periodPerformance - totalDeductions;
      const finalPaymentWithVat = netPayment + vatAmount;

      // ۳. محاسبه مانده طلب از این سند
      const remainingDebt = finalPaymentWithVat - Number(inv.actualPaid);

      // جمع زدن مقادیر برای کارت‌های بالای صفحه
      totalIncome += Number(inv.actualPaid);
      totalApprovedWithVat += finalPaymentWithVat;

      if (inv.invoiceType === 'CASH_TEMPORARY') totalTemporary += periodPerformance;
      if (inv.invoiceType === 'CASH_ADJUSTMENT') totalAdjustment += periodPerformance;
      if (inv.invoiceType === 'BARTER') totalBarter += periodPerformance;

      return {
        id: inv.id,
        invoiceType: inv.invoiceType,
        invoiceNumber: inv.invoiceNumber,
        periodFrom: inv.periodFrom,
        periodTo: inv.periodTo,
        letterSendDate: inv.letterSendDate,
        reviewDate: inv.reviewDate,
        actualPaid: Number(inv.actualPaid),
        cumulativeSent: Number(inv.cumulativeSent),
        cumulativeApproved: Number(inv.cumulativeApproved),
        periodPerformance,
        vatAmount,
        retentionDeduction,
        insuranceDeduction,
        totalDeductions,
        netPayment,
        finalPaymentWithVat,
        remainingDebt
      };
    });

    // جمع کل مطالبات معوق (بدهی کارفرما) = کل تایید شده با ارزش افزوده منهای کل واریزی‌ها
    const totalDebt = totalApprovedWithVat - totalIncome;

    return NextResponse.json({
      invoices: formattedInvoices,
      summary: {
        totalIncome,
        totalTemporary,
        totalAdjustment,
        totalBarter,
        totalDebt,
        totalApprovedWithVat // اضافه شده برای کنترل سقف
      },
      projectDetails: {
        name: project.name,
        contractAmount: project.contractAmount, // مبلغ اولیه پیمان برای فرانت
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'خطا در واکشی اطلاعات مالی' }, { status: 500 });
  }
}

// متدهای POST و PUT و DELETE دست‌نخورده باقی می‌مانند...
export async function POST(request: Request) { /* ...کد قبلی... */ }
export async function PUT(request: Request) { /* ...کد قبلی... */ }
export async function DELETE(request: Request) { /* ...کد قبلی... */ }