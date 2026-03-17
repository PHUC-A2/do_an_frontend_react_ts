import { ToastContainer, Slide } from "react-toastify";
import AppRouter from "./routes/AppRouter";
import { useEffect, useState } from "react";
import 'react-toastify/dist/ReactToastify.css';
import BackToTop from "./components/client/backtotop/BackToTop";
import TopProgressBar from "./components/common/ProgressBar/TopProgressBar";
import { useAuthInit } from "./hooks/init/useAuthInit";
import { useAccountInit } from "./hooks/init/useAccountInit";
import { useAppSelector } from "./redux/hooks";
import { useFcmToken } from "./hooks/common/useFcmToken";

const App = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    document.body.className = theme; // chỉ để tiện nếu muốn css global khác
  }, [theme]);

  // init hooks
  useAuthInit();
  useAccountInit();
  useFcmToken(isAuthenticated);

  return (
    <>
      <TopProgressBar />
      <BackToTop theme={theme} />
      <AppRouter theme={theme} toggleTheme={toggleTheme} />
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        theme={theme === "dark" ? "dark" : "light"}
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
