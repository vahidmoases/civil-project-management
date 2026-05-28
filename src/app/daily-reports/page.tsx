'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DailyReportsContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  // استیت‌های پایه سیستم فلوو-عمران
  const [sites, setSites] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, { total: number; unit: string }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [activeTab, setActiveTab] = useState<'daily' | 'monitor'>('daily');
  const [showForm, setShowForm] = useState(false);

  // استیت فیلدهای اصلی فرم (منطبق با اسکرین‌شات شما)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('آفتابی و معتدل');
  const [physicalProgress, setPhysicalProgress] = useState('0');
  const [isLate, setIsLate] = useState(false);

  // ویژگی‌های متنی گزارش روزانه که احیا شدند
  const [manpowerSummary, setManpowerSummary] = useState('');
  const [machinerySummary, setMachinerySummary] = useState('');
  const [activitiesExecuted, setActivitiesExecuted] = useState('');
  const [notes, setNotes] = useState('');

  // استیت مدیریت پویا و پیشرفته ردیف‌های متریال (با امکان اضافه، ویرایش و حذف کامل)
  const [formMaterials, setFormMaterials] = useState([
    { materialName: 'آرماتور (میلگرد)', quantityImported: '0', quantityUsed: '0', unit: 'تن' },
    { materialName: 'سیمان تیپ ۲', quantityImported: '0', quantityUsed: '0', unit: 'پاکت' },
    { materialName: 'بلوک سیمانی', quantityImported: '0', quantityUsed: '0', unit: 'عدد' },
  ]);

  // لود اولیه سایت‌های کارگاه
  useEffect(() => {
    if (!projectId) return;
    const loadSites = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sites?projectId=${projectId}`);
        if (res.ok) {
          const sitesData = await res.json();
          setSites(sitesData);
          if (sitesData.length > 0) {
            setSelectedSiteId(sitesData[0].id);
            fetchData(sitesData[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  }, [projectId]);

  const fetchData = async (siteId: string) => {
    if (!siteId || siteId === 'ALL') return;
    try {
      const res = await fetch(`/api/daily-reports?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setInventory(data.inventory || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    fetchData(siteId);
  };

  // اکشن‌های ردیف متریال (اضافه، تغییر و حذف آنی سطر)
  const addMaterialRow = () => {
    setFormMaterials([...formMaterials, { materialName: '', quantityImported: '0', quantityUsed: '0', unit: 'واحد' }]);
  };

  const removeMaterialRow = (index: number) => {
    const updated = formMaterials.filter((_, i) => i !== index);
    setFormMaterials(updated);
  };

  const handleMaterialChange = (index: number, field: string, value: string) => {
    const updated = [...formMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setFormMaterials(updated);
  };

  // ارسال نهایی فرم جامع به بک‌آند
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;

    // ترکیب داده‌های متنی در قالب کامنت یا فیلد الحاقی جهت توسعه پذیری
    const fullWeatherString = `${weather} | اکیپ: ${manpowerSummary} | ماشین‌آلات: ${machinerySummary} | اقدامات: ${activitiesExecuted} | نکات: ${notes}`;

    try {
      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSiteId,
          reportDate,
          weather: fullWeatherString, // ذخیره امن رشته اطلاعات در فیلد هواشناسی یا فیلد اختصاصی خودتان
          physicalProgress,
          isLate,
          materials: formMaterials
        })
      });

      if (response.ok) {
        alert('📝 گزارش جامع کارگاه با موفقیت در فلوو-عمران ثبت شد.');
        setShowForm(false);
        setManpowerSummary('');
        setMachinerySummary('');
        setActivitiesExecuted('');
        setNotes('');
        setFormMaterials([
          { materialName: 'آرماتور (میلگرد)', quantityImported: '0', quantityUsed: '0', unit: 'تن' },
          { materialName: 'سیمان تیپ ۲', quantityImported: '0', quantityUsed: '0', unit: 'پاکت' },
          { materialName: 'بلوک سیمانی', quantityImported: '0', quantityUsed: '0', unit: 'عدد' },
        ]);
        fetchData(selectedSiteId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این گزارش و اصلاح موجودی انبار مصالح مطمئن هستید؟')) return;
    try {
      const response = await fetch(`/api/daily-reports?id=${id}`, { method: 'DELETE' });
      if (response.ok) fetchData(selectedSiteId);
    } catch (err) {
      console.error(err);
    }
  };

  if (!projectId) {
    return (
      <div className="text-center py-20 m-6 bg-white rounded-xl border border-dashed text-xs text-gray-500 font-medium">
        لطفاً ابتدا پروژه‌ای را از منوی بالای سیستم انتخاب کنید.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12" dir="rtl">
      <main className="max-w-[98%] mx-auto pt-6 px-4">
        
        {/* هدر کنترل حوزه گزارش و تب‌ها */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-bold text-gray-800">📋 پنل ثبت وقایع روزانه و مانیتورینگ متریال انبار</h2>
            <div className="flex items-center gap-1.5 mt-2 bg-blue-50/50 p-1 rounded border border-blue-100 w-fit">
              <span className="text-[10px] font-bold text-blue-600 px-1">🔎 حوزه گزارش:</span>
              <select 
                className="text-xs bg-white border border-gray-300 rounded px-2 py-0.5 font-bold text-gray-700 focus:outline-none"
                value={selectedSiteId}
                onChange={(e) => handleSiteChange(e.target.value)}
              >
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('daily')}
              className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              📊 دپوی زنده و گزارشات روزانه
            </button>
            <button 
              onClick={() => setActiveTab('monitor')}
              className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'monitor' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              📅 کنترل تحویل گزارش‌های ادواری
            </button>
          </div>
        </div>

        {activeTab === 'daily' ? (
          <>
            {/* 📈 موجودی زنده دپوی انبار در این زون */}
            <div className="mb-6">
              <h3 className="text-[11px] font-bold text-gray-500 mb-2">📦 موجودی زنده دپوی انبار در این زون:</h3>
              {Object.keys(inventory).length === 0 ? (
                <div className="bg-white p-4 rounded-xl border text-center text-gray-400 text-xs">هیچ متریالی هنوز برای این سایت ثبت نشده است.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(inventory).map(([name, data]) => (
                    <div key={name} className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl text-white border border-slate-700 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold block">🔹 {name}</span>
                      <p className="text-lg font-mono font-bold mt-1 text-amber-400">
                        {data.total.toLocaleString()} <span className="text-[10px] font-sans text-white">{data.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mb-4">
              <button onClick={() => setShowForm(!showForm)} className={`text-xs font-bold text-white px-4 py-2 rounded-lg shadow-sm ${showForm ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {showForm ? '✖️ بستن فرم ثبت گزارش' : '➕ ثبت گزارش روزانه و گردش مصالح جدید'}
              </button>
            </div>

            {/* 📝 فرم ثبت عریض (کپی دقیق ساختار اسکرین‌شات شما با اصلاحات خواسته شده) */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-200 shadow-md mb-6 space-y-6">
                
                {/* بخش اول: فیلدهای هدر فرم */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">تاریخ گزارش *</label>
                    <input type="date" className="w-full text-xs p-2.5 border rounded bg-gray-50 font-mono focus:ring-2 focus:ring-blue-500/20" value={reportDate} onChange={e => setReportDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">وضعیت جوی و هواشناسی</label>
                    <input type="text" className="w-full text-xs p-2.5 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500/20" value={weather} onChange={e => setWeather(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">درصد پیشرفت فیزیکی این روز</label>
                    <input type="number" step="0.01" className="w-full text-xs p-2.5 border rounded bg-gray-50 font-mono focus:ring-2 focus:ring-blue-500/20" value={physicalProgress} onChange={e => setPhysicalProgress(e.target.value)} />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isLate} onChange={e => setIsLate(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-[11px] font-bold text-red-600">گزارش با تأخیر ارسال شده است</span>
                    </label>
                  </div>
                </div>

                {/* 🧱 بخش دوم: لیست تراکنش‌های مصالح به همراه هدرهای شفاف ستون‌ها */}
                <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">🧱 لیست تراکنش‌های مصالح (ورود و مصرف انبار):</span>
                    <button type="button" onClick={addMaterialRow} className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                      ➕ افزودن ردیف مصالح جدید
                    </button>
                  </div>

                  {/* 💡 هدر راهنمای ستون‌ها برای کاربر */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-gray-500 text-center">
                    <div className="col-span-4 text-right pr-2">نام کالا / مصالح ساختمانی</div>
                    <div className="col-span-3 text-emerald-700 bg-emerald-50 py-0.5 rounded">📈 مقدار وارده (ورود به کارگاه)</div>
                    <div className="col-span-3 text-red-700 bg-red-50 py-0.5 rounded">📉 مقدار مصرف شده (خروج از دپو)</div>
                    <div className="col-span-1">واحد سنجش</div>
                    <div className="col-span-1 text-left pl-2">عملیات</div>
                  </div>

                  {/* ردیف‌های داینامیک */}
                  {formMaterials.map((mat, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm items-center">
                      <div className="col-span-4">
                        <input type="text" placeholder="نام کالا (مثلا: میلگرد سایز ۱۶)" className="w-full text-xs p-2 border rounded focus:outline-none focus:border-blue-500" value={mat.materialName} onChange={e => handleMaterialChange(idx, 'materialName', e.target.value)} required />
                      </div>
                      <div className="col-span-3">
                        <input type="number" step="0.01" placeholder="مقدار ورود" className="w-full text-xs p-2 border rounded text-center font-mono focus:border-emerald-500 text-emerald-700 font-bold" value={mat.quantityImported} onChange={e => handleMaterialChange(idx, 'quantityImported', e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <input type="number" step="0.01" placeholder="مقدار مصرف" className="w-full text-xs p-2 border rounded text-center font-mono focus:border-red-500 text-red-600 font-bold" value={mat.quantityUsed} onChange={e => handleMaterialChange(idx, 'quantityUsed', e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        <input type="text" placeholder="واحد" className="w-full text-xs p-2 border rounded text-center text-gray-500" value={mat.unit} onChange={e => handleMaterialChange(idx, 'unit', e.target.value)} />
                      </div>
                      <div className="col-span-1 text-left">
                        <button type="button" onClick={() => removeMaterialRow(idx)} className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-2 rounded-lg font-bold border border-red-100 transition-colors w-full sm:w-auto">
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 👥 بخش سوم: احیا و برگشت سایر ویژگی‌های متنی گزارش روزانه */}
                <div className="bg-white rounded-xl border p-4 space-y-4">
                  <span className="text-[11px] font-bold text-gray-700 block border-b pb-2">📋 جزئیات اجرایی و آمار روزانه کارگاه:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">👥 آمار اکیپ‌های انسانی (نیروهای فنی، پیمانکاران، کارگران)</label>
                      <textarea rows={2} placeholder="مثال: ۵ نفر آرماتوربند، ۲ نفر جوشکار، ۴ نفر کارگر ساده" className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-blue-500/20" value={manpowerSummary} onChange={e => setManpowerSummary(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">🚜 وضعیت کارکرد ماشین‌آلات و ابزارآلات</label>
                      <textarea rows={2} placeholder="مثال: بیل مکانیکی کوماتسو ۴ ساعت فعال، میکسر سیمان آماده بکار" className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-blue-500/20" value={machinerySummary} onChange={e => setMachinerySummary(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">⚡ عملیات اجرایی انجام شده در این روز</label>
                    <textarea rows={2} placeholder="شرح کارهای صورت گرفته در زون..." className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-blue-500/20" value={activitiesExecuted} onChange={e => setActivitiesExecuted(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">📝 یادداشت‌ها، موانع کاری یا نکات مدیریتی</label>
                    <textarea rows={2} placeholder="نکات تکمیلی دفتری یا موانع جوی و کارگاهی..." className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-blue-500/20" value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                </div>

                {/* دکمه‌های کنترل فرم */}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">انصراف</button>
                  <button type="submit" className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg shadow-sm transition-colors">
                    💾 ذخیره قطعی سند کارگاه
                  </button>
                </div>
              </form>
            )}

            {/* جدول تاریخچه زون */}
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">در حال فراخوانی مستندات فنی...</div>
            ) : reports.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center text-xs text-gray-400">هیچ سابقه گزارش روزانه‌ای برای این زون وجود ندارد.</div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-700 text-[11px] font-bold">
                      <th className="p-3">🗓️ تاریخ گزارش</th>
                      <th className="p-3">🌤️ جزئیات و وقایع کارگاه</th>
                      <th className="p-3">📈 پیشرفت</th>
                      <th className="p-3">🔄 گردش مصالح در این تاریخ</th>
                      <th className="p-3 text-left">⚙️ عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {reports.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50/50 align-top">
                        <td className="p-3 font-mono font-bold whitespace-nowrap">
                          {r.reportDate} {r.isLate && <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded text-[9px] font-sans">⚠️ با تأخیر</span>}
                        </td>
                        <td className="p-3 text-gray-600 max-w-sm">
                          <p className="text-gray-800 font-medium leading-relaxed">{r.weather}</p>
                        </td>
                        <td className="p-3 font-mono text-blue-600 font-bold">{r.physicalProgress}%</td>
                        <td className="p-3">
                          <div className="grid grid-cols-1 gap-1 text-[10px]">
                            {r.materials?.map((m: any) => (
                              <div key={m.id} className="bg-gray-50 p-1.5 rounded border border-gray-100 flex justify-between items-center">
                                <span><b>{m.materialName}:</b></span>
                                <div>
                                  <span className="text-emerald-700 font-mono">📥 ورود: {m.quantityImported}</span>
                                  <span className="text-gray-300 mx-1">|</span>
                                  <span className="text-red-600 font-mono">📤 مصرف: {m.quantityUsed}</span>
                                  <span className="text-gray-400 font-sans mr-1">({m.unit})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-left">
                          <button onClick={() => handleDelete(r.id)} className="text-[10px] text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-lg transition-colors">حذف سند</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* 📅 تب مانیتورینگ منظم بودن کارگاه‌ها */
          <div className="bg-white p-5 rounded-xl border space-y-4">
            <div>
              <h3 className="text-xs font-bold text-purple-700">체 چک‌لیست و مانیتورینگ ارسال گزارش‌های ادواری کارگاه</h3>
              <p className="text-[11px] text-gray-500 mt-1">بررسی انضباط سرپرستان کارگاه در تسلیم و ارسال به موقع اسناد دفتری به دفتر مرکزی.</p>
            </div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-purple-50 text-purple-950 text-[11px] font-bold border-b">
                    <th className="p-4">📍 نام کارگاه / زون فعال</th>
                    <th className="p-4 text-center">🗓️ وضعیت گزارش‌های روزانه جاری</th>
                    <th className="p-4 text-center">📊 تایید گزارش هفتگی</th>
                    <th className="p-4 text-center">📅 تایید دفترچه گزارش ماهانه</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {sites.map(site => (
                    <tr key={site.id} className="hover:bg-gray-50/80">
                      <td className="p-4 font-bold text-gray-800">{site.name}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold">
                          🟢 منظم و فعال
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer gap-2">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                          <span className="text-[11px] text-gray-600 font-medium">سر وقت ارسال شده</span>
                        </label>
                      </td>
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer gap-2">
                          <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                          <span className="text-[11px] text-gray-500">در انتظار دفتر فنی</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DailyReportsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">در حال بارگذاری المان‌های پیشرفته گزارش‌نویسی...</div>}>
      <DailyReportsContent />
    </Suspense>
  );
}