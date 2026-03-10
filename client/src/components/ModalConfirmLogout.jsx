import { Modal } from "antd";
import React from "react";
import toogleModal from "../utils/toogleModal";
import { useNavigate } from "react-router-dom";

function ModalConfirmLogout() {
    const navigate = useNavigate();
    const { isModalOpen, setIsModalOpen } = toogleModal();
    return (
        <Modal
            title="Apakah anda yakin untuk keluar?"
            open={isModalOpen === "logout"}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => navigate("/logout")}
            okText="Iya"
            cancelText="Tidak"
            okType="danger"
            centered
        ></Modal>
    );
}

export default ModalConfirmLogout;
