import React, { useMemo } from "react";
import { formatDate } from "../utils/formatDate";
import { fiturMaping2 } from "../utils/mappingFiturID";
import { Empty, Modal, Popconfirm } from "antd";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import formatString from "../utils/formatString";
import DetailDataController from "../utils/detailDataController";
import toogleModal from "../utils/toogleModal";
import { useNavigate } from "react-router-dom";

function ModalNotifikasi({ dataNotif }) {
    const navigate = useNavigate();
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);

    const { isModalOpen, setIsModalOpen } = toogleModal();
    const { setDetailOpen } = DetailDataController();

    axios.defaults.withCredentials = true;
    const handleNotifOpen = async (id, fiturId, tipe) => {
        const url = formatString(fiturMaping2[fiturId]);
        const body = {
            Id: id,
            Tipe: tipe,
        };
        const headers = {
            headers: {
                authorization: userSession?.AuthKey,
            },
        };

        try {
            await axios.patch(`${urlServer}/notif`, body, headers);
            // console.log(response);
            setDetailOpen(fiturMaping2[fiturId], id);
            navigate(`/${url}`);
        } catch (error) {
            // console.log(error);
        }
    };
    console.log(dataNotif);

    return (
        <Modal
            title="Notifikasi"
            open={isModalOpen === "notifikasi"}
            onCancel={() => setIsModalOpen(false)}
            footer={false}
        >
            {dataNotif && dataNotif?.Notif.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                    {dataNotif?.Notif.map((notif, i) => (
                        <Popconfirm
                            key={i}
                            icon={false}
                            title="Lihat Notifikasi?"
                            description={
                                notif.IsRead ? "" : "Lihat untuk tandai notif menjadi dibaca"
                            }
                            onConfirm={() => handleNotifOpen(notif.Id, notif.FiturID, notif.Tipe)}
                            okText="Lihat"
                            cancelText="Tutup"
                        >
                            <div
                                className={`${
                                    !notif.IsRead ? "btn-theme2" : "btn-white border"
                                } p-3 rounded`}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="d-flex justify-content-between">
                                    <p className="fw-semibold">{fiturMaping2[notif.FiturID]}</p>
                                    <p>{formatDate(notif.TglDibuat)}</p>
                                </div>
                                {notif.Judul}
                            </div>
                        </Popconfirm>
                    ))}
                </div>
            ) : (
                <Empty description="Tidak ada notifikasi terbaru" />
            )}
        </Modal>
    );
}

export default ModalNotifikasi;
