import axios from "axios";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { urlServer } from "./endpoint";

const UseSessionCheck = () => {
    const navigate = useNavigate();
    const location = useLocation(); // ambil lokasi route sekarang
    axios.defaults.withCredentials = true;

    useEffect(() => {
        const userSession = JSON.parse(localStorage.getItem("userSession"));

        // Kalau tidak ada session, arahkan ke /login
        if (!userSession || !userSession.AuthKey) {
            if (location.pathname !== "/login") {
                navigate("/login");
            }
            return;
        }

        // Kalau ADA session dan sekarang di halaman /login, kembalikan ke /
        if (userSession && location.pathname === "/login") {
            navigate("/");
            return;
        }

        // Verifikasi session ke server
        const verifySession = async () => {
            const headers = {
                headers: {
                    authorization: userSession.AuthKey,
                },
            };
            try {
                await axios.get(`${urlServer}/user/session`, headers);
            } catch (error) {
                localStorage.removeItem("userSession"); // bersihkan localStorage kalau token invalid
                navigate("/login");
            }
        };

        verifySession();
    }, [navigate, location]);
};

export default UseSessionCheck;
