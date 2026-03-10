import React, { useEffect, useMemo, useState } from "react";
import useValidator from "../constaints/FormValidation";
import { Button, Input, Modal, Result, Select } from "antd";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import { inputValidator } from "../utils/inputValidator";

function ModalInsertPengguna({ currState, setState, judulInsert }) {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    const { ValidationStatus, setValidationStatus, setCloseAlert } = useValidator();
    const [formData, setFormData] = useState({
        Nama: "",
        Email: "",
        NoTelp: "",
        Alamat: "",
        NoUnit: "",
        Role: [],
    });
    const [loading, setLoading] = useState(false); // Tambahkan state loading
    const [opsiRole, setOpsiRole] = useState([]);

    axios.defaults.withCredentials = true;
    useEffect(() => {
        const headers = {
            headers: {
                authorization: userSession?.AuthKey,
            },
        };
        const fetchOpsiRole = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${urlServer}/role`, headers);
                const responseData = response?.data;
                const transformedData = responseData.map((role) => ({
                    value: role.RoleID,
                    label: role.Nama,
                }));

                setOpsiRole(transformedData);
            } catch (error) {
                // console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpsiRole();
    }, [currState]);

    // console.log(formData);

    const handleFormDataChange = (tipe, value) => {
        setFormData((prevData) => {
            // Jika tipe adalah NoTelp, lakukan validasi
            if (tipe === "NoTelp") {
                // Hanya angka, maksimal 20 karakter
                const numericValue = value.replace(/\D/g, "").slice(0, 13);
                return { ...prevData, NoTelp: numericValue };
            }

            // Jika tipe bukan NoTelp, langsung update
            return { ...prevData, [tipe]: value };
        });
    };

    const insertFormData = async () => {
        setLoading(true);
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };

            const validateFunction = inputValidator["InsertDataUser"];
            validateFunction(formData);

            await axios.post(`${urlServer}/user`, { User: formData }, headers);
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
            closable={loading ? false : true}
            loading={loading}
            footer={[
                <>
                    <div className="d-flex w-100 justify-content-end gap-3">
                        <Button
                            key="tutup"
                            className="text-light bg-secondary"
                            onClick={() => setState(false)}
                        >
                            Tutup
                        </Button>
                        <Button key="tambah" type="primary" onClick={insertFormData}>
                            Tambah
                        </Button>
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
                        } else {
                            //jika berhasil maka modal alert & modal form  yg ditutup
                            setCloseAlert(), window.location.reload();
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
            <div className="d-flex flex-column gap-3">
                <div className="form-input text d-flex align-items-center">
                    <label htmlFor="" className="d-flex w-25 gap-1">
                        <p className="text-danger">*</p>
                        Peran
                    </label>
                    <Select
                        className="w-100"
                        mode="multiple"
                        allowClear
                        placeholder="Pilih..."
                        value={formData?.Role}
                        onChange={(value) => handleFormDataChange("Role", value)}
                        optionFilterProp="label"
                        options={opsiRole}
                    />
                </div>

                <div className="form-input text d-flex align-items-center">
                    <label htmlFor="" className="d-flex w-25 gap-1">
                        <p className="text-danger">*</p>
                        Nama
                    </label>
                    <Input
                        style={{ color: "#616161" }}
                        value={formData?.Nama}
                        placeholder="Masukkan nama"
                        onChange={(e) => handleFormDataChange("Nama", e.target.value)}
                    />
                </div>

                <div className="form-input text d-flex align-items-center">
                    <label htmlFor="" className="d-flex w-25 gap-1">
                        <p className="text-danger">*</p>
                        Email
                    </label>
                    <Input
                        style={{ color: "#616161" }}
                        value={formData?.Email}
                        placeholder="Masukkan email"
                        onChange={(e) => handleFormDataChange("Email", e.target.value)}
                    />
                </div>

                <div className="form-input text d-flex align-items-center">
                    <label htmlFor="" className="d-flex w-25 gap-1">
                        <p className="text-light">*</p>
                        No Telepon
                    </label>
                    <Input
                        style={{ color: "#616161" }}
                        value={formData?.NoTelp}
                        placeholder="Masukkan no telepon"
                        onChange={(e) => handleFormDataChange("NoTelp", e.target.value)}
                    />
                </div>

                <div className="form-input text d-flex align-items-center">
                    <label htmlFor="" className="d-flex w-25 gap-1">
                        <p className="text-light">*</p>
                        Alamat
                    </label>
                    <Input
                        style={{ color: "#616161" }}
                        value={formData?.Alamat}
                        placeholder="Masukkan alamat"
                        onChange={(e) => handleFormDataChange("Alamat", e.target.value)}
                    />
                </div>

                <div className="form-input text d-flex align-items-center">
                    <label htmlFor="" className="d-flex w-25 gap-1">
                        <p className="text-danger">*</p>
                        No Unit
                    </label>
                    <Input
                        style={{ color: "#616161" }}
                        value={formData?.NoUnit}
                        placeholder="Masukkan no unit"
                        onChange={(e) => handleFormDataChange("NoUnit", e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
}

export default ModalInsertPengguna;
