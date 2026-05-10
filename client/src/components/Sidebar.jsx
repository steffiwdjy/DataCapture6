import { Button, ConfigProvider, Menu, Modal } from "antd";
import { listHakAkses, multiRoleAkses } from "../models/MenuRoleAkses";
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import toogleSidebar from "../utils/toogleSidebar";
import { useEffect, useMemo, useState } from "react";

function Sidebar() {
    const navigate = useNavigate();
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    const dataUser = userSession?.dataUser;
    const [fiturUser, setFiturUser] = useState([]);
    const [isLogout, setLogout] = useState(false);

    const isVisitorDomain = typeof window !== "undefined" && (window.location.hostname === "visitor.thejarrdin.com" || localStorage.getItem("isVisitorDomain") === "true");

    useEffect(() => {
        const transformedFitur = () => {
            const arr = listHakAkses(dataUser?.Fitur, isVisitorDomain);

            setFiturUser(arr);
        };

        transformedFitur();
    }, []);

    const itemsMenu = fiturUser.map((item) => ({
        label: item.label,
        key: item.key,
        icon: <img src={item.icon} width={25} height={25} alt={item.label} />,
        disabled: item.disabled,
    }));
    // const newItem = {
    //     label: "Home",
    //     key: "/",
    //     icon: "https://img.icons8.com/ios/100/home--v1.png",
    //     disabled: isVisitorDomain, // Disable Home on visitor domain
    // };
    // // Menambahkan item baru pada index awal
    // itemsMenu.unshift({
    //     label: newItem.label,
    //     key: newItem.key,
    //     icon: <img src={newItem.icon} width={25} height={25} alt={newItem.label} />,
    //     disabled: newItem.disabled,
    // });
    
    // Add logout menu in sidebar
    itemsMenu.push({
        label: "Keluar",
        key: "logout",
        icon: <LogoutOutlined />,
        disabled: false,
    });

    const { isSidebarOpen, setIsSidebarOpen } = toogleSidebar();
    const toggleisSidebarOpen = () => {
        setIsSidebarOpen(isSidebarOpen);
    };

    return (
        <div
            className="sidebar h-100 pt-3 pb-3 d-flex flex-column justify-content-between gap-3"
            style={{
                width: isSidebarOpen ? "80px" : "20%",
                backgroundColor: "#F1F6F2",
            }}
        >
            <ConfigProvider
                theme={{
                    token: {
                        colorBgContainer: "#F1F6F2",
                        controlItemBgActive: "#ffffff",
                    },
                }}
            >
                <div className="head-sidebar ps-4 pe-3 d-flex flex-column gap-4">
                    <div className="d-flex justify-content-between">
                        {!isSidebarOpen && (
                            <div className="d-flex flex-column">
                                <p>Selamat datang,</p>
                                <p className="fw-semibold">
                                    {dataUser?.Nama?.length > 23
                                        ? dataUser.Nama.slice(0, 20) + "..."
                                        : dataUser?.Nama}
                                </p>
                            </div>
                        )}
                        <Button type="primary" onClick={toggleisSidebarOpen}>
                            {isSidebarOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        </Button>
                    </div>
                </div>

                <Menu
                    className="h-100 d-flex flex-column gap-3"
                    mode="inline"
                    theme="light"
                    inlineCollapsed={isSidebarOpen}
                    items={itemsMenu}
                    defaultSelectedKeys={[window.location.pathname]}
                    onClick={({ key }) => {
                        if (key === "logout") {
                            setLogout(true);
                        } else {
                            navigate(key);
                        }
                    }}
                />
            </ConfigProvider>
            <Modal
                title="Apakah anda yakin untuk keluar?"
                open={isLogout}
                onCancel={() => setLogout(false)}
                onOk={() => navigate("/logout")}
                okText="Iya"
                cancelText="Tidak"
                okType="danger"
                centered
            ></Modal>
        </div>
    );
}

export default Sidebar;
