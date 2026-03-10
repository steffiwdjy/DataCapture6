import { Button, Input, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import DetailDataController from "../utils/detailDataController";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import { formatDate } from "../utils/formatDate";
import { CheckOutlined, FileOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import ModalInsertAspirasi from "./ModalInsertAspirasi";

// eslint-disable-next-line react/prop-types
function ModalDetailAspirasi({ judulDetail, tipeDetail }) {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    const { isDetailOpen, oneDataID, setDetailOpen } = DetailDataController();
    const [modalInsert, setModalInsert] = useState(false);
    const [dataOne, setDataOne] = useState(null);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false); // Tambahkan state loading

    axios.defaults.withCredentials = true;
    useEffect(() => {
        const fetchOneData = async () => {
            setLoading(true);
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };
            try {
                const response = await axios.get(
                    `${urlServer}/aspirasidetail/${oneDataID}/${
                        tipeDetail === "untukSaya" ? "untukUser" : "dibuatUser"
                    }`,
                    headers
                );
                // console.log(response);

                const responseData = response?.data;
                // console.log(responseData);

                if (responseData.File) {
                    let transformedFile = [];
                    if (responseData?.File.includes(",")) {
                        transformedFile = responseData?.File.split(",").map((url) => url.trim());
                    } else {
                        transformedFile = responseData?.File; // Jika tidak ada koma, jadikan sebagai array dengan satu elemen
                    }
                    setDataOne({
                        ...responseData,
                        File: transformedFile, // Menambahkan transformedFile ke dalam responseData
                    });
                    setFormData(() => ({
                        Judul: response.data.Judul.startsWith("RE : ")
                            ? response.data.Judul
                            : "RE : " + response.data.Judul,
                        Pesan: "",
                        UserTujuanID: response.data.DibuatOleh.UserID,
                        PesanFile: [],
                    }));
                } else {
                    setDataOne(responseData);
                    setFormData(() => ({
                        Judul: response.data.Judul.startsWith("RE : ")
                            ? response.data.Judul
                            : "RE : " + response.data.Judul,
                        Pesan: "",
                        UserTujuanID: response.data.DibuatOleh.UserID,
                        PesanFile: [],
                    }));
                }
            } catch (error) {
                // console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchOneData();
    }, [isDetailOpen]);

    const updateIsRead = async () => {
        const body = {
            MessageID: dataOne.Id,
        };
        const headers = {
            headers: {
                authorization: userSession?.AuthKey,
            },
        };
        try {
            const response = await axios.patch(`${urlServer}/aspirasi`, body, headers);
            const resultIsRead = response.data.IsRead;

            // Jika berhasil, langsung update dataOne untuk mengubah IsRead
            setDataOne((prevData) => ({
                ...prevData,
                IsRead: resultIsRead, // Mengubah status pesan
            }));
        } catch (error) {
            // console.log(error);
        }
    };

    // console.log(tipeDetail);

    return (
        <>
            <Modal
                title={judulDetail}
                loading={loading}
                centered
                width={1000}
                open={isDetailOpen}
                onOk={() => {
                    setDetailOpen(null, null);
                    tipeDetail === "untukSaya" ? window.location.reload() : {};
                }}
                onCancel={() => {
                    setDetailOpen(null, null);
                    tipeDetail === "untukSaya" ? window.location.reload() : {};
                }}
                footer={[
                    <>
                        <div
                            className={`d-flex w-100 justify-content-${
                                tipeDetail === "untukSaya" ? "between" : "end"
                            }`}
                        >
                            {tipeDetail === "untukSaya" && (
                                <Button
                                    key="isRead"
                                    type={dataOne?.IsRead ? "primary" : ""}
                                    icon={dataOne?.IsRead ? <CheckOutlined /> : false}
                                    onClick={() => updateIsRead()}
                                >
                                    {dataOne?.IsRead ? "Dibaca" : "Tandai untuk dibaca"}
                                </Button>
                            )}
                            <div className="d-flex gap-3">
                                <Button
                                    key="tutup"
                                    type={tipeDetail === "untukSaya" ? "default" : "primary"}
                                    onClick={() => {
                                        setDetailOpen(null, null);
                                        tipeDetail === "untukSaya" ? window.location.reload() : {};
                                    }}
                                >
                                    Tutup
                                </Button>

                                {tipeDetail === "untukSaya" && (
                                    <Button
                                        key="unggah"
                                        type="primary"
                                        onClick={() => setModalInsert(true)}
                                    >
                                        Balas
                                    </Button>
                                )}
                            </div>
                        </div>
                    </>,
                ]}
            >
                <div className="d-flex flex-column gap-3">
                    <div className="form-input text d-flex align-items-center">
                        <label htmlFor="" className="w-25">
                            Judul dokumen
                        </label>
                        <Input style={{ color: "#616161" }} value={dataOne?.Judul} disabled />
                    </div>

                    <div className="form-input text d-flex align-items-center">
                        <label htmlFor="" className="w-25">
                            Tanggal diunggah
                        </label>
                        <Input
                            style={{ color: "#616161" }}
                            value={formatDate(dataOne?.TglDibuat)}
                            disabled
                        />
                    </div>

                    <div className="form-input text d-flex align-items-center">
                        <label htmlFor="" className="w-25">
                            Diunggah oleh
                        </label>
                        <Input
                            style={{ color: "#616161" }}
                            value={dataOne?.DibuatOleh.Nama}
                            disabled
                        />
                    </div>

                    {tipeDetail !== "untukSaya" && (
                        <div className="form-input text d-flex align-items-center">
                            <label htmlFor="" className="w-25">
                                Tujuan
                            </label>
                            <TextArea
                                style={{ color: "#616161" }}
                                value={dataOne?.UserTujuan}
                                autoSize={{
                                    minRows: 1,
                                    maxRows: 6,
                                }}
                                disabled
                            />
                        </div>
                    )}
                    <div className="form-input text d-flex align-items-start">
                        <label htmlFor="" className="d-flex w-25 gap-2">
                            Pesan
                        </label>
                        <TextArea style={{ color: "#616161" }} value={dataOne?.Pesan} disabled />
                    </div>

                    {dataOne?.File && dataOne?.File.length > 1 && (
                        <div className="form-input text d-flex flex-column gap-3">
                            <label htmlFor="" className="w-25">
                                File/folder dokumen
                            </label>
                            {Array.isArray(dataOne?.File) ? (
                                <div className="d-flex gap-3">
                                    {dataOne?.File.map((url, i) => (
                                        <Button
                                            shape="rounded"
                                            icon={<FileOutlined />}
                                            key={i}
                                            onClick={() => window.open(url, "_blank")}
                                        >
                                            Lihat file/folder {i + 1}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="d-flex gap-3">
                                    <Button
                                        shape="rounded"
                                        icon={<FileOutlined />}
                                        onClick={() => window.open(dataOne?.File, "_blank")}
                                    >
                                        Lihat file/folder
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
            {modalInsert && (
                <ModalInsertAspirasi
                    currState={modalInsert}
                    setState={setModalInsert}
                    judulInsert={"Balas Masukan & Aspirasi"}
                    dataOne={formData}
                />
            )}
        </>
    );
}

export default ModalDetailAspirasi;
