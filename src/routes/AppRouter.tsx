import { createBrowserRouter, Outlet, RouterProvider, useLocation, useNavigation } from 'react-router';
import { useEffect, useRef } from 'react';
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
import AdminPitchPage from '../pages/admin/pitch/AdminPitchPage';
import AdminPermissionPage from '../pages/admin/permission/AdminPermissionPage';
import AdminRolePage from '../pages/admin/role/AdminRolePage';
import AdminBookingPage from '../pages/admin/booking/AdminBookingPage';
import PitchPage from '../pages/client/pitch/PitchPage';
import PitchDetailsPage from '../pages/client/pitch/PitchDetailsPage';
import AdminPaymentPage from '../pages/admin/payment/AdminPaymentPage';
import TermsOfService from '../pages/client/terms-of-service/TermsOfService';
import { useTopProgress } from '../hooks/common/useTopProgress';

interface AppRouterProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const RouterProgressSync = () => {
    const location = useLocation();
    const navigation = useNavigation();
    const { start, done } = useTopProgress();
    const lastLocationKeyRef = useRef(location.key);
    const hasMountedRef = useRef(false);
    const routePendingRef = useRef(false);

    useEffect(() => {
        if (navigation.state === 'idle') {
            if (routePendingRef.current && location.key === lastLocationKeyRef.current) {
                routePendingRef.current = false;
                done();
            }

            return;
        }

        if (!routePendingRef.current) {
            routePendingRef.current = true;
            start();
        }
    }, [done, location.key, navigation.state, start]);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            lastLocationKeyRef.current = location.key;
            return;
        }

        if (location.key !== lastLocationKeyRef.current) {
            lastLocationKeyRef.current = location.key;

            if (routePendingRef.current) {
                routePendingRef.current = false;
                done();
            }
        }
    }, [done, location.key]);

    return null;
};

const AppRouterShell = () => {
    return (
        <>
            <RouterProgressSync />
            <Outlet />
        </>
    );
};

const AppRouter = ({ theme, toggleTheme }: AppRouterProps) => {
    const router = createBrowserRouter([
        {
            element: <AppRouterShell />,
            children: [
                {
                    path: "/",
                    element: <ClientLayout theme={theme} toggleTheme={toggleTheme} />,
                    children: [
                        { index: true, element: <HomePage theme={theme} /> },
                        { path: "/pitch", element: <PitchPage theme={theme} /> },
                        { path: "/pitch/:id", element: <PitchDetailsPage /> },
                        { path: "/booking/:pitchId", element: <BookingPage theme={theme} /> },
                        { path: "/about", element: <AboutPage theme={theme} /> },
                        { path: "/terms", element: <TermsOfService theme={theme} /> },
                    ]
                },
                {
                    path: "/admin",
                    element: <AdminLayout theme={theme} toggleTheme={toggleTheme} />,
                    children: [
                        { index: true, element: <AdminPage /> },
                        { path: "/admin/user", element: <AdminUserPage /> },
                        { path: "/admin/role", element: <AdminRolePage /> },
                        { path: "/admin/permission", element: <AdminPermissionPage /> },
                        { path: "/admin/pitch", element: <AdminPitchPage /> },
                        { path: "/admin/booking", element: <AdminBookingPage /> },
                        { path: "/admin/payment", element: <AdminPaymentPage /> },
                    ]
                },
                { path: "/login", element: <LoginPage /> },
                { path: "/register", element: <RegisterPage /> },
                { path: "*", element: <NotFoundPage /> },
            ]
        },
    ]);

    return <RouterProvider router={router} />;
};

export default AppRouter;
