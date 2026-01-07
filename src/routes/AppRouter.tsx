import { createBrowserRouter, RouterProvider } from 'react-router';
import ClientLayout from "../layouts/ClientLayout";
import HomePage from "../pages/client/home/HomePage";
import AboutPage from "../pages/client/about/AboutPage";
import BookingPage from "../pages/client/booking/BookingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/error/NotFoundPage";
import AdminLayout from '../layouts/AdminLayout';
import AdminPage from '../pages/admin/AdminPage';
import AdminUserPage from '../pages/admin/user/AdminUserPage';

interface AppRouterProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AppRouter = ({ theme, toggleTheme }: AppRouterProps) => {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <ClientLayout theme={theme} toggleTheme={toggleTheme} />,
            children: [
                { index: true, element: <HomePage /> },
                { path: "/booking", element: <BookingPage theme={theme} /> },
                { path: "/about", element: <AboutPage theme={theme} /> },
                { path: "/contact", element: <div>Liên hệ</div> },
            ]
        },
        {
            path: "/admin",
            element: <AdminLayout />,
            children: [
                { index: true, element: <AdminPage /> },
                { path: "/admin/user", element: <AdminUserPage /> },
            ]
        },
        { path: "/login", element: <LoginPage /> },
        { path: "/register", element: <RegisterPage /> },
        { path: "*", element: <NotFoundPage /> },
    ]);

    return <RouterProvider router={router} />;
};

export default AppRouter;
