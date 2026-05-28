'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SubcontractorsContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [subs, setSubs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  
  // وضعیت‌های مدیریت فرم پیمانکار
  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  
  // وضعیت‌های مدیریت صورت وضعیت جدید
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [activeSubForInvoice, setActiveSubForInvoice] = useState<any>(null);

  // وضعیت‌های مدیریت آرشیو و ویرایش صورت وضعیت‌ها
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [activeSubForArchive, setActiveSubForArchive] = useState<any>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [subFormData, setSubFormData] = useState({
    siteId: '', name: '', trade: '', phoneNumber: '', contractNumber: '',
    contractDate: '', durationDays: '0', contractAmount: '0', guaranteeType: 'DEDUCTION', checkDetails: ''
  });

  const [invoiceFormData, setInvoiceFormData] = useState({ 
    invoiceNumber: '', grossAmount: '', centralApproved: '', actualPaid: '' 
  });

  const fetchData = async () => {
    if (!projectId) return;
    try {
      const resSubs = await fetch(`/api/subcontractors?projectId=${projectId}`);
      if (resSubs.ok) {
        const data = await resSubs.json();
        setSubs(data);
      }
      const resSites = await fetch(`/api/sites?projectId=${projectId}`);
      if (resSites.ok) setSites(await resSites.json());
    } catch (e) { console.error("Error fetching data:", e); }
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSubId ? 'PUT' : 'POST';
    const payload = editingSubId ? { id: editingSubId, ...subFormData } : { projectId, ...subFormData };

    try {
      const response = await fetch('/api/subcontractors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsSubFormOpen(false);
        setEditingSubId(null);
        resetSubForm();
        await fetchData();
      } else {
        alert('خطا در ذخیره‌سازی اطلاعات دیتابیس. لطفاً ورودی‌ها را بررسی کنید.');
      }
    } catch (err) {
      console.error("Error submitting subcontractor:", err);
    }
  };

  const handleEditSub = (sub: any) => {
    setEditingSubId(sub.id);
    setSubFormData({
      siteId: sub.siteId || '',
      name: sub.name,
      trade: sub.trade,
      phoneNumber: sub.phoneNumber || '',
      contractNumber: sub.contractNumber || '',
      contractDate: sub.contractDate || '',
      durationDays: sub.durationDays?.toString() || '0',
      contractAmount: sub.contractAmount?.toString() || '0',
      guaranteeType: sub.guaranteeType || 'DEDUCTION',
      checkDetails: sub.checkDetails || ''
    });
    setIsSubFormOpen(true);
  };

  const resetSubForm = () => {
    setSubFormData({
      siteId: '', name: '', trade: '', phoneNumber: '', contractNumber: '',
      contractDate: '', durationDays: '0', contractAmount: '0', guaranteeType: 'DEDUCTION', checkDetails: ''
    });
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(invoiceFormData.grossAmount || '0');
    const retention = gross * 0.10;
    const guarantee = activeSubForInvoice.guaranteeType === 'DEDUCTION' ? gross * 0.15 : 0;
    const netApproved = gross - (retention + guarantee);
    
    const central = parseFloat(invoiceFormData.centralApproved || '0');
    const paid = parseFloat(invoiceFormData.actualPaid || '0');

    const url = '/api/subcontractor-invoices';
    const payload = editingInvoiceId 
      ? { id: editingInvoiceId, subcontractorId: activeSubForInvoice.id, invoiceNumber: parseInt(invoiceFormData.invoiceNumber), grossAmount: gross, retentionDeduction: retention, guaranteeDeduction: guarantee, netApproved, centralApproved: central, actualPaid: paid }
      : { subcontractorId: activeSubForInvoice.id, invoiceNumber: parseInt(invoiceFormData.invoiceNumber), grossAmount: gross, retentionDeduction: retention, guaranteeDeduction: guarantee, netApproved, centralApproved: central, actualPaid: paid };

    const response = await fetch(url, {
      method: editingInvoiceId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setIsInvoiceFormOpen(false);
      setEditingInvoiceId(null);
      setInvoiceFormData({ invoiceNumber: '', grossAmount: '', centralApproved: '', actualPaid: '' });
      await fetchData();
    }
  };

  const handleEditInvoiceInline = (inv: any, sub: any) => {
    setActiveSubForInvoice(sub);
    setEditingInvoiceId(inv.id);
    setInvoiceFormData({
      invoiceNumber: inv.invoiceNumber.toString(),
      grossAmount: inv.grossAmount.toString(),
      centralApproved: inv.centralApproved.toString(),
      actualPaid: inv.actualPaid.toString()
    });
    setIsInvoiceFormOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('آیا از حذف این صورت وضعیت مطمئن هستید؟')) return;
    const res = await fetch(`/api/subcontractor-invoices?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
      setIsArchiveModalOpen(false);
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!confirm('آیا مایل به حذف پیمانکار و تمام ریز صورت‌وضعیت‌های آن هستید؟')) return;
    const res = await fetch(`/api/subcontractors?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
    }
  };

  const formatNumber = (num: string | number) => {
    if (!num) return '۰';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '۰';
    return value.toLocaleString('fa-IR');
  };

  const filteredSubs = subs.filter((sub: any) => selectedSiteFilter === 'ALL' || sub.siteId === selectedSiteFilter);

  // 📊 محاسبات تجمعی کل کارگاه
  let totalProjectGross = 0;
  let totalProjectCentralApproved = 0;
  let totalProjectPaid = 0;

  subs.forEach((sub: any) => {
    sub.invoices?.forEach((inv: any) => {
      totalProjectGross += inv.grossAmount || 0;
      totalProjectCentralApproved += inv.centralApproved || 0;
      totalProjectPaid += inv.actualPaid || 0;
    });
  });
  const totalProjectDebt = totalProjectCentralApproved - totalProjectPaid;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12" dir="rtl">
      <main className="max-w-[98%] mx-auto pt-6 px-2">
        
        {/* هدر صفحه */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-gray-800">📊 سیستم مالی و تراز مبالغ پیمانکاران جزء</h2>
            <p className="text-[11px] text-gray-500 mt-1">مدیریت قراردادها، کسورات قانونی کارگاه، کنترل تاییدیه دفتر مرکزی و واریزی‌ها</p>
          </div>
          {projectId && (
            <button onClick={() => { setIsSubFormOpen(!isSubFormOpen); if(isSubFormOpen) { setEditingSubId(null); resetSubForm(); } }} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold">
              {isSubFormOpen ? '✖ بستن فرم' : '➕ ثبت پیمانکار جدید'}
            </button>
          )}
        </div>

        {/* 💳 کارت‌های گزارش تجمعی بالای صفحه */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[11px] text-gray-500 block">کل کارکرد ناخالص (هزینه کارگاه)</span>
            <div className="text-sm font-bold text-gray-900 mt-1 font-mono">{formatNumber(totalProjectGross)} <span className="text-[10px] text-gray-400 font-sans">ریال</span></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-r-4 border-r-blue-500">
            <span className="text-[11px] text-blue-600 block">کل تایید شده دفتر مرکزی</span>
            <div className="text-sm font-bold text-blue-900 mt-1 font-mono">{formatNumber(totalProjectCentralApproved)} <span className="text-[10px] text-gray-400 font-sans">ریال</span></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-r-4 border-r-emerald-500">
            <span className="text-[11px] text-emerald-600 block">کل پرداختی‌ها و مساعده‌ها</span>
            <div className="text-sm font-bold text-emerald-900 mt-1 font-mono">{formatNumber(totalProjectPaid)} <span className="text-[10px] text-gray-400 font-sans">ریال</span></div>
          </div>
          <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-r-4 ${totalProjectDebt >= 0 ? 'border-r-amber-500' : 'border-r-indigo-500'}`}>
            <span className="text-[11px] text-gray-600 block">{totalProjectDebt >= 0 ? 'مانده بدهی به پیمانکاران' : 'طلب شرکت (پیش‌پرداخت اضافی)'}</span>
            <div className={`text-sm font-bold mt-1 font-mono ${totalProjectDebt >= 0 ? 'text-amber-600' : 'text-indigo-600'}`}>{formatNumber(Math.abs(totalProjectDebt))} <span className="text-[10px] text-gray-400 font-sans">ریال</span></div>
          </div>
        </div>

        {/* 📝 فرم ثبت و ویرایش اطلاعات قرارداد پیمانکار */}
        {isSubFormOpen && (
          <form onSubmit={handleSubSubmit} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="sm:col-span-4 font-bold text-xs text-blue-600">{editingSubId ? '✏️ ویرایش اطلاعات قرارداد پیمانکار' : '✨ مشخصات قرارداد اولیه پیمانکار جزء جدید'}</div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">محل سایت/بلوک</label>
              <select className="w-full text-xs p-2 border rounded-lg bg-gray-50 font-bold" value={subFormData.siteId} onChange={(e) => setSubFormData({...subFormData, siteId: e.target.value})}>
                <option value="">کل پروژه / بدون تفکیک</option>
                {sites.map((s: any) => <option key={s.id} value={s.id}>📍 {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">نام پیمانکار</label>
              <input type="text" className="w-full text-xs p-2 border rounded-lg" value={subFormData.name} onChange={(e) => setSubFormData({...subFormData, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">رسته فعالیت</label>
              <input type="text" className="w-full text-xs p-2 border rounded-lg" value={subFormData.trade} onChange={(e) => setSubFormData({...subFormData, trade: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">شماره تماس</label>
              <input type="text" className="w-full text-xs p-2 border rounded-lg font-sans" value={subFormData.phoneNumber} onChange={(e) => setSubFormData({...subFormData, phoneNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">شماره قرارداد</label>
              <input type="text" className="w-full text-xs p-2 border rounded-lg" value={subFormData.contractNumber} onChange={(e) => setSubFormData({...subFormData, contractNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">تاریخ ابلاغ قرارداد</label>
              <input type="text" placeholder="۱۴۰۵/۰۲/۱۵" className="w-full text-xs p-2 border rounded-lg" value={subFormData.contractDate} onChange={(e) => setSubFormData({...subFormData, contractDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">مدت پیمان (روز)</label>
              <input type="number" className="w-full text-xs p-2 border rounded-lg font-sans" value={subFormData.durationDays} onChange={(e) => setSubFormData({...subFormData, durationDays: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">مبلغ اولیه قرارداد (ریال)</label>
              <input type="number" className="w-full text-xs p-2 border rounded-lg font-sans" value={subFormData.contractAmount} onChange={(e) => setSubFormData({...subFormData, contractAmount: e.target.value})} />
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">🔍 نمای خوانا: {formatNumber(subFormData.contractAmount)} ریال</span>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">شرط ضمانت حسن انجام کار</label>
              <select className="w-full text-xs p-2 border rounded-lg bg-gray-50 font-bold" value={subFormData.guaranteeType} onChange={(e) => setSubFormData({...subFormData, guaranteeType: e.target.value})}>
                <option value="DEDUCTION">❌ کسر ۱۵٪ از هر صورت‌وضعیت کارگاه</option>
                <option value="CHECK">💵 اخذ چک ضمانتی صیادی (بدون کسر درصد)</option>
              </select>
            </div>
            
            {subFormData.guaranteeType === 'CHECK' && (
              <div className="sm:col-span-3 transition-all duration-300">
                <label className="block text-xs font-bold text-amber-600 mb-1">مشخصات بانک، شماره چک و شناسه ۱۶ رقمی صیادی تضمین دریافتی</label>
                <input type="text" placeholder="مثال: چک بانک صادرات شعبه مرکزی به شماره ۴۵۶۷ و شناسه صیادی..." className="w-full text-xs p-2 border border-amber-300 rounded-lg bg-amber-50/40" value={subFormData.checkDetails} onChange={(e) => setSubFormData({...subFormData, checkDetails: e.target.value})} required />
              </div>
            )}

            <div className="sm:col-span-4 flex justify-end gap-2 border-t pt-3 mt-2">
              <button type="button" onClick={() => { setIsSubFormOpen(false); setEditingSubId(null); resetSubForm(); }} className="bg-gray-200 text-xs px-4 py-2 rounded-lg">انصراف</button>
              <button type="submit" className="bg-emerald-600 text-white text-xs px-6 py-2 rounded-lg font-bold">ذخیره نهایی پرونده قرارداد</button>
            </div>
          </form>
        )}

        {/* 🧾 فرم ثبت/ویرایش صورت وضعیت */}
        {isInvoiceFormOpen && activeSubForInvoice && (
          <form onSubmit={handleInvoiceSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="text-xs font-bold text-blue-900 mb-4">
              {editingInvoiceId ? '✏️ ویرایش صورت‌وضعیت شماره ' + invoiceFormData.invoiceNumber : '🧾 ثبت صورت‌وضعیت جدید'} برای: {activeSubForInvoice.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
              <div>
                <label className="block text-xs text-gray-700 mb-1">شماره صورت‌وضعیت</label>
                <input type="number" className="w-full text-xs p-2 border rounded-lg bg-white font-sans text-center" value={invoiceFormData.invoiceNumber} onChange={(e) => setInvoiceFormData({...invoiceFormData, invoiceNumber: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">۱. کارکرد ناخالص کارگاه (ریال)</label>
                <input type="number" className="w-full text-xs p-2 border rounded-lg bg-white font-sans text-center" value={invoiceFormData.grossAmount} onChange={(e) => setInvoiceFormData({...invoiceFormData, grossAmount: e.target.value})} required />
                <span className="text-[10px] text-gray-500 font-mono mt-1 block text-center">{formatNumber(invoiceFormData.grossAmount)}</span>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">۲. تاییدیه نهایی دفتر مرکزی (ریال)</label>
                <input type="number" placeholder="مبلغ مصوب دفتر مرکزی" className="w-full text-xs p-2 border rounded-lg bg-white font-sans text-center" value={invoiceFormData.centralApproved} onChange={(e) => setInvoiceFormData({...invoiceFormData, centralApproved: e.target.value})} required />
                <span className="text-[10px] text-blue-600 font-mono mt-1 block text-center">{formatNumber(invoiceFormData.centralApproved)}</span>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">۳. مبلغ کل واریز شده / مساعده (ریال)</label>
                <input type="number" className="w-full text-xs p-2 border rounded-lg bg-white font-sans text-center" value={invoiceFormData.actualPaid} onChange={(e) => setInvoiceFormData({...invoiceFormData, actualPaid: e.target.value})} />
                <span className="text-[10px] text-emerald-600 font-mono mt-1 block text-center">{formatNumber(invoiceFormData.actualPaid)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 border-t border-blue-100 pt-3">
              <button type="button" onClick={() => { setIsInvoiceFormOpen(false); setEditingInvoiceId(null); }} className="bg-gray-300 text-xs px-4 py-2 rounded-lg">انصراف</button>
              <button type="submit" className="bg-blue-600 text-white text-xs px-6 py-2 rounded-lg font-bold">ذخیره قطعی صورت وضعیت</button>
            </div>
          </form>
        )}

        {/* فیلتر سایت‌ها */}
        {sites.length > 0 && (
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-gray-600">🔎 تفکیک اکیپ‌ها بر اساس سایت:</span>
            <select className="rounded-lg border-gray-300 text-xs p-1 bg-gray-50 font-bold" value={selectedSiteFilter} onChange={(e) => setSelectedSiteFilter(e.target.value)}>
              <option value="ALL">همه بخش‌های کارگاه</option>
              {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* 📊 جدول اصلی حسابداری پیمانکاران */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-hidden">
          <table className="w-full text-center text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b">
                <th className="p-3 text-center">پیمانکار / رسته قرارداد</th>
                <th className="p-3 text-center">سایت</th>
                <th className="p-3 text-center">کل کارکرد ناخالص</th>
                <th className="p-3 text-center text-red-600">کسورات تجمعی</th>
                <th className="p-3 text-center text-blue-600">تایید شده مرکز</th>
                <th className="p-3 text-center text-emerald-600">مجموع پرداختی شرکت</th>
                <th className="p-3 text-center bg-gray-100/70 text-gray-800">💸 وضعیت مانده حساب</th>
                <th className="p-3 text-center">مدیریت مالی و اجرایی</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {filteredSubs.map((sub: any) => {
                const hasInvoices = sub.invoices && sub.invoices.length > 0;
                const totalGross = sub.invoices?.reduce((sum: number, inv: any) => sum + (inv.grossAmount || 0), 0) || 0;
                const totalDeductions = sub.invoices?.reduce((sum: number, inv: any) => sum + ((inv.retentionDeduction || 0) + (inv.guaranteeDeduction || 0)), 0) || 0;
                const totalCentralApproved = sub.invoices?.reduce((sum: number, inv: any) => sum + (inv.centralApproved || 0), 0) || 0;
                const totalPaid = sub.invoices?.reduce((sum: number, inv: any) => sum + (inv.actualPaid || 0), 0) || 0;
                
                const balance = totalCentralApproved - totalPaid;

                return (
                  <tr key={sub.id} className="hover:bg-gray-50/70">
                    <td className="p-3 text-center">
                      <div className="font-bold text-gray-900">{sub.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">ش‌ق: {sub.contractNumber || 'ثبت نشده'} | {sub.trade}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-500">{sub.site ? `📍 ${sub.site.name}` : 'مشترک کل کارگاه'}</td>
                    <td className="p-3 text-center font-mono bg-gray-50/40">{formatNumber(totalGross)}</td>
                    <td className="p-3 text-center font-mono text-red-500">{formatNumber(totalDeductions)}</td>
                    <td className="p-3 text-center font-mono text-blue-600 font-bold">{formatNumber(totalCentralApproved)}</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">{formatNumber(totalPaid)}</td>
                    
                    <td className="p-3 text-center font-mono font-bold bg-gray-50">
                      {!hasInvoices ? (
                        <span className="text-gray-400 text-[11px] font-sans">بدون صورت‌وضعیت</span>
                      ) : balance > 0 ? (
                        <span className="text-amber-600">{formatNumber(balance)}</span>
                      ) : balance < 0 ? (
                        <span className="text-indigo-600">{formatNumber(Math.abs(balance))} (طلب شرکت)</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">💯 تصفیه</span>
                      )}
                    </td>

                    <td className="p-3 text-center flex items-center justify-center gap-1">
                      <button type="button" onClick={() => { setActiveSubForInvoice(sub); setInvoiceFormData({invoiceNumber: (sub.invoices?.length + 1 || 1).toString(), grossAmount: '', centralApproved: '', actualPaid: ''}); setIsInvoiceFormOpen(true); }} className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold">➕ ثبت صورت‌وضعیت</button>
                      <button type="button" onClick={() => { setActiveSubForArchive(sub); setIsArchiveModalOpen(true); }} className="bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] px-2 py-1 rounded font-bold">🔍 آرشیو و ویرایش</button>
                      <button type="button" onClick={() => handleEditSub(sub)} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-1 rounded">✏️ قرارداد</button>
                      <button type="button" onClick={() => handleDeleteSub(sub.id)} className="bg-red-50 text-red-500 text-[10px] px-1 py-1 rounded">حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🗄️ مدال پاپ‌آپ ریز آرشیو صورت وضعیت‌ها */}
        {isArchiveModalOpen && activeSubForArchive && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-xl border max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xs font-bold text-gray-900">🗄️ ریز آرشیو صورت‌وضعیت‌های مالی: {activeSubForArchive.name}</h3>
                <button type="button" onClick={() => { setIsArchiveModalOpen(false); setEditingInvoiceId(null); }} className="text-gray-400 hover:text-gray-600 text-sm">✖</button>
              </div>

              {(!subs.find((s: any) => s.id === activeSubForArchive.id)?.invoices || subs.find((s: any) => s.id === activeSubForArchive.id).invoices.length === 0) ? (
                <div className="text-center py-8 text-xs text-gray-400">هنوز هیچ صورت‌وضعیتی برای این پیمانکار ثبت نشده است.</div>
              ) : (
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 border-b">
                      <th className="p-2 text-center">شماره صورت‌وضعیت</th>
                      <th className="p-2 text-center">کارکرد ناخالص کارگاه</th>
                      <th className="p-2 text-center text-red-500">۱۰٪ حسن انجام</th>
                      <th className="p-2 text-center text-red-500">۱۵٪ تضمین</th>
                      <th className="p-2 text-center text-blue-600">مصوب دفتر مرکزی</th>
                      <th className="p-2 text-center text-emerald-600">کل واریزی‌ها</th>
                      <th className="p-2 text-center">عملیات اصلاحی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subs.find((s: any) => s.id === activeSubForArchive.id)?.invoices?.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="p-2 text-center font-bold font-sans">شماره {inv.invoiceNumber}</td>
                        <td className="p-2 text-center font-mono">{formatNumber(inv.grossAmount)}</td>
                        <td className="p-2 text-center font-mono text-red-400">{formatNumber(inv.retentionDeduction)}</td>
                        <td className="p-2 text-center font-mono text-red-400">{formatNumber(inv.guaranteeDeduction)}</td>
                        <td className="p-2 text-center font-mono text-blue-600 font-bold">{formatNumber(inv.centralApproved)}</td>
                        <td className="p-2 text-center font-mono text-emerald-600 font-bold">{formatNumber(inv.actualPaid)}</td>
                        <td className="p-2 text-center space-x-1 space-x-reverse">
                          <button type="button" onClick={() => { handleEditInvoiceInline(inv, activeSubForArchive); }} className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded">✏️ ویرایش رقم</button>
                          <button type="button" onClick={() => handleDeleteInvoice(inv.id)} className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded">حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex justify-end mt-6 border-t pt-3">
                <button type="button" onClick={() => { setIsArchiveModalOpen(false); setEditingInvoiceId(null); }} className="bg-gray-800 text-white text-xs px-5 py-2 rounded-lg">بستن پنجره آرشیو</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function SubcontractorsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs">در حال بارگذاری اطلاعات مالی کارگاه...</div>}>
      <SubcontractorsContent />
    </Suspense>
  );
}