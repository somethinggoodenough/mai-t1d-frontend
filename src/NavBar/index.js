import './NavBar.css';

import React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Explore Data', path: '/explore-data' },
  { label: 'AI Chat', path: '/ai-chat' },
  { label: 'Publication', path: '/publication' },
];

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mai-navbar">
      <div className="mai-navbar-logo" onClick={() => navigate('/')}>
        <span className="logo-highlight">Multimodal</span>
        <span className="logo-text">&nbsp;AI in T1D</span>
      </div>
      <div className="mai-navbar-links">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <a
              key={item.path}
              className={`mai-navbar-link${isActive ? ' active' : ''}`}
              data-label={item.label}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
              href={item.path}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default NavBar;
