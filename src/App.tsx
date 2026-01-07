import { ToastContainer, Slide } from "react-toastify"; // thêm Slide
import AppRouter from "./routes/AppRouter";
import { useEffect, useState } from "react";
import BackToTop from "./components/client/backtotop/BackToTop";
import { useAuthInit } from "./hooks/init/useAuthInit";
import { useAccountInit } from "./hooks/init/useAccountInit";
const App = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);


  // auth init
  useAuthInit();
  useAccountInit();

  return (
    <>
      <BackToTop />
      <AppRouter theme={theme} toggleTheme={toggleTheme} />
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        theme="dark"
        transition={Slide}
        toastStyle={{
          marginTop: "25px",
          fontSize: "13px",
          padding: "8px 14px",
          borderRadius: "12px",
          minHeight: "unset",
          lineHeight: "1.3",
          fontWeight: 500,
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        }}
      />
    </>
  );
};

export default App;
