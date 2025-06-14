"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) return [];
    
    const breadcrumbs = [
      { name: 'Home', href: '/', isHome: true }
    ];

    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      let name = path.charAt(0).toUpperCase() + path.slice(1);
      
      // Map specific paths to better names
      switch (path) {
        case 'uploads':
          name = 'Batch Uploads';
          break;
        case 'admin':
          name = 'Administration';
          break;
        case 'users':
          name = 'User Management';
          break;
      }
      
      breadcrumbs.push({ name, href, isHome: false });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb for home page only
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium flex items-center">
              {breadcrumb.isHome && <Home className="w-4 h-4 mr-1" />}
              {breadcrumb.name}
            </span>
          ) : (
            <Link 
              href={breadcrumb.href}
              className="hover:text-gray-700 flex items-center transition-colors"
            >
              {breadcrumb.isHome && <Home className="w-4 h-4 mr-1" />}
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
