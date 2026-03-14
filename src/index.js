import './index.css';

import React from 'react';

import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';

import {
  Container,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';

import MaiFooter from './Footer/footer';
import NavBar from './NavBar';
import AIChatPage from './pages/AIChatPage';
import ExploreDataPage from './pages/ExploreDataPage';
import { store } from './redux/store';
import theme from './theme/theme';

const appTheme = theme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={appTheme}>
        <Container disableGutters maxWidth={false} sx={{
          padding: 0, margin: 0, minHeight: '100%',
          display: 'flex', flexDirection: 'column'
        }}>
          <BrowserRouter>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <NavBar />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Routes>
                  <Route path="/" element={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Home - Coming Soon</h2></div>} />
                  <Route path="/explore-data" element={<ExploreDataPage />} />
                  <Route path="/ai-chat" element={<AIChatPage />} />
                  <Route path="/publication" element={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Publication - Coming Soon</h2></div>} />
                  <Route path="*" element={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Page Not Found</h2></div>} />
                </Routes>
              </div>
              <MaiFooter />
            </div>
          </BrowserRouter>
        </Container>
      </ThemeProvider>
    </StyledEngineProvider>
  </Provider>
);
