import React from "react";
import toogleSidebar from "../../utils/toogleSidebar";

function MainContent({ header, content, footer }) {
    const { isSidebarOpen } = toogleSidebar();
    // console.log(isSidebarOpen);

    return (
        <>
            {footer ? (
                <>
                    {header && header}
                    {content && content}
                    {footer && footer}
                </>
            ) : (
                <div
                    className="container-content h-100 d-flex flex-column bg-light"
                    style={{ width: isSidebarOpen === true ? "100%" : "80%" }}
                >
                    {header && header}
                    {content && content}
                </div>
            )}
        </>
    );
}

export default MainContent;
