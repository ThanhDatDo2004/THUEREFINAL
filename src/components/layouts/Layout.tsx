import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="page flex flex-col">
      <Header />
      <main className="">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;