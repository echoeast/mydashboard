'use client';

import '../app/globals.css';
import type { AppProps } from 'next/app';
import { Sidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Pages where sidebar should be hidden
  const pagesWithoutSidebar = ['/login', '/signup', '/forgot-password'];
  const hideSidebar = pagesWithoutSidebar.includes(router.pathname);

  if (hideSidebar) {
    return (
      <div className="flex flex-col h-screen dark:bg-background bg-neutral-100">
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen">
      {/* Left Sidebar */}
      <Sidebar defaultCollapsed={false} />

      {/* Main Content Area */}
      <div className="relative flex-1 h-screen">
        <div className={`transition-all flex flex-col dark:bg-background bg-neutral-100 overflow-auto relative h-full duration-300`}>
            <Component
              {...pageProps}
            />
        </div>

      </div>
    </div>
  );
}

