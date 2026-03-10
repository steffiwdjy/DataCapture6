import { InboxOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Result } from "antd";
import useValidator from "../constaints/FormValidation";
import { useMemo, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { urlServer } from "../utils/endpoint";
import axios from "axios";
import { inputValidator } from "../utils/inputValidator";
import Dragger from "antd/es/upload/Dragger";

// eslint-disable-next-line react/prop-types
function ModalInsertAspirasi({ currState, setState, judulInsert, dataOne = null }) {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);

    const { ValidationStatus, setValidationStatus, setCloseAlert } = useValidator();
    const [formData, setFormData] = useState(
        dataOne ? dataOne : { Judul: "", Pesan: "", PesanFile: [] }
    );
    const [loading, setLoading] = useState(false); // Tambahkan state loading
    // console.log(formData, "FORMDATA");

    const handleFormDataChange = (tipe, value) => {
        setFormData((prevData) => ({
            ...prevData,
            [tipe]: value,
        }));
    };

    const propsUploadImg = {
        name: judulInsert,
        multiple: true,
        listType: "picture",
        accept: ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xlxs",
        fileList: formData.PesanFile,
        beforeUpload(file) {
            //jika size > 5Mb
            if (file.size > 5242880) {
                return true;
            } else {
                return false;
            }
        },
        onChange(info) {
            const { status } = info.file;
            if (status === "error") {
                // Hapus file yang memiliki status "error" dari fileList
                const newFileList = info.fileList.filter((file) => file.status !== "error");

                setFormData((prevData) => ({ ...prevData, PesanFile: newFileList }));
                setValidationStatus("error file", "File harus kurang dari 5Mb");
            } else {
                setFormData((prevData) => ({ ...prevData, PesanFile: info.fileList }));
            }
        },
    };
    const form = () => {
        return (
            <div className="d-flex flex-column gap-3">
                <div className="form-input text d-flex align-items-start">
                    <label htmlFor="" className="d-flex w-25 gap-2">
                        <p className="text-danger">*</p>
                        Judul aspirasi
                    </label>
                    <Input
                        value={formData["Judul"]}
                        placeholder="Masukkan judul aspirasi"
                        onChange={(e) => handleFormDataChange("Judul", e.target.value)}
                        disabled={dataOne ? true : false}
                    />
                </div>
                <div className="form-input text d-flex align-items-start">
                    <label htmlFor="" className="d-flex w-25 gap-2">
                        <p className="text-danger">*</p>
                        Pesan
                    </label>
                    <TextArea
                        value={formData["Pesan"]}
                        placeholder="Tuliskan pesan atau aspirasi Anda"
                        onChange={(e) => handleFormDataChange("Pesan", e.target.value)}
                        autoSize={{
                            minRows: 2,
                            maxRows: 10,
                        }}
                    />
                </div>
                <div className="form-input file">
                    <Dragger height={250} {...propsUploadImg}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Klik atau tarik file ke area ini untuk mengunggah
                        </p>
                        <p className="ant-upload-hint">
                            Mendukung unggah file tunggal atau dalam jumlah banyak. Ukuran file
                            maksimal adalah 5 Mb
                        </p>
                    </Dragger>
                </div>
            </div>
        );
    };

    const formatFormData = (formData) => {
        let newFormData = new FormData();

        for (const key in formData) {
            if (key === "PesanFile" && Array.isArray(formData[key])) {
                formData[key].map((file) => {
                    const fileObj = file.originFileObj;
                    newFormData.append(key, fileObj);
                });
            } else {
                newFormData.append(key, formData[key]);
            }
        }
        newFormData.append("TglDibuat", new Date().getTime());
        newFormData.append("UserID_dibuat", userSession?.dataUser?.UserID);

        return newFormData;
    };

    const insertFormData = async () => {
        setLoading(true); // Set loading ke true saat login dijalankan
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                    "Content-Type": "multipart/form-data", // Important for file uploads
                },
            };

            const formattedFormData = formatFormData(formData);

            // Lakukan validasi menggunakan Joi
            const validateFunction = inputValidator["DataAspirasi"];
            validateFunction(formData);

            //POST REQUEST
            await axios.post(`${urlServer}/aspirasi`, formattedFormData, headers);
            setLoading(false);
            setValidationStatus("Berhasil", "Data berhasil ditambahkan");
        } catch (error) {
            setLoading(false);
            if (error?.response?.data?.error) {
                setValidationStatus(error.path, error.response.data.error);
            } else {
                setValidationStatus(error.path, error.message);
            }
        }
    };

    return (
        <Modal
            title={judulInsert}
            loading={loading}
            centered
            width={1000}
            open={currState}
            onOk={() => setState(false)}
            onCancel={() => (loading ? false : setState(false))}
            closable={loading ? true : false}
            footer={[
                <>
                    <div className="d-flex w-100 justify-content-end">
                        {/* <div>
              <Popover content={<p>Simpan di draft</p>} trigger={"hover"}>
                <Button key="save" icon={<SaveTwoTone twoToneColor={"#399051"} />}></Button>
              </Popover>
            </div> */}
                        <div className="d-flex gap-3">
                            <Button
                                key="tutup"
                                className="text-light bg-secondary"
                                onClick={() => setState(false)}
                            >
                                Tutup
                            </Button>

                            <Button key="unggah" type="primary" onClick={insertFormData}>
                                Unggah
                            </Button>
                        </div>
                    </div>
                </>,
            ]}
        >
            {ValidationStatus && (
                <Modal
                    open={ValidationStatus}
                    onCancel={() => {
                        //jika gagal maka modal aler saja yg ditutup
                        if (ValidationStatus.Path !== "Berhasil") {
                            setCloseAlert();
                        } else if (ValidationStatus.Path === "error file") {
                            setCloseAlert();
                        } else {
                            //jika berhasil maka modal alert & modal form  yg ditutup
                            setCloseAlert(), setState(false), window.location.reload();
                        }
                    }}
                    footer={null}
                    centered={true}
                >
                    <Result
                        status={ValidationStatus.Path !== "Berhasil" ? "error" : "success"}
                        title={ValidationStatus.Message}
                    />
                </Modal>
            )}
            {form()}
        </Modal>
    );
}

export default ModalInsertAspirasi;
