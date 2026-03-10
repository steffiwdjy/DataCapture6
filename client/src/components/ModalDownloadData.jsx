import { Button, Modal, Typography } from "antd";
import React from "react";
import { useMemo } from "react";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import { useNavigate } from "react-router-dom";

const { Paragraph, Text } = Typography;

function ModalDownloadData() {
    const navigate = useNavigate();
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);

    axios.defaults.withCredentials = true;
    const downloadLogs = async () => {
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
                responseType: "blob",
            };

            const res = await axios.get(`${urlServer}/user/download/logs`, headers);

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "data_logs.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // optional cleanup
        } catch (error) {
            console.error("Gagal mengunduh data logs", error);
        }
    };

    return (
        <Modal
            open={true}
            onCancel={false}
            closable={false}
            centered
            footer={
                <>
                    <div className="d-flex w-100 flex-column gap-2">
                        <Button type="primary" className="w-100" onClick={downloadLogs}>
                            Download Data Logs
                        </Button>
                        <Button
                            type="default"
                            danger
                            className="w-100"
                            onClick={() => navigate("/logout")}
                        >
                            Keluar
                        </Button>
                    </div>
                </>
            }
        >
            <Typography>
                <Paragraph>
                    <Text strong>
                        Anda tidak dapat mengakses sistem karena telah mengajukan penghapusan data.
                    </Text>
                </Paragraph>
                <Paragraph>
                    Namun, Anda masih dapat mengunduh data pribadi Anda (log aktivitas) sebelum akun
                    dinonaktifkan sepenuhnya.
                </Paragraph>
                <Paragraph>
                    Untuk mengaktifkan kembali akun Anda, silakan hubungi pengelola Rusunami The
                    Jarrdin Cihampelas.
                </Paragraph>
            </Typography>
        </Modal>
    );
}

export default ModalDownloadData;
