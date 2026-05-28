'use client';

import React, { useState, useEffect } from 'react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    id: '', name: '', clientName: '', contractNumber: '', contractDate: '', contractAmount: '0'
  });
  const [siteInputList, setSiteInputList] = useState<string[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProjects(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddSiteField = () => setSiteInputList([...siteInputList, '']);
  const handleRemoveSiteField = (index: number) => {
    const updated = [...siteInputList];
    updated.splice(index, 1);
    setSiteInputList(updated);
  };
  const handleSiteNameChange = (index: number, value: string) => {
    const updated = [...siteInputList];
    updated[index] = value;
    setSiteInputList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanSites = siteInputList.filter(name => name.trim() !== '');
    const payload = { ...formData, id: editingId || formData.id, sites: cleanSites };

    try {
      const res = await fetch('/api/projects', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchProjects();
        setIsFormOpen(false);
        setEditingId(null);
        resetForm();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'خطایی رخ داد.');
      }
    } catch (e) { setErrorMsg('خطا در ارتباط با سرور.'); }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', clientName: '', contractNumber: '', contractDate: '', contractAmount: '0' });
    setSiteInputList([]);
  };

  const handleEdit = (proj: any) => {
    setEditingId(proj.id);
    setFormData({
      id: proj.id, name: proj.name, clientName: proj.clientName,
      contractNumber: proj.contractNumber, contractDate: proj.contractDate,
      contractAmount: proj.contractAmount.toString()
    });
    setSiteInputList(proj.sites ? proj.sites.map((s: any) => s.name) : []);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('با حذف کارگاه، تمام ریز اطلاعات دیتابیس آن پاک می‌شود. مطمئنید؟')) return;
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12" dir="rtl">
      <main className="max-w-[98%] mx-auto pt-6 px-2">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-gray-800">📂 مدیریت و پیکربندی کارگاه‌های عمرانی</h2>
            <p className="text-[11px] text-gray-500 mt-1">تنظیم قراردادهای اصلی کارفرما و تعداد زون‌های تحت پوشش</p>
          </div>
          <button 
            onClick={() => { setIsFormOpen(!isFormOpen); if (isFormOpen) { setEditingId(null); resetForm(); } }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
          >
            {isFormOpen ? '✖ بستن فرم' : '➕ تعریف کارگاه جدید'}
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 mb-6">
            <h3 className="text-xs font-bold text-gray-700">{editingId ? '📝 ویرایش قرارداد کارگاه' : '✨ ثبت کارگاه جدید'}</h3>
            {errorMsg && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-bold">{errorMsg}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">کد کارگاه</label>
                <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border font-mono font-bold" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} disabled={!!editingId} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نام پروژه</label>
                <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">نام کارفرما</label>
                <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">شماره قرارداد</label>
                <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.contractNumber} onChange={(e) => setFormData({...formData, contractNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">تاریخ ابلاغ</label>
                <input type="text" className="w-full rounded-lg border-gray-300 text-xs p-2 border" value={formData.contractDate} onChange={(e) => setFormData({...formData, contractDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">مبلغ پیمان (ریال)</label>
                <input type="number" className="w-full rounded-lg border-gray-300 text-xs p-2 border font-sans" value={formData.contractAmount} onChange={(e) => setFormData({...formData, contractAmount: e.target.value})} />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700">📍 تعریف زون‌ها / سایت‌های پروژه</span>
                <button type="button" onClick={handleAddSiteField} className="bg-white border text-blue-600 text-[10px] px-2.5 py-1 rounded-md font-bold">➕ افزودن سایت</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {siteInputList.map((site, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-white p-1 rounded-md border">
                    <input type="text" placeholder="نام سایت/بلوک" className="w-full border-none text-xs p-1 focus:ring-0" value={site} onChange={(e) => handleSiteNameChange(idx, e.target.value)} required />
                    <button type="button" onClick={() => handleRemoveSiteField(idx)} className="text-red-500 text-xs px-1.5 font-bold">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end"><button type="submit" className="bg-emerald-600 text-white text-xs px-6 py-2 rounded-lg font-medium">ذخیره کارگاه</button></div>
          </form>
        )}

        {/* 🗂️ نمایش پروژه‌ها به صورت کارت‌های شکیل مهندسی */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj: any) => (
            <div key={proj.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border border-blue-100">کارگاه #{proj.id}</span>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-100">
                    📍 {proj.sites?.length || 0} سایت فعال
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 leading-6 mb-2">{proj.name}</h3>
                <div className="space-y-1 text-[11px] text-gray-500 border-t border-gray-100 pt-2.5">
                  <div>🏢 <span className="font-medium text-gray-700">کارفرما:</span> {proj.clientName}</div>
                  <div>📄 <span className="font-medium text-gray-700">قرارداد:</span> {proj.contractNumber}</div>
                  <div>📅 <span className="font-medium text-gray-700">تاریخ ابلاغ:</span> {proj.contractDate}</div>
                  <div className="text-gray-800 font-bold pt-1">💰 مبلغ: <span className="font-sans text-xs font-black text-gray-900">{proj.contractAmount.toLocaleString()}</span> ریال</div>
                </div>
              </div>

              <div className="flex gap-1 mt-4 pt-3 border-t border-gray-100 justify-end">
                <button onClick={() => handleEdit(proj)} className="text-blue-600 bg-blue-50 text-[10px] font-bold px-3 py-1.5 rounded-lg">✏️ ویرایش</button>
                <button onClick={() => handleDelete(proj.id)} className="text-red-600 bg-red-50 text-[10px] font-bold px-2 py-1.5 rounded-lg">حذف</button>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}