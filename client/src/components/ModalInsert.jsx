import { InboxOutlined } from "@ant-design/icons";
import { Button, Input, Menu, Modal, Radio, Result, Select } from "antd";
import Dragger from "antd/es/upload/Dragger";
import { useEffect, useMemo, useState } from "react";
import axios, { formToJSON } from "axios";
import { urlServer } from "../utils/endpoint";
import useValidator from "../constaints/FormValidation";
import { inputValidator } from "../utils/inputValidator";
import { fiturMaping, tujuanMapingByFitur } from "../utils/mappingFiturID";

// eslint-disable-next-line react/prop-types
function ModalInsert({ currState, setState, judulInsert }) {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    // console.log(userSession);

    // const [uploadProgress, setUploadProgress] = useState(0); // State untuk melacak progress upload
    const { ValidationStatus, setValidationStatus, setCloseAlert } = useValidator();
    const [formData, setFormData] = useState({
        Judul: "",
        UserTujuan: [],
        FileFolder: [],
        TipeTujuan: "individu",
    });
    const [loading, setLoading] = useState(false); // Tambahkan state loading
    // console.log(formData);

    const menuInsert = [
        {
            label: "Unggah dokumen",
            key: "unggah",
        },
        {
            label: "Link/url dokumen",
            key: "link",
        },
    ];
    const [current, setCurrent] = useState("unggah");

    const [opsiUser, setOpsiUser] = useState([]);

    const propsUploadImg = {
        name: judulInsert,
        multiple: true,
        listType: "picture",
        accept: ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xlxs",
        fileList: formData.FileFolder,
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

                setFormData((prevData) => ({ ...prevData, FileFolder: newFileList }));
                setValidationStatus("error file", "File harus kurang dari 5Mb");
            } else {
                setFormData((prevData) => ({ ...prevData, FileFolder: info.fileList }));
            }
        },
    };

    const handleCurrentMenu = (value) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            Judul: "",
            UserTujuan: [],
            FileFolder: [],
        }));
        setCurrent(value);
    };
    const handleSelectChange = (value) => {
        if (value.includes("Pilih Semua")) {
            const allValues = opsiUser
                .filter((option) => option.value !== "Pilih Semua") // Filter out "Pilih Semua"
                .map((option) => option.value); // Get all other values

            setFormData((prevData) => ({
                ...prevData,
                UserTujuan: allValues,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                UserTujuan: value,
            }));
        }
    };
    const handleFormDataChange = (tipe, value) => {
        if (tipe === "UserTujuan") {
            handleSelectChange(value);
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [tipe]: value,
            }));
        }
    };

    axios.defaults.withCredentials = true;
    useEffect(() => {
        const fetchDataUser = async () => {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };
            try {
                const response = await axios.get(`${urlServer}/user`, headers);
                const responseData = response.data;
                // console.log(responseData);

                const allowedRoleIDs =
                    tujuanMapingByFitur[judulInsert]?.map((role) => role.value) || [];

                const transformedData = responseData
                    .filter((data) => data.Role?.some((r) => allowedRoleIDs.includes(r.RoleID)))
                    .map((data) => ({
                        value: data.UserID,
                        label: data.Nama,
                        role: data.Role,
                    }));

                setOpsiUser([...transformedData]);
            } catch (error) {
                // console.log(error);
            }
        };

        if (formData.TipeTujuan === "individu") {
            handleFormDataChange("UserTujuan", []); //menghapus pilihan dari UserTujuan yg sudah terpilih
            fetchDataUser();
        }

        if (formData.TipeTujuan === "group") {
            handleFormDataChange("UserTujuan", []); //menghapus pilihan dari UserTujuan yg sudah terpilih
            setOpsiUser([
                { value: "Pilih Semua", label: "Pilih Semua" },
                ...tujuanMapingByFitur[judulInsert],
            ]);
        }
    }, [formData.TipeTujuan]);

    const form = () => {
        return (
            <div className="d-flex flex-column gap-3">
                <div className="form-input text d-flex align-items-start">
                    <label htmlFor="" className="d-flex w-25 gap-2">
                        <p className="text-danger">*</p>
                        Judul dokumen
                    </label>
                    <Input
                        value={formData["Judul"]}
                        placeholder="Masukkan judul dokumen"
                        onChange={(e) => handleFormDataChange("Judul", e.target.value)}
                        style={{ color: "#616161" }}
                    />
                </div>
                <div className="form-input select d-flex align-items-start">
                    <label htmlFor="" className="d-flex w-25 gap-2">
                        <p className="text-danger">*</p>
                        Dibuat untuk
                    </label>
                    <div className="d-flex flex-column w-100 gap-2">
                        <Radio.Group
                            block
                            options={[
                                { label: "Individu", value: "individu" },
                                { label: "Group", value: "group" },
                            ]}
                            value={formData["TipeTujuan"]}
                            onChange={(e) => handleFormDataChange("TipeTujuan", e.target.value)}
                            optionType="button"
                            buttonStyle="solid"
                        />
                        <Select
                            className="w-100"
                            mode="multiple"
                            allowClear
                            placeholder="Pilih..."
                            value={formData["UserTujuan"]}
                            onChange={(value) => handleFormDataChange("UserTujuan", value)}
                            optionFilterProp="label"
                            options={opsiUser}
                        />
                    </div>
                </div>
                {current === "unggah" && (
                    <div className="form-input file">
                        <Dragger height={250} {...propsUploadImg}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                Klik atau tarik file ke area ini untuk mengunggah
                            </p>
                            <p className="ant-upload-hint">
                                Mendukung unggah file tunggal atau dalam jumlah banyak. Dengan
                                format file berikut, .png, .jpg, .jpeg, .webp, .pdf, .doc, .docx,
                                .xlxs. File harus berukuran maksimal 5 Mb
                            </p>
                        </Dragger>
                    </div>
                )}

                {current === "link" && (
                    <div className="form-input text d-flex align-items-start">
                        <label htmlFor="" className="d-flex w-25 gap-2">
                            <p className="text-danger">*</p>
                            Link/url dokumen
                        </label>
                        <Input
                            placeholder="Masukkan link/url dari dokumen Anda"
                            value={formData["FileFolder"]}
                            onChange={(e) => handleFormDataChange("FileFolder", e.target.value)}
                        />
                    </div>
                )}
            </div>
        );
    };

    const formatFormData = (formData) => {
        let newFormData = new FormData();

        for (const key in formData) {
            if (key === "FileFolder" && Array.isArray(formData[key])) {
                formData[key].map((file) => {
                    const fileObj = file.originFileObj;
                    newFormData.append(key, fileObj);
                });
            } else {
                newFormData.append(key, formData[key]);
            }
        }
        newFormData.append("FiturID", fiturMaping[judulInsert]);
        newFormData.append("TglDibuat", new Date().getTime());
        newFormData.append("UserID_dibuat", userSession?.dataUser?.UserID);

        return newFormData;
    };

    //agar ketika FileFolder berukuran 1 array dan di formToJSON akan tetap berformat array
    //karena kalau tidak formToJSON akan mengubah array berukuran 1 itu menjadi object biasa
    const normalizeFileFolder = (data) => {
        // Jika FileFolder adalah array dari objek file, kita bisa mengambil hanya metadata yang diperlukan
        if (!Array.isArray(data.FileFolder)) {
            data.FileFolder = [data.FileFolder];
        }

        // Konversi UserTujuan dari string karena formTOJSOn "2,3" menjadi array [2, 3]
        data.UserTujuan = data.UserTujuan.split(",").map(Number);

        // Pastikan ID dan Tanggal dalam format number
        data.FiturID = Number(data.FiturID);
        data.TglDibuat = Number(data.TglDibuat);
        data.UserID_dibuat = Number(data.UserID_dibuat);

        return data;
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

            const normalizedData = normalizeFileFolder(formToJSON(formattedFormData)); // Normalisasi file folder untuk validasi
            // console.log(normalizedData, "TEST");

            // Lakukan validasi menggunakan Joi
            const validateFunction = inputValidator["DataFitur"];
            validateFunction(normalizedData);

            //POST REQUEST
            await axios.post(`${urlServer}/data`, formattedFormData, headers);
            setLoading(false);
            setValidationStatus("Berhasil", "Data berhasil ditambahkan");
        } catch (error) {
            // console.log(error);
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
            centered
            width={1000}
            open={currState}
            onOk={() => setState(false)}
            onCancel={() => (loading ? false : setState(false))}
            closable={loading ? true : false}
            loading={loading}
            footer={[
                <>
                    <div className="d-flex w-100 justify-content-end">
                        {/* <div>
                            <Popover content={<p>Simpan di draft</p>} trigger={"hover"}>
                                <Button
                                    key="save"
                                    icon={<SaveTwoTone twoToneColor={"#399051"} />}
                                ></Button>
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

                            <Button
                                loading={loading}
                                key="unggah"
                                type="primary"
                                onClick={insertFormData}
                            >
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
            <Menu
                onClick={(e) => handleCurrentMenu(e.key)}
                selectedKeys={[current]}
                mode="horizontal"
                items={menuInsert}
                className="d-flex w-100 justify-content-start"
            />
            {menuInsert.map((item, i) => (
                <>
                    {current === item.key && (
                        <div key={i} className="container form-container p-3">
                            {form()}
                        </div>
                    )}
                </>
            ))}
        </Modal>
    );
}

export default ModalInsert;
