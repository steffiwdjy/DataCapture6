import React, { useEffect, useMemo, useState } from "react";
import toogleModal from "../utils/toogleModal";
import {
    Button,
    Card,
    Checkbox,
    Collapse,
    ConfigProvider,
    Divider,
    Empty,
    Input,
    Menu,
    Modal,
    Pagination,
    Popconfirm,
    Result,
    Select,
    Timeline,
    Tooltip,
    Typography,
} from "antd";

import { formatDate } from "../utils/formatDate";
import ChooseDate from "./Filter/ChooseDate";
import { addDays } from "date-fns";
import axios from "axios";
import { urlServer } from "../utils/endpoint";
import useValidator from "../constaints/FormValidation";
import { inputValidator } from "../utils/inputValidator";
import formatTime from "../utils/formatTime";
import { CheckCircleTwoTone } from "@ant-design/icons";

function ModalPengaturan() {
    const { Title, Paragraph } = Typography;
    const [range, setRange] = useState([
        {
            startDate: addDays(new Date(), -1), //kemarin
            endDate: new Date(), //hari ini
            key: "selection",
        },
    ]);
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    // console.log(userSession);

    const [dataUser, setDataUser] = useState(null);
    const [dataLogs, setDataLogs] = useState([]);
    const [currTipeLogs, setCurrTipeLogs] = useState("all");
    // console.log(currTipeLogs);

    const [loading, setLoading] = useState(false);
    const { ValidationStatus, setValidationStatus, setCloseAlert } = useValidator();
    const { isModalOpen, setIsModalOpen } = toogleModal();
    const [currMenu, setCurrMenu] = useState("profil");
    const itemsMenu = [
        {
            key: "profil",
            label: "Profil",
        },
        {
            key: "log",
            label: "Log Aktivitas",
        },
        {
            key: "snk",
            label: "Syarat & Ketentuan",
        },
    ];
    const [openConfirm, setOpenConfirm] = useState(false);
    const [checkedPembatalan, setCheckedPembatalan] = useState(false);

    const [selectedAlasan, setSelectedAlasan] = useState(null);
    const [customAlasan, setCustomAlasan] = useState(null);
    const [finalAlasan, setFinalAlasan] = useState(null);

    const alasanOptions = [
        { value: "retensi_berakhir", label: "Masa retensi data telah tercapai" },
        { value: "tujuan_terpenuhi", label: "Tujuan pemrosesan telah terpenuhi" },
        { value: "permintaan_pengguna", label: "Permintaan pribadi" },
        { value: "lainnya", label: "Lainnya" },
    ];

    const handleAlasanChange = (valueOrEvent) => {
        if (typeof valueOrEvent === "string") {
            // Dipanggil dari <Select>
            setSelectedAlasan(valueOrEvent);

            const selectedOption = alasanOptions.find((opt) => opt.value === valueOrEvent);
            if (valueOrEvent !== "lainnya") {
                setCustomAlasan("");
                setFinalAlasan(selectedOption?.label || "");
            } else {
                setFinalAlasan(customAlasan); // bisa kosong awalnya
            }
        } else if (valueOrEvent?.target) {
            // Dipanggil dari <TextArea>
            const value = valueOrEvent.target.value;
            setCustomAlasan(value);
            if (selectedAlasan === "lainnya") {
                setFinalAlasan(value);
            }
        }
    };

    const [activeKey, setActiveKey] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const handleCollapseChange = (key) => {
        setActiveKey(key);
        setCurrentPage(1); // reset page saat panel berubah
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    axios.defaults.withCredentials = true;
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const headers = { headers: { authorization: userSession?.AuthKey } };
                const [userResponse, logsResponse] = await Promise.all([
                    axios.get(`${urlServer}/user/${userSession?.dataUser?.UserID}`, headers),
                    axios.get(
                        `${urlServer}/user/logs/${currTipeLogs}/${range[0].startDate.getTime()}/${range[0].endDate.getTime()}`,
                        headers
                    ),
                ]);

                setDataUser({
                    ...userResponse.data,
                    Role: userResponse.data.Role.map((role) => " " + role.Nama),
                });

                setDataLogs(
                    logsResponse.data.map((item) => ({
                        Tanggal: formatDate(item.Tanggal),
                        Logs: item.Logs.map((log) => ({
                            ...log,
                            waktu: formatTime.formatTime2(log.waktu),
                        })),
                    }))
                );
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [currTipeLogs, range[0].startDate, range[0].endDate]);

    const formatFormData = (formData) => {
        const transformedData = {
            User: {
                ...formData,
                Email: formData.Email === "" ? null : formData.Email,
                NoTelp: formData.NoTelp === "" ? null : formData.NoTelp,
                Role: [],
            },
        };

        delete transformedData.User?.AlasanBatal;
        delete transformedData.User?.Status;
        return transformedData;
    };

    const updateFormData = async () => {
        setLoading(true);
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };

            const formattedFormData = formatFormData(dataUser);

            // Lakukan validasi menggunakan Joi
            const validateFunction = inputValidator["UpdateDataUser"];
            validateFunction(formattedFormData.User);

            const res = await axios.patch(`${urlServer}/user`, formattedFormData, headers);

            if (res?.data?.success) {
                // Ambil ulang userSession
                const dataUpdated = res?.data?.data?.User;

                const session = JSON.parse(localStorage.getItem("userSession"));

                // Perbarui hanya isKetentuan
                const updatedSession = {
                    ...session,
                    dataUser: {
                        ...session.dataUser,
                        Nama: dataUpdated.Nama,
                        Email: dataUpdated.Email,
                        NoTelp: dataUpdated.NoTelp,
                    },
                };

                // Simpan kembali ke localStorage
                localStorage.setItem("userSession", JSON.stringify(updatedSession));
            }

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

    const revokeAgreement = async () => {
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };

            const formattedFormData = {
                User: {
                    UserID: userSession?.dataUser.UserID,
                    IsKetentuan: false,
                },
                Mode: {
                    Nama: "updateKetentuan",
                    Deskripsi: finalAlasan,
                },
            };

            const res = await axios.patch(`${urlServer}/user`, formattedFormData, headers);
            if (res?.data?.success) {
                // Ambil ulang userSession
                const session = JSON.parse(localStorage.getItem("userSession"));
                const dataUpdated = res?.data?.data?.User;

                // Perbarui hanya isKetentuan
                const updatedSession = {
                    ...session,
                    dataUser: {
                        ...session.dataUser,
                        IsKetentuan: dataUpdated.IsKetentuan,
                        Status: dataUpdated.Status,
                    },
                };

                // Simpan kembali ke localStorage
                localStorage.setItem("userSession", JSON.stringify(updatedSession));
            }

            setValidationStatus(
                "Berhasil",
                "Permintaan Anda untuk menghapus data pribadi telah berhasil dikirim kepada administrator sistem."
            );
        } catch (error) {
            console.error("Gagal memperbarui IsKetentuan", error);
        }
    };

    const handleFormDataChange = (tipe, value) => {
        setDataUser((prevData) => {
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

    const menuUI = (currMenu) => {
        if (currMenu === "profil") {
            return (
                <div className="d-flex flex-column gap-3 w-100">
                    <div className="form-input text d-flex flex-column w-100">
                        <label htmlFor="" className="d-flex gap-1">
                            Peran
                        </label>
                        <Input style={{ color: "#616161" }} value={dataUser?.Role} disabled />
                    </div>

                    <div className="form-input text d-flex flex-column w-100">
                        <label htmlFor="" className="d-flex w-25 gap-1">
                            <p className="text-danger">*</p>
                            Nama
                        </label>
                        <Input
                            style={{ color: "#616161" }}
                            value={dataUser?.Nama}
                            placeholder="Masukkan nama"
                            onChange={(e) => handleFormDataChange("Nama", e.target.value)}
                        />
                    </div>

                    <div className="d-flex justify-content-around gap-3 w-100">
                        <div className="form-input text d-flex flex-column w-100">
                            <label htmlFor="" className="d-flex w-25 gap-1">
                                <p className="text-danger">*</p>
                                Email
                            </label>
                            <Input
                                style={{ color: "#616161" }}
                                value={dataUser?.Email}
                                placeholder="Masukkan email"
                                onChange={(e) => handleFormDataChange("Email", e.target.value)}
                            />
                        </div>
                        <div className="form-input text d-flex flex-column w-100">
                            <label htmlFor="" className="d-flex w-25 gap-1">
                                No Telepon
                            </label>
                            <Input
                                style={{ color: "#616161" }}
                                value={dataUser?.NoTelp}
                                placeholder="Masukkan no telepon"
                                onChange={(e) => handleFormDataChange("NoTelp", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-around gap-3 w-100">
                        <div className="form-input text d-flex flex-column w-100">
                            <label htmlFor="" className="d-flex w-25 gap-1">
                                <p className="text-light">*</p>
                                Alamat
                            </label>
                            <Input
                                style={{ color: "#616161" }}
                                value={dataUser?.Alamat}
                                placeholder="Masukkan alamat"
                                onChange={(e) => handleFormDataChange("Alamat", e.target.value)}
                            />
                        </div>

                        <div className="form-input text d-flex flex-column w-100">
                            <label htmlFor="" className="d-flex w-25 gap-1">
                                <p className="text-danger">*</p>
                                No Unit
                            </label>
                            <Input
                                style={{ color: "#616161" }}
                                value={dataUser?.NoUnit}
                                placeholder="Masukkan no unit"
                                onChange={(e) => handleFormDataChange("NoUnit", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end w-100 mt-5">
                        <Popconfirm
                            icon={false}
                            title="Apakah anda yakin mengubah data akun anda?"
                            description="Data akun anda akan diperbarui setelah konfirmasi. Pastikan informasi yang diubah sudah benar."
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
            );
        }

        if (currMenu === "log") {
            return (
                <div className="d-flex flex-column w-100 gap-5">
                    <div className="container-filter-log d-flex flex-column align-items-start gap-3 w-100">
                        <p className="text-secondary">Filter berdasarkan :</p>
                        <div className="d-flex align-items-center gap-3 w-100">
                            <ChooseDate range={range} setRange={setRange} />

                            <Select
                                size="large"
                                style={{ width: "15rem" }}
                                defaultValue={currTipeLogs}
                                options={[
                                    { value: "all", label: "Semua Tipe" },
                                    { value: "login", label: "Login" },
                                    { value: "insert", label: "Tambah Data" },
                                    { value: "update", label: "Ubah Data" },
                                ]}
                                onChange={(value) => setCurrTipeLogs(value)}
                            />
                        </div>
                    </div>

                    {dataLogs.length > 0 ? (
                        <Collapse
                            accordion
                            ghost
                            defaultActiveKey={0}
                            size="small"
                            onChange={handleCollapseChange}
                            items={dataLogs.map((dataLog, i) => {
                                const isActive = String(activeKey) === String(i);
                                const logsToShow = isActive
                                    ? dataLog.Logs.slice(
                                          (currentPage - 1) * pageSize,
                                          currentPage * pageSize
                                      )
                                    : [];

                                return {
                                    key: i,
                                    label: <h6 className="periode-log mt-1">{dataLog.Tanggal}</h6>,
                                    children: (
                                        <>
                                            <Timeline
                                                mode="left"
                                                items={logsToShow.map((log, j) => ({
                                                    key: `${i}-${j}`,
                                                    children: (
                                                        <Card size="small">
                                                            <div className="d-flex justify-content-between">
                                                                <p className="fw-semibold mb-1">
                                                                    {log.aksi}
                                                                </p>
                                                                <p className="text-secondary mb-1">
                                                                    {log.waktu}
                                                                </p>
                                                            </div>
                                                            <p className="mb-0">{log.keterangan}</p>
                                                        </Card>
                                                    ),
                                                }))}
                                            />
                                        </>
                                    ),
                                };
                            })}
                        />
                    ) : (
                        <Empty description="Tidak terdapat data log pengguna" />
                    )}
                    {dataLogs.length > 0 && activeKey !== null && dataLogs[activeKey] && (
                        <div className="d-flex justify-content-end">
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={dataLogs[activeKey].Logs.length}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </div>
            );
        }

        if (currMenu === "snk") {
            return (
                <div className="d-flex flex-column gap-4 overflow-auto" style={{ height: "30rem" }}>
                    <div>
                        <Title level={2}>
                            Syarat dan Ketentuan Penggunaan{" "}
                            <Tooltip title="Syarat dan Ketentuan Penggunaan Aplikasi Web Member telah disetujui oleh pengguna">
                                <CheckCircleTwoTone twoToneColor="#52c41a" />
                            </Tooltip>
                        </Title>
                        <Paragraph type="secondary">Terakhir diperbarui: 15 Mei 2025</Paragraph>

                        <Paragraph>
                            Dengan mengakses atau menggunakan situs{" "}
                            <strong>Member The Jarrdin Cihampelas</strong>, Anda menyetujui
                            pengumpulan, pemrosesan, dan penyimpanan data pribadi sesuai dengan
                            <strong>
                                {" "}
                                Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU
                                PDP)
                            </strong>
                            .
                        </Paragraph>

                        <Divider />

                        <Title level={4}>1. Pengumpulan dan Penggunaan Data</Title>
                        <Paragraph>
                            Kami mengumpulkan data pribadi secara sah, terbatas, dan transparan
                            untuk keperluan operasional layanan, termasuk nama, email, nomor
                            telepon, alamat, dan informasi unit. Data tidak akan diproses di luar
                            tujuan yang telah disampaikan.
                        </Paragraph>

                        <Title level={4}>2. Hak Pengguna</Title>
                        <Paragraph>
                            Anda memiliki hak untuk:
                            <ul>
                                <li>Mendapat informasi terkait data Anda yang kami simpan.</li>
                                <li>Mengakses, memperbarui, atau menghapus data pribadi Anda.</li>
                                <li>
                                    Menarik kembali persetujuan atas pengolahan data kapan saja.
                                </li>
                            </ul>
                        </Paragraph>

                        <Title level={4}>3. Keamanan dan Kerahasiaan</Title>
                        <Paragraph>
                            Kami menggunakan langkah teknis dan administratif yang wajar untuk
                            menjaga keamanan dan kerahasiaan data pribadi Anda dari akses ilegal
                            atau penyalahgunaan.
                        </Paragraph>

                        <Title level={4}>4. Pembagian ke Pihak Ketiga</Title>
                        <Paragraph>
                            Data Anda tidak akan dibagikan ke pihak ketiga tanpa persetujuan Anda,
                            kecuali untuk memenuhi kewajiban hukum atau kontrak layanan tertentu.
                        </Paragraph>

                        <Title level={4}>5. Persetujuan</Title>
                        <Paragraph>
                            Dengan menyetujui Syarat dan Ketentuan ini, Anda memberikan persetujuan
                            eksplisit atas pengumpulan dan pemrosesan data pribadi Anda sesuai UU
                            PDP.
                        </Paragraph>

                        <Title level={4}>6. Perubahan Syarat</Title>
                        <Paragraph>
                            Kami dapat memperbarui ketentuan ini sewaktu-waktu. Kami akan memberi
                            tahu Anda jika ada perubahan signifikan.
                        </Paragraph>

                        <Title level={4}>7. Kontak</Title>
                        <Paragraph>
                            Untuk permintaan atau pertanyaan terkait data pribadi Anda, silakan
                            hubungi kami melalui email:{" "}
                            <a href="mailto:thejarrdinbdg@gmail.com">thejarrdinbdg@gmail.com</a>
                        </Paragraph>
                    </div>

                    <button className="btn btn-danger" onClick={() => setOpenConfirm(true)}>
                        Batalkan persetujuan
                    </button>
                </div>
            );
        }
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Menu: { itemSelectedColor: "#ffffff", itemSelectedBg: "#399051" },
                },
            }}
        >
            <Modal
                title="Pengaturan Akun"
                open={isModalOpen === "pengaturan"}
                onCancel={() => (loading ? false : setIsModalOpen(false))}
                closable={loading === true ? false : true}
                footer={false}
                width={1000}
                loading={loading}
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
                <div className="body-modal-pengaturan d-flex gap-4">
                    <Menu
                        className="menu-pengaturan-horizontal"
                        mode="horizontal"
                        defaultSelectedKeys={currMenu}
                        items={itemsMenu}
                        onClick={(e) => setCurrMenu(e.key)}
                    />
                    <Menu
                        className="menu-pengaturan-vertical"
                        defaultSelectedKeys={currMenu}
                        items={itemsMenu}
                        onClick={(e) => setCurrMenu(e.key)}
                    />
                    {menuUI(currMenu)}
                </div>

                <Modal
                    open={openConfirm}
                    onOk={revokeAgreement}
                    onCancel={() => (
                        setCheckedPembatalan(false),
                        setOpenConfirm(false),
                        setSelectedAlasan(null),
                        setCustomAlasan(null)
                    )}
                    centered
                    title="Konfirmasi Pembatalan Persetujuan"
                    okText="Saya Mengerti"
                    cancelText="Batal"
                    okButtonProps={{
                        type: "default",
                        danger: checkedPembatalan && finalAlasan?.trim() !== "",
                        disabled:
                            !checkedPembatalan ||
                            finalAlasan?.trim() === "" ||
                            finalAlasan === null,
                    }}
                    cancelButtonProps={{ type: "primary" }}
                >
                    <div>
                        <p>
                            Dengan membatalkan persetujuan terhadap{" "}
                            <strong>Syarat dan Ketentuan</strong>, Anda{" "}
                            <strong>
                                menyatakan bersedia mengajukan permintaan penghapusan data pribadi
                            </strong>{" "}
                            Anda kepada administrator sistem.
                        </p>
                        <p>Permintaan ini dilakukan atas dasar:</p>
                        <ul style={{ paddingLeft: "1.2rem" }}>
                            <li>Masa retensi data telah tercapai;</li>
                            <li>Tujuan pemrosesan data pribadi telah terpenuhi; atau</li>
                            <li>
                                Permintaan diajukan langsung oleh Anda sebagai Subjek Data Pribadi.
                            </li>
                        </ul>

                        <div className="d-flex flex-column gap-2 mt-2 mb-2">
                            <p>Pilih alasan pembatalan:</p>
                            <Select
                                style={{ width: "100%" }}
                                placeholder="Pilih alasan"
                                value={selectedAlasan}
                                options={alasanOptions}
                                onChange={handleAlasanChange}
                            />

                            {selectedAlasan === "lainnya" && (
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Masukkan alasan lain"
                                    value={customAlasan}
                                    onChange={handleAlasanChange}
                                />
                            )}
                        </div>

                        <p style={{ color: "#faad14" }}>
                            Tindakan ini akan menyebabkan{" "}
                            <strong>penghentian akses ke sistem</strong> dan penghapusan data
                            pribadi Anda akan diproses sesuai ketentuan hukum yang berlaku.
                        </p>

                        <Checkbox
                            checked={checkedPembatalan}
                            onChange={(e) => setCheckedPembatalan(e.target.checked)}
                            style={{ marginTop: "1rem" }}
                        >
                            Saya memahami dan menyetujui konsekuensi di atas.
                        </Checkbox>
                    </div>
                </Modal>
            </Modal>
        </ConfigProvider>
    );
}

export default ModalPengaturan;
