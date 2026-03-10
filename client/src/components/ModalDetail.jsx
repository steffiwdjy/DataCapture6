import { Button, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import DetailDataController from "../utils/detailDataController";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import { formatDate } from "../utils/formatDate";
import { FileOutlined } from "@ant-design/icons";
import ModalInsert from "./ModalInsert";
import TextArea from "antd/es/input/TextArea";

// eslint-disable-next-line react/prop-types
function ModalDetail({ judulDetail, tipeDetail }) {
    const userSession = JSON.parse(localStorage.getItem("userSession"));
    const { isDetailOpen, oneDataID, setDetailOpen } = DetailDataController();
    console.log(isDetailOpen, oneDataID);

    const [dataOne, setDataOne] = useState(null);
    const [formData, setFormData] = useState(null);
    const [modalInsert, setModalInsert] = useState(false);
    const [loading, setLoading] = useState(false); // Tambahkan state loading
    // console.log(dataOne);

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
                const response = await axios.get(`${urlServer}/data/${oneDataID}`, headers);

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
                        UserTujuan: responseData.UserTujuan.join(", "),
                        File: transformedFile, // Menambahkan transformedFile ke dalam responseData
                        DibuatOleh: responseData.DibuatOleh.Nama,
                    });
                    setFormData({
                        Judul: "Kwitansi : " + responseData.Judul,
                        UserTujuan: [responseData.DibuatOleh.UserID],
                        FileFolder: [],
                    });
                } else {
                    setDataOne({
                        ...responseData,
                        UserTujuan: responseData.UserTujuan.join(", "),
                        DibuatOleh: responseData.DibuatOleh.Nama,
                    });
                    setFormData({
                        Judul: "Kwitansi : " + responseData.Judul,
                        UserTujuan: [responseData.DibuatOleh.UserID],
                        FileFolder: [],
                    });
                }
            } catch (error) {
                // console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchOneData();
    }, [isDetailOpen]);

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
                }}
                onCancel={() => {
                    setDetailOpen(null, null);
                }}
                footer={[
                    <>
                        <div className="d-flex w-100 justify-content-end gap-3">
                            <Button
                                key="tutup"
                                type="primary"
                                onClick={() => {
                                    setDetailOpen(null, null);
                                }}
                            >
                                Tutup
                            </Button>
                            {isDetailOpen === "Tagihan Bulanan" && tipeDetail === "untukSaya" && (
                                <Button
                                    key="unggah"
                                    type="primary"
                                    onClick={() => setModalInsert(true)}
                                >
                                    Balas
                                </Button>
                            )}
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
                        <Input style={{ color: "#616161" }} value={dataOne?.DibuatOleh} disabled />
                    </div>

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

                    {dataOne?.File && dataOne?.File.length > 1 && (
                        <div className="form-input text d-flex flex-column gap-3 ">
                            <label htmlFor="" className="w-25">
                                File/folder dokumen
                            </label>
                            {Array.isArray(dataOne?.File) ? (
                                <div className="d-flex gap-3 flex-wrap">
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
                <ModalInsert
                    currState={modalInsert}
                    setState={setModalInsert}
                    judulInsert={formData?.Judul}
                    dataOne={formData}
                />
            )}
        </>
    );
}

export default ModalDetail;
