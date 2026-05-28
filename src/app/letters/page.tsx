'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LettersPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [letters, setLetters] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    type: 'OUTGOING', letterNumber: '', date: '', title: '', sender: '', receiver: '', archivePath: ''
  });

  const fetchLetters = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/letters?projectId=${projectId}`);
      if (!res.ok) throw new Error('صفحه API یافت نشد');
      const data = await res.json();
      if (Array.isArray(data)) setLetters(data);
    } catch (e) { 
      console.error('خطا در دریافت نامه‌ها:', e); 
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...formData })
      });
      const result = await res.json();
      
      if (res.ok) {
        fetchLetters();
        setIsFormOpen(false);
        setFormData({ type: 'OUTGOING', letterNumber: '', date: '', title: '', sender: '', receiver: '', archivePath: '' });
      } else { 
        setErrorMsg(result.error || 'خطا در ثبت اطلاعات'); 
      }
    } catch (e) { 
      setErrorMsg('خطای ارتباط با سرور محلی');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این نامه از زون‌کن اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/letters?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchLetters();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12" dir="rtl">
      <main className="max-w-[98%] mx-auto pt-6 px-2">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-gray-800">🗂️ زون‌کن و اندیکاتور دیجیتال مکاتبات کارگاه</h2>
            <p className="text-xs text-gray-500 mt-1">بایگانی نامه‌های وارده، صادره، دستور کارها و ابلاغ‌های پیمان</p>
          </div>
          {projectId && (
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
            >
              {isFormOpen ? 'بستن فرم اندیکاتور' : '➕ ثبت و بایگانی نامه جدید'}
            </button>
          )}
        </div>

        {!projectId ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8">
            <p className="text-xs text-gray-500">لطفاً برای دسترسی به زون‌کن مکاتبات، ابتدا یک کارگاه را از منوی بالای سایت انتخاب کنید.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* فرم ثبت نامه */}
            {isFormOpen && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2 md:col-span-4">
                  {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-bold">{errorMsg}</div>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">نوع نامه</label>
                  <select className="w-full rounded-lg border-gray-300 text-xs p-2 border bg-gray-50" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="OUTGOING">صادره (OUTGOING)</option>
                    <option value="INCOMING">وارده (INCOMING)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">شماره اندیکاتور / نامه</label>
                  <input type="text" placeholder="مثلا ۱۴۰۵/الف/۱۲" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.letterNumber} onChange={(e) => setFormData({...formData, letterNumber: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">تاریخ نامه (شمسی)</label>
                  <input type="text" placeholder="۱۴۰۵/۰۳/۰۵" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">فرستنده نامه</label>
                  <input type="text" placeholder="مثلا شرکت فلوو یا مهندسین مشاور" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.sender} onChange={(e) => setFormData({...formData, sender: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">گیرنده نامه</label>
                  <input type="text" placeholder="مثلا اداره کل راه و شهرسازی" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} required />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">موضوع مکاتبه</label>
                  <input type="text" placeholder="مثلا ابلاغ قیمت جدید آیتم‌های سنگی یا روکش ص‌و ۲" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">نام فایل یا آدرس سند اسکن شده (آفلاین)</label>
                  <input type="text" placeholder="مثلا scan-letter-01.pdf یا آدرس کامل فایل در سیستم" className="w-full rounded-lg border-gray-300 text-xs p-2 border font-mono text-left" value={formData.archivePath} onChange={(e) => setFormData({...formData, archivePath: e.target.value})} />
                  <p className="text-[10px] text-gray-400 mt-1">نکته: برای دسترسی سریع، فایل را درون پوشه public/scans قرار دهید و نام آن را اینجا بنویسید.</p>
                </div>
                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-xs font-medium w-full sm:w-auto">ثبت در اندیکاتور کارگاه</button>
                </div>
              </form>
            )}

            {/* جدول آرشیو زون‌کن */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200 bg-gray-50/70">
                      <th className="p-3 font-semibold">جهت نامه</th>
                      <th className="p-3 font-semibold">شماره اندیکاتور</th>
                      <th className="p-3 font-semibold">تاریخ سند</th>
                      <th className="p-3 font-semibold">موضوع مکاتبه</th>
                      <th className="p-3 font-semibold">فرستنده</th>
                      <th className="p-3 font-semibold">گیرنده</th>
                      <th className="p-3 font-semibold text-center">سند اسکن شده</th>
                      <th className="p-3 font-semibold text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {letters.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-400 text-xs font-sans">هیچ نامه‌ای تا کنون در اندیکاتور این کارگاه ثبت نشده است.</td>
                      </tr>
                    ) : (
                      letters.map((letItem: any) => (
                        <tr key={letItem.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${letItem.type === 'OUTGOING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                              {letItem.type === 'OUTGOING' ? 'صادره ↗' : 'وارده ↙'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-900">{letItem.letterNumber}</td>
                          <td className="p-3 font-mono">{letItem.date}</td>
                          <td className="p-3 font-medium text-gray-800 max-w-xs overflow-hidden text-ellipsis">{letItem.title}</td>
                          <td className="p-3 font-sans text-gray-600">{letItem.sender}</td>
                          <td className="p-3 font-sans text-gray-600">{letItem.receiver}</td>
                          <td className="p-3 text-center">
                            {letItem.archivePath ? (
                              <a 
                                href={letItem.archivePath.startsWith('http') || letItem.archivePath.startsWith('/') ? letItem.archivePath : `/scans/${letItem.archivePath}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-block bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                📄 باز کردن سند
                              </a>
                            ) : (
                              <span className="text-gray-400 text-[10px]">بدون فایل</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleDelete(letItem.id)} className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded text-[10px] font-bold transition-colors">حذف</button>
                          </td>
                        </tr>
                      ))
                    )}
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