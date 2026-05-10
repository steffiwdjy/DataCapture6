import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles }) => {
    const location = useLocation();
    const userSession = JSON.parse(localStorage.getItem("userSession"));
    const userRoles = userSession?.dataUser?.Role?.map((role) => role.Nama) || [];
    // Cek apakah user memiliki salah satu role yang diperbolehkan
    const isAuthorized = allowedRoles.some((role) => userRoles.includes(role));
    const hasAgreed = userSession?.dataUser?.IsKetentuan;

    if (!userSession || !isAuthorized) {
        return <Navigate to="/" replace />;
    }

    // Jika belum setuju S&K, tetap tolak akses
    if (!hasAgreed) {
        return <Navigate to="/" replace />;
    }

    // Block direct URL access on visitor.thejarrdin.com except for /sewa
    const isVisitorDomain = typeof window !== "undefined" && (window.location.hostname === "visitor.thejarrdin.com" || localStorage.getItem("isVisitorDomain") === "true");
    if (isVisitorDomain && location.pathname !== "/sewa" && location.pathname !== "/") {
        return <Navigate to="/" replace />;
    }

    return <>{element}</>;
};

export default ProtectedRoute;
