import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';

export default function CommandLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { pathname } = useLocation();
  const { role } = useApp();
  if (role === 'citizen') return <Navigate to="/citizen" replace />;
  return (
    <div className="min-h-full">
      <Sidebar {...{ collapsed, setCollapsed }} mobileOpen={mobile} setMobileOpen={setMobile} />
      <div className={`min-h-full transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <Topbar onMenu={() => setMobile(true)} />
        <AnimatePresence mode="wait">
          <motion.main key={pathname} className="p-4 lg:p-6" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
