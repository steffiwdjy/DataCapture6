import { Button, Input, Modal, Popconfirm, Popover, Result, Select, Tag, Tooltip } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import DetailDataController from "../utils/detailDataController";
import { DeleteTwoTone, UndoOutlined } from "@ant-design/icons";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import { mapMultiRoleSelect } from "../utils/RequestFormatter";
import useValidator from "../constaints/FormValidation";
import { inputValidator } from "../utils/inputValidator";

function ModalDetailPengguna({ judulDetail }) {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    const { isDetailOpen, oneDataID, setDetailOpen } = DetailDataController();
    const { ValidationStatus, setValidationStatus, setCloseAlert } = useValidator();
    const [loading, setLoading] = useState(false); // Tambahkan state loading
    const [formData, setFormData] = useState(null);
    const [dataOne, setDataOne] = useState(null);
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

        const fetchOneData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${urlServer}/user/${oneDataID}`, headers);
                const responseData = response?.data;

                const transformedData = {
                    ...responseData,
                    Role: responseData.Role.map((role) => role.RoleID),
                    Status:
                        responseData.Status === "Active"
                            ? "Aktif"
                            : responseData.Status === "RevokeAgreement"
                            ? "Izin dinonaktifkan"
                            : responseData.Status === "Unactive"
                            ? "Tidak aktif"
                            : "Tidak terdefinisi",
                };

                setFormData(transformedData);
                setDataOne({
                    ...responseData,
                    Role: responseData.Role.map((role) => ({ RoleID: role.RoleID })),
                    Status:
                        responseData.Status === "Active"
                            ? "Aktif"
                            : responseData.Status === "RevokeAgreement"
                            ? "Izin dinonaktifkan"
                            : responseData.Status === "Unactive"
                            ? "Tidak aktif"
                            : "Tidak terdefinisi",
                });
            } catch (error) {
                // console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpsiRole();
        fetchOneData();
    }, [isDetailOpen]);

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

    const formatFormData = (formData, isReactivateStatus) => {
        const formatRole = formData.Role.map((value) => ({
            RoleID: value,
        }));
        const newRole = mapMultiRoleSelect(formatRole, dataOne?.Role, "RoleID");

        const { Status, AlasanBatal, ...formDataClean } = formData; //membuang objek Status, dan Alasan Batal

        let transformedData;

        transformedData = {
            User: {
                ...formDataClean,
                Email: formData.Email === "" ? null : formData.Email,
                NoTelp: formData.NoTelp === "" ? null : formData.NoTelp,
                Role: newRole,
            },
        };

        if (isReactivateStatus === true) {
            transformedData.Mode = {
                Nama: "reactivateStatus",
            };
        }

        return transformedData;
    };

    const updateFormData = async (isReactivateStatus) => {
        setLoading(true);
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };

            const formattedFormData = formatFormData(formData, isReactivateStatus);

            // Lakukan validasi menggunakan Joi
            const validateFunction = inputValidator["UpdateDataUser"];
            validateFunction(formattedFormData.User);

            await axios.patch(`${urlServer}/user`, formattedFormData, headers);
            setLoading(false);
            setValidationStatus("Berhasil", "Data berhasil diubah");
        } catch (error) {
            setLoading(false);
            if (error?.response?.data?.error) {
                setValidationStatus(error.path, error.response.data.error);
            } else {
                setValidationStatus(error.path, error.message);
            }
        }
    };

    const deleteFormData = async () => {
        setLoading(true);
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };

            await axios.delete(`${urlServer}/user/${oneDataID}`, headers);
            setLoading(false);
            setValidationStatus("Berhasil", "Data berhasil dihapus");
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
            title={
                <>
                    <div className="d-flex justify-content-between align-items-center">
                        {judulDetail}
                        <div className="d-flex gap-2 align-items-center">
                            <Tooltip
                                title={
                                    formData?.Status === "Aktif"
                                        ? "Pengguna aktif"
                                        : formData?.Status === "Izin dinonaktifkan"
                                        ? "Pengguna mencabut persetujuan Syarat & Ketentuan"
                                        : formData?.Status === "Tidak aktif"
                                        ? "Pengguna telah dinonaktifkan"
                                        : "Tidak terdefinisi"
                                }
                            >
                                <Tag
                                    color={
                                        formData?.Status === "Aktif"
                                            ? "success"
                                            : formData?.Status === "Izin dinonaktifkan"
                                            ? "warning"
                                            : formData?.Status === "Tidak aktif"
                                            ? "error"
                                            : "default"
                                    }
                                    style={{
                                        width: "max-content",
                                        height: "max-content",
                                        cursor: "default",
                                    }}
                                >
                                    {formData?.Status}
                                </Tag>
                            </Tooltip>
                            {formData?.Status === "Izin dinonaktifkan" && (
                                <Popover
                                    content={<p>Mengaktifkan kembali akun pengguna</p>}
                                    trigger={"hover"}
                                >
                                    <Button
                                        onClick={() => updateFormData(true)}
                                        key="reactivate"
                                        icon={<UndoOutlined />}
                                    />
                                </Popover>
                            )}
                        </div>
                    </div>
                </>
            }
            loading={loading}
            closable={loading ? true : false}
            centered
            width={1000}
            open={isDetailOpen}
            onCancel={() => {
                loading ? false : setDetailOpen(null, null);
            }}
            footer={[
                <>
                    <div className="d-flex w-100 justify-content-between gap-3">
                        <div>
                            <Popover content={<p>Hapus akun pengguna</p>} trigger={"hover"}>
                                <Popconfirm
                                    icon={false}
                                    title="Apakah anda yakin menghapus data pengguna?"
                                    description="Data pengguna akan dihapus sepenuhnya, dan tidak dapat dikembalikan."
                                    onConfirm={deleteFormData}
                                    okText="Iya"
                                    cancelText="Tidak"
                                    placement="top"
                                >
                                    <Button
                                        key="delete"
                                        variant="outlined"
                                        icon={<DeleteTwoTone twoToneColor="#f5222d" />}
                                        danger
                                    ></Button>
                                </Popconfirm>
                            </Popover>
                        </div>
                        <div className="d-flex gap-3">
                            <Button
                                key="tutup"
                                className="text-light bg-secondary"
                                onClick={() => {
                                    setDetailOpen(null, null);
                                }}
                            >
                                Tutup
                            </Button>
                            <Popconfirm
                                icon={false}
                                title="Apakah anda yakin mengubah data pengguna?"
                                description="Data pengguna akan diperbarui setelah konfirmasi. Pastikan informasi yang diubah sudah benar."
                                onConfirm={updateFormData}
                                okText="Iya"
                                cancelText="Tidak"
                            >
                                <Button key="simpan" type="primary">
                                    Simpan
                                </Button>
                            </Popconfirm>
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
                {formData?.Status === "Izin dinonaktifkan" && (
                    <p className="text-warning">
                        Pengguna mengajukan permintaan penghapusan data pribadi, dengan alasan{" "}
                        <strong>{formData?.AlasanBatal}</strong>
                    </p>
                )}
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

export default ModalDetailPengguna;
