import { Modal } from "antd";
import React from "react";
import toogleModal from "../utils/toogleModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-regular-svg-icons";

function ModalDokumenJarrdin() {
    const { isModalOpen, setIsModalOpen } = toogleModal();

    const ListDokumen = [
        {
            Judul: "AD PPPSRS THE JARRDIN",
            Link: "https://drive.google.com/file/d/1elTlQCELhN201YgN8DR5lzagOj7gLZsX/view?usp=sharing",
        },
        {
            Judul: "ART PPPSRS THE JARRDIN",
            Link: "https://drive.google.com/file/d/1Nk-2T7WyXK66JIq4aqAjgehjMjLqvkPv/view?usp=sharing",
        },
        {
            Judul: "HOUSE OF RULES THE JARRDIN",
            Link: "https://drive.google.com/file/d/1sJgKlPyC-XHXkKqJ-DZJe6LM9cYLBZVg/view?usp=sharing",
        },
        {
            Judul: "AKTA PENDIRIAN PPPSRS THE JARRDIN",
            Link: "https://drive.google.com/file/d/1vRKxHK8guKWZC0U5isXPBAe8sQ05XnkO/view?usp=sharing",
        },
        {
            Judul: "Permen PUPR 14  2021 tentang P3SRS",
            Link: "https://drive.google.com/file/d/1vRKxHK8guKWZC0U5isXPBAe8sQ05XnkO/view?usp=sharing",
        },
        {
            Judul: "Permen PUPR 14  2021 tentang P3SRS",
            Link: "https://drive.google.com/file/d/17PGNhQflIkUQWfrJbdunVgfG_HbGTVN6/view?usp=sharing",
        },
        {
            Judul: "Lampiran Permen PUPR 14  2021 tentang P3SRS",
            Link: "https://drive.google.com/file/d/1w7VQheETGRMOpMGaFvFvWZdOiqIr4E3e/view?usp=sharing",
        },
        {
            Judul: "UU. No. 20 Th. 2011 tentang Rumah Susun",
            Link: "https://drive.google.com/file/d/1p74KuvoRQBBGutD77tmeFLk0tQ0RCD_Y/view?usp=sharing",
        },
    ];
    return (
        <Modal
            title="Dokumen Rusunami The Jarrdin Cihampelas"
            open={isModalOpen === "dokumenjarrdin"}
            onCancel={() => setIsModalOpen(false)}
            footer={false}
        >
            <div className="d-flex flex-column gap-3">
                {ListDokumen.map((doc, i) => (
                    <div
                        key={i}
                        className="d-flex align-items-center justify-content-between btn-white border p-3 rounded"
                        style={{ cursor: "pointer" }}
                        onClick={() => window.open(doc.Link, "_blank")}
                    >
                        <p className="fw-semibold">{doc.Judul}</p>
                        <FontAwesomeIcon icon={faFilePdf} color="#de5433" />
                    </div>
                ))}
            </div>
        </Modal>
    );
}

export default ModalDokumenJarrdin;
