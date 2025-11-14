import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ⚠️ ブラウザ環境で process を完全に定義（エラーハンドリング強化）
if (typeof process === 'undefined' || !process.nextTick) {
  window.process = window.process || {};
  
  // nextTick を定義
  if (!window.process.nextTick) {
    window.process.nextTick = (callback) => {
      try {
        setTimeout(callback, 0);
      } catch (error) {
        console.error('nextTick エラー:', error);
      }
    };
  }

  // env を定義
  if (!window.process.env) {
    window.process.env = { NODE_ENV: 'development' };
  }

  // その他の必要なプロパティ
  if (typeof window.process.browser === 'undefined') {
    window.process.browser = true;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
