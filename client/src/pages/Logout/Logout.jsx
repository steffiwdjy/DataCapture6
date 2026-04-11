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

                // Remove userSession from localStorage
                localStorage.removeItem("userSession");
                
                // Redirect to visitor to clear its session via url param
                window.location.href = "https://visitor.thejarrdin.com/?logout=true";
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
