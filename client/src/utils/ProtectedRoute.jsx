import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles }) => {
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

    return <>{element}</>;
};

export default ProtectedRoute;
