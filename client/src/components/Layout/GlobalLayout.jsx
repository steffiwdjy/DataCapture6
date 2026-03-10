import React from "react";
import Sidebar from "../Sidebar";
import UseSessionCheck from "../../utils/useSessionCheck";

function GlobalLayout({ children, active }) {
    UseSessionCheck();
    return (
        <>
            {active === "home" ? (
                <div className="container-home d-flex w-100 h-100 flex-column position-fixed">
                    {children}
                </div>
            ) : (
                <div className="container-main w-100 h-100 d-flex position-fixed">
                    <Sidebar />
                    {children}
                </div>
            )}
        </>
    );
}

export default GlobalLayout;
