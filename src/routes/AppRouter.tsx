import { createBrowserRouter, RouterProvider } from 'react-router';
import ClientLayout from "../layouts/ClientLayout";
import HomePage from "../pages/client/home/HomePage";
import AboutPage from "../pages/client/about/AboutPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/error/NotFoundPage";
import AdminLayout from '../layouts/AdminLayout';
import AdminPage from '../pages/admin/AdminPage';
import AdminUserPage from '../pages/admin/user/AdminUserPage';
import BookingPage from '../pages/client/booking/BookingPage';

interface AppRouterProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AppRouter = ({ theme, toggleTheme }: AppRouterProps) => {
    const router = createBrowserRouter([
        // client
        {
            path: "/",
            element: <ClientLayout theme={theme} toggleTheme={toggleTheme} />,
            children: [
                { index: true, element: <HomePage /> },
                { path: "/booking", element: <BookingPage /> },
                { path: "/about", element: <AboutPage /> },
                { path: "/contact", element: "" },
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
