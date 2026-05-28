'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  
  const [summary, setSummary] = useState({ 
    totalIncome: 0, 
    totalTemporary: 0, 
    totalAdjustment: 0, 
    totalBarter: 0, 
    totalDebt: 0, 
    totalApprovedWithVat: 0 
  });
  const [projectDetails, setProjectDetails] = useState({ name: '', contractAmount: 0 });
  const [invoices, setInvoices] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    invoiceType: 'CASH_TEMPORARY', invoiceNumber: '', periodFrom: '', periodTo: '',
    letterSendDate: '', reviewDate: '', cumulativeSent: '', cumulativeApproved: '', actualPaid: '', description: ''
  });

  const fetchInvoices = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/invoices?projectId=${projectId}`);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
        setSummary(data.summary);
        setProjectDetails(data.projectDetails);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchInvoices(); }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/invoices';
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId ? { id: editingId, projectId, ...formData } : { projectId, ...formData };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchInvoices();
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({ invoiceType: 'CASH_TEMPORARY', invoiceNumber: '', periodFrom: '', periodTo: '', letterSendDate: '', reviewDate: '', cumulativeSent: '', cumulativeApproved: '', actualPaid: '', description: '' });
      } else { alert("خطا در پردازش اطلاعات"); }
    } catch (e) { alert("خطای ارتباط با سرور"); }
  };

  const handleEdit = (inv: any) => {
    setEditingId(inv.id);
    setFormData({
      invoiceType: inv.invoiceType, invoiceNumber: inv.invoiceNumber.toString(),
      periodFrom: inv.periodFrom, periodTo: inv.periodTo, letterSendDate: inv.letterSendDate,
      reviewDate: inv.reviewDate || '', cumulativeSent: inv.cumulativeSent.toString(),
      cumulativeApproved: inv.cumulativeApproved.toString(), actualPaid: inv.actualPaid.toString(),
      description: inv.description || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این صورت‌وضعیت مالی اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchInvoices();
    } catch (e) { alert("حذف انجام نشد"); }
  };

  const formatNumber = (num: number | string) => {
    if (!num || num === '0') return '۰';
    return Math.round(Number(num)).toLocaleString('fa-IR');
  };

  const formatWithSign = (num: number, sign: '+' | '-') => {
    if (!num) return '۰';
    const formatted = Math.round(num).toLocaleString('fa-IR');
    return <span className="inline-flex items-center gap-0.5"><span className="font-sans text-[10px] text-gray-400">{sign}</span>{formatted}</span>;
  };

  // محاسبات مهندسی کنترل پروژه (مقاوم در برابر مقدار صفر یا ست نشده)
  const contractAmount = projectDetails.contractAmount || 0;
  const progressPercent = contractAmount > 0 ? (summary.totalApprovedWithVat / contractAmount) * 100 : 0;
  const maxAllowedAmount = contractAmount * 1.25; 

  const isOverContract = contractAmount > 0 && summary.totalApprovedWithVat > contractAmount;
  const isOverCeiling = contractAmount > 0 && summary.totalApprovedWithVat > maxAllowedAmount;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12" dir="rtl">
      <main className="max-w-[98%] mx-auto pt-6">
        
        {/* هدر اطلاعات اختصاصی پیمان مانیتور شده */}
        {projectId && projectDetails.name && (
          <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded">پروژه فعال</span>
              <h3 className="text-xs font-bold text-gray-800 mt-1">{projectDetails.name}</h3>
            </div>
            
            {/* لایه کنترل پیشرفت ریالی و سقف پیمان */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>پیشرفت ریالی قرارداد:</span>
                <span className="font-bold font-mono text-blue-600">{progressPercent.toFixed(1)}٪</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all ${isOverCeiling ? 'bg-red-600' : isOverContract ? 'bg-amber-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* بخش وضعیت هشدارهای سازمان برنامه */}
            <div className="text-left">
              {isOverCeiling ? (
                <div className="inline-block bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  ⚠️ هشدار: کارکرد پروژه از سقف ۱۲۵٪ کل پیمان عبور کرده است! (نیاز به متمم قرارداد)
                </div>
              ) : isOverContract ? (
                <div className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  💡 وضعیت: پروژه در محدوده ۲۵٪ ابلاغ افزایش مقادیر است.
                </div>
              ) : contractAmount === 0 ? (
                <div className="inline-block bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  ℹ️ اطلاعات: مبلغ اولیه قرارداد برای این کارگاه هنوز تنظیم نشده است.
                </div>
              ) : (
                <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  ✅ وضعیت مالی: کارکرد در محدوده سقف اولیه پیمان مجاز است.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-gray-800">دفتر کل مهندسی مالی و کارکرد مراجع کارگاهی</h2>
            <p className="text-xs text-gray-500">مبالغ اولیه قرارداد: <span className="font-mono text-gray-700 font-bold">{formatNumber(contractAmount)}</span> ریال</p>
          </div>
          {projectId && (
            <button 
              onClick={() => { setIsFormOpen(!isFormOpen); if(isFormOpen) setEditingId(null); }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {isFormOpen ? 'بستن فرم کارکرد' : '➕ ثبت کارکرد تفاضلی جدید'}
            </button>
          )}
        </div>

        {!projectId ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">لطفاً برای بارگذاری دیتای مالی کارگاه، یک پروژه را از منوی بالای سایت انتخاب کنید.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* کارت‌های پنج‌گانه مالی */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { title: 'جمع کل واریزی‌های واقعی کارفرما', value: summary.totalIncome, color: 'border-r-4 border-blue-600 bg-blue-50/10' },
                { title: 'جمع مطالبات معوق کل (بدهی کارفرما)', value: summary.totalDebt, color: 'border-r-4 border-red-600 bg-red-50/10 text-red-900' },
                { title: 'جمع صورت وضعیت‌های موقت', value: summary.totalTemporary, color: 'border-r-4 border-amber-500' },
                { title: 'جمع کل تعدیل‌های تایید شده', value: summary.totalAdjustment, color: 'border-r-4 border-emerald-500' },
                { title: 'کارکرد تهاتری تایید شده', value: summary.totalBarter, color: 'border-r-4 border-purple-500' }
              ].map((card, idx) => (
                <div key={idx} className={`bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 ${card.color}`}>
                  <span className="text-[10.5px] font-bold text-gray-500 block leading-tight">{card.title}</span>
                  <div className="text-[13.5px] font-bold text-gray-800 mt-2 font-mono tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatNumber(card.value)} <span className="text-[9px] font-normal text-gray-400">ریال</span>
                  </div>
                </div>
              ))}
            </div>

            {/* فرم ورود اطلاعات مالی */}
            {isFormOpen && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
                <h2 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">
                  {editingId ? '⚠️ ویرایش سند مالی کارگاه' : '➕ ثبت هوشمند صورت‌وضعیت / تعدیل'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">نوع سند مالی</label>
                    <select className="w-full rounded-lg border-gray-300 text-xs p-2 border bg-gray-50" value={formData.invoiceType} onChange={(e) => setFormData({...formData, invoiceType: e.target.value})}>
                      <option value="CASH_TEMPORARY">صورت وضعیت موقت (نقدی)</option>
                      <option value="CASH_ADJUSTMENT">تعدیل (نقدی)</option>
                      <option value="BARTER">صورت وضعیت تهاتری (بیمه ۷.۸٪)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">شماره سند</label>
                    <input type="number" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">کارکرد - از تاریخ</label>
                    <input type="text" placeholder="۱۴۰۵/۰۱/۰۱" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.periodFrom} onChange={(e) => setFormData({...formData, periodFrom: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">کارکرد - تا تاریخ</label>
                    <input type="text" placeholder="۱۴۰۵/۰۲/۳۰" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.periodTo} onChange={(e) => setFormData({...formData, periodTo: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">تاریخ ارسال نامه</label>
                    <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.letterSendDate} onChange={(e) => setFormData({...formData, letterSendDate: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">تاریخ رسیدگی (اختیاری)</label>
                    <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.reviewDate} onChange={(e) => setFormData({...formData, reviewDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">مبلغ تجمعی ارسالی</label>
                    <input type="number" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.cumulativeSent} onChange={(e) => setFormData({...formData, cumulativeSent: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">مبلغ تجمعی تایید شده</label>
                    <input type="number" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.cumulativeApproved} onChange={(e) => setFormData({...formData, cumulativeApproved: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">مبلغ واریز شده واقعی کارفرما</label>
                    <input type="number" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.actualPaid} onChange={(e) => setFormData({...formData, actualPaid: e.target.value})} required />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">توضیحات</label>
                    <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                    {editingId && (
                      <button type="button" onClick={() => { setEditingId(null); setIsFormOpen(false); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg">انصراف</button>
                    )}
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-xs font-semibold shadow-sm">
                      {editingId ? 'ذخیره تغییرات سند' : 'محاسبه تفاضلی دفتری و ثبت'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* جدول دفتر کل مهندسی مالی */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[10.5px] border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200 bg-gray-50/70">
                      <th className="p-2 font-semibold">عنوان سند</th>
                      <th className="p-2 font-semibold">دوره کارکرد</th>
                      <th className="p-2 font-semibold">کارکرد خالص دوره</th>
                      <th className="p-2 font-semibold">۱۰٪ ارزش‌افزوده</th>
                      <th className="p-2 font-semibold">۱۰٪ حسن انجام کار</th>
                      <th className="p-2 font-semibold">بیمه قانونی</th>
                      <th className="p-2 font-semibold bg-red-50/40 text-red-700">جمع کل کسورات (ریال)</th>
                      <th className="p-2 font-semibold bg-emerald-50/40 text-emerald-700">مبلغ پرداختی با کسر کسورات (ریال)</th>
                      <th className="p-2 font-semibold bg-blue-50/60 text-blue-800">مبلغ پرداختی با ارزش افزوده (ریال)</th>
                      <th className="p-2 font-semibold text-purple-700">واریزی کارفرما</th>
                      <th className="p-2 font-semibold text-red-600">مانده طلب/بدهی سند</th>
                      <th className="p-2 font-semibold text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-mono">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-2 font-sans">
                          <div className="font-bold text-gray-900">
                            {inv.invoiceType === 'CASH_TEMPORARY' && `صورت وضعیت موقت ${inv.invoiceNumber}`}
                            {inv.invoiceType === 'CASH_ADJUSTMENT' && `تعدیل شماره ${inv.invoiceNumber}`}
                            {inv.invoiceType === 'BARTER' && `تهاتری شماره ${inv.invoiceNumber}`}
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">ارسال: {inv.letterSendDate} {inv.reviewDate ? `| رسیدگی: ${inv.reviewDate}` : ''}</div>
                        </td>
                        <td className="p-2 text-gray-500 font-sans text-[10px]">
                          {inv.periodFrom} <br /> {inv.periodTo}
                        </td>
                        <td className="p-2 font-medium text-gray-900">{formatNumber(inv.periodPerformance)}</td>
                        <td className="p-2 text-emerald-600">{formatWithSign(inv.vatAmount, '+')}</td>
                        <td className="p-2 text-red-600">{formatWithSign(inv.retentionDeduction, '-')}</td>
                        <td className="p-2 text-red-600">
                          {formatWithSign(inv.insuranceDeduction, '-')}
                          <span className="text-[9px] text-gray-400 mr-0.5 font-sans">({inv.invoiceType === 'BARTER' ? '۷.۸٪' : '۱.۶٪'})</span>
                        </td>
                        <td className="p-2 text-red-700 bg-red-50/20 font-bold">{formatNumber(inv.totalDeductions)}</td>
                        <td className="p-2 text-emerald-700 bg-emerald-50/20 font-bold">{formatNumber(inv.netPayment)}</td>
                        <td className="p-2 font-bold text-blue-800 bg-blue-50/50">{formatNumber(inv.finalPaymentWithVat)}</td>
                        <td className="p-2 font-bold text-purple-700 bg-purple-50/20">{formatNumber(inv.actualPaid)}</td>
                        <td className={`p-2 font-bold ${inv.remainingDebt > 0 ? 'text-red-600 bg-red-50/20' : 'text-emerald-600'}`}>
                          {formatNumber(inv.remainingDebt)}
                        </td>
                        <td className="p-2 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEdit(inv)} className="text-blue-600 hover:text-blue-800 text-[10px] font-bold bg-blue-50 px-2 py-1 rounded">ویرایش</button>
                            <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold bg-red-50 px-2 py-1 rounded">حذف</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}