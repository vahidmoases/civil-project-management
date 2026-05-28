'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProjectId = searchParams.get('projectId') || '';

  const [projects, setProjects] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setProjects(data);
        }
      } catch (e) { console.error(e); }
    }
    fetchProjects();
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setIsMenuOpen(false);
    if (projectId) {
      router.push(`${pathname}?projectId=${projectId}`);
    } else {
      router.push(pathname);
    }
  };

  const linkClass = (path: string) => {
    const baseClass = "text-[11px] md:text-xs font-bold px-3 py-2 rounded-xl transition-all block w-full text-right sm:w-auto ";
    return pathname === path 
      ? baseClass + "bg-blue-50 text-blue-600 shadow-sm" 
      : baseClass + "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  };

  const getLinkWithProject = (basePath: string) => {
    return currentProjectId ? `${basePath}?projectId=${currentProjectId}` : basePath;
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" dir="rtl">
      <div className="max-w-[98%] mx-auto min-h-[4rem] flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-0 md:px-4 gap-3">
        
        {/* بخش لوگو و نام سیستم */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            {/* اینجا فایل لوگو قرار می‌گیرد */}
            <Image 
                src="/images/amerlogo.png" 
                alt="لوگو" 
                width={36} 
                height={36} 
                className="rounded-lg object-contain" 
            />
            <div>
              <h1 className="text-xs font-bold text-gray-900">سیستم مدیریت پروژه فلوو-عمران</h1>
              <p className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">پنل اختصاصی مدیریت کارگاهی</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
          >
            ☰
          </button>
        </div>

        {/* منوی اصلی با تمام صفحات */}
        <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-1 w-full md:w-auto bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-xl`}>
          <Link href={getLinkWithProject('/dashboard')} onClick={() => setIsMenuOpen(false)} className={linkClass('/dashboard')}>📊 داشبورد</Link>
          <Link href="/projects" onClick={() => setIsMenuOpen(false)} className={linkClass('/projects')}>📂 کارگاه‌ها</Link>
          <Link href={getLinkWithProject('/daily-reports')} onClick={() => setIsMenuOpen(false)} className={linkClass('/daily-reports')}>📝 گزارش روزانه</Link>
          <Link href={getLinkWithProject('/invoices')} onClick={() => setIsMenuOpen(false)} className={linkClass('/invoices')}>🧾 امور مالی</Link>
          <Link href={getLinkWithProject('/letters')} onClick={() => setIsMenuOpen(false)} className={linkClass('/letters')}>📁 نامه‌ها</Link>
          <Link href={getLinkWithProject('/warehouse')} onClick={() => setIsMenuOpen(false)} className={linkClass('/warehouse')}>📦 انبارداری</Link>
          <Link href={getLinkWithProject('/subcontractors')} onClick={() => setIsMenuOpen(false)} className={linkClass('/subcontractors')}>👷‍♂️ پیمانکاران</Link>
        </nav>

        {/* بخش انتخاب پروژه */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-auto`}>
          <select 
            value={currentProjectId} 
            onChange={handleProjectChange}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl text-[11px] font-bold text-gray-700 py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">⚙️ انتخاب کارگاه فعال... </option>
            {projects.map((proj: any) => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </select>
        </div>

      </div>
    </header>
  );
}