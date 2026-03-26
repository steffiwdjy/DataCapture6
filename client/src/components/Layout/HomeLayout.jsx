import { List, Popover } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

function HomeLayout({ dataUser, contentInfoRole, fiturUser }) {
    const navigate = useNavigate();
    return (
        <div className="container container-home-v3 d-flex mt-5 gap-4 align-items-center flex-column h-100 ps-3 pe-3">
            <div className="w-100">
                <List
                    size="small"
                    className="list-role text-light position-absolute"
                    style={{ top: 100, left: 50 }}
                    header={<div>Peran Anda saat ini sebagai :</div>}
                    bordered
                    dataSource={dataUser?.Role}
                    renderItem={(item, i) => (
                        <>
                            <Popover
                                placement="right"
                                title={<span>Fitur yang dimiliki:</span>}
                                content={contentInfoRole(item.Nama)}
                            >
                                <List.Item style={{ cursor: "help" }} className="text-light ms-3">
                                    <p>
                                        {i + 1 + ". "} ({item.Nama})
                                    </p>
                                </List.Item>
                            </Popover>
                        </>
                    )}
                />
            </div>
            <div
                className="container-menu-v3 d-flex flex-column align-items-center gap-3"
                style={{ marginTop: "10rem" }}
            >
                {fiturUser &&
                    fiturUser.length > 0 &&
                    fiturUser.map((arrAkses, i) => (
                        <div key={i} className={`gap-3 d-flex`}>
                            {arrAkses.map((akses, j) => (
                                <div
                                    key={j}
                                    className="menu-v3 bg-theme-subtle d-flex shadow rounded flex-column justify-content-center align-items-center p-5"
                                    style={{ cursor: "pointer", height: "10rem" }}
                                    onClick={() => {
                                        navigate(akses.key);
                                    }}
                                >
                                    {/* <FontAwesomeIcon icon={akses.icon} size="2xl" /> */}
                                    <img
                                        className="text-light"
                                        width={35}
                                        height={35}
                                        src={akses.icon}
                                        alt={`img-icon-${j}`}
                                    />
                                    <p className="text-hexagon text-center fw-medium">
                                        {akses.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default HomeLayout;
