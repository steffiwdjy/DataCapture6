import axios from "axios";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { urlServer } from "../../utils/endpoint";

function Logout() {
    const navigate = useNavigate();
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);

    useEffect(() => {
        const logout = async () => {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };
            try {
                await axios.get(`${urlServer}/logout`, headers);
                // console.log(response);

                // Remove userSession from localStorage
                localStorage.removeItem("userSession");
                // Redirect to login page or home page
                navigate("/login"); // Change this to the path you want to navigate to after logout
            } catch (error) {
                // console.log(error.message);
            }
        };

        logout();
    }, []);

    return (
        <div>
            <p>Logging out...</p>
        </div>
    );
}

export default Logout;
