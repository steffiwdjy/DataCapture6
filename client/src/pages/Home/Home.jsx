import React, { useEffect, useMemo, useState } from "react";
import GlobalLayout from "../../components/Layout/GlobalLayout";
import MainContent from "../../components/Layout/MainContent";
import { Avatar, Badge } from "antd";
import { faBell, faFile } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { urlServer } from "../../utils/endpoint";
import { bagiArrayAkses, listHakAkses, multiRoleAkses } from "../../models/MenuRoleAkses";
import HomeLayout from "../../components/Layout/HomeLayout";
import { threelogo } from "../../../public/assets/images";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import toogleModal from "../../utils/toogleModal";
import ModalNotifikasi from "../../components/ModalNotifikasi";
import ModalDokumenJarrdin from "../../components/ModalDokumenJarrdin";
import ModalConfirmLogout from "../../components/ModalConfirmLogout";
import ModalPengaturan from "../../components/ModalPengaturan";
import { SettingOutlined } from "@ant-design/icons";
import ModalTnC from "../../components/ModalTnC";
import ModalDownloadData from "../../components/ModalDownloadData";

function Home() {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    // console.log(userSession);

    const { isModalOpen, setIsModalOpen } = toogleModal();

    const dataUser = userSession?.dataUser;
    const [fiturUser, setFiturUser] = useState([]);
    const [dataNotif, setDataNotif] = useState(null);

    const contentInfoRole = (role) => {
        switch (role) {
            case "Pengurus":
                return (
                    <div>
                        <p>Membuat Pengumuman</p>
                        <p>Membuat Laporan</p>
                        <p>Menerima Aspirasi</p>
                    </div>
                );

            case "Pengelola":
                return (
                    <div>
                        <p>Membuat Tagihan Bulanan</p>
                        <p>Membuat Buletin Kegiatan</p>
                        <p>Membuat Informasi Paket</p>
                        <p>Membuat Pengumuman Pengelola</p>
                    </div>
                );

            case "Pemilik Unit":
                return (
                    <div>
                        <p>Membuat Aspirasi</p>
                        <p>Menerima Pengumuman</p>
                        <p>Menerima Laporan</p>
                        <p>Menerima Tagihan Bulanan</p>
                        <p>Menerima Buletin Kegiatan</p>
                        <p>Menerima Informasi Paket</p>
                    </div>
                );

            case "Pelaku Komersil":
                return (
                    <div>
                        <p>Membuat Pengumuman Usaha</p>
                        <p>Menerima Pengumuman</p>
                        <p>Menerima Laporan</p>
                        <p>Menerima Tagihan Bulanan</p>
                        <p>Menerima Buletin Kegiatan</p>
                        <p>Menerima Informasi Paket</p>
                    </div>
                );

            case "Admin":
                return (
                    <div>
                        <p>Mengelola Data Pengguna</p>
                    </div>
                );
        }
    };

    axios.defaults.withCredentials = true;
    useEffect(() => {
        const transformedFitur = () => {
            console.log(dataUser,"DATA USER")
            const arr = listHakAkses(dataUser?.Fitur);
            const arr2 = bagiArrayAkses(arr);
            console.log(arr2)
            setFiturUser(arr2);
        };

        const fetchNotif = async () => {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };
            try {
                const response = await axios.get(`${urlServer}/notif`, headers);
                // console.log(response);

                setDataNotif(response.data);
            } catch (error) {
                // console.log(error);
            }
        };

        transformedFitur();
        fetchNotif();
    }, []);

    const Header = () => {
        return (
            <div className="header bg-theme shadow p-3 ps-5 pe-5 d-flex w-100 justify-content-between align-items-center">
                <h6 className="text-light fw-medium">
                    Selamat Datang,{" "}
                    {dataUser?.Nama?.length > 33
                        ? dataUser.Nama.slice(0, 30) + "..."
                        : dataUser?.Nama}
                </h6>
                <div className="d-flex gap-3">
                    <Avatar
                        onClick={() => setIsModalOpen("dokumenjarrdin")}
                        style={{ cursor: "pointer" }}
                        shape="circle"
                        size={"large"}
                        className="btn-theme2"
                        icon={<FontAwesomeIcon size="xs" icon={faFile} color="#024332" />}
                    />
                    <Badge count={dataNotif?.TotalUnRead || 0}>
                        <Avatar
                            onClick={() => setIsModalOpen("notifikasi")}
                            style={{ cursor: "pointer" }}
                            shape="circle"
                            size={"large"}
                            className="btn-theme2"
                            icon={<FontAwesomeIcon size="xs" icon={faBell} color="#024332" />}
                        />
                    </Badge>
                    <Avatar
                        onClick={() => setIsModalOpen("pengaturan")}
                        style={{ cursor: "pointer" }}
                        shape="circle"
                        size={"large"}
                        className="btn-theme2"
                        icon={<SettingOutlined style={{ fontSize: "20px", color: "#024332" }} />}
                    />
                </div>
            </div>
        );
    };
    const Footer = () => {
        return (
            <div className="footer p-3 ps-5 pe-5 d-flex w-100 justify-content-between align-items-center">
                <img
                    className="img-threeLogo"
                    src={threelogo}
                    alt="3 logo"
                    style={{ width: "350px", height: "75px" }}
                />
                <div
                    className="d-flex border border-top btn-home-logout justify-content-center align-items-center rounded-circle border border-2"
                    style={{ height: "45px", width: "45px", cursor: "pointer" }}
                    onClick={() => setIsModalOpen("logout")}
                >
                    <FontAwesomeIcon size="sm" icon={faArrowRightFromBracket} color="#FFFFFF" />
                </div>
            </div>
        );
    };

    return (
        <>
            <GlobalLayout active={"home"}>
                <MainContent
                    header={<Header />}
                    content={
                        <HomeLayout
                            dataUser={dataUser}
                            fiturUser={fiturUser}
                            contentInfoRole={contentInfoRole}
                        />
                    }
                    footer={<Footer />}
                />
            </GlobalLayout>

            {isModalOpen === "notifikasi" && <ModalNotifikasi dataNotif={dataNotif} />}
            {isModalOpen === "dokumenjarrdin" && <ModalDokumenJarrdin />}
            {isModalOpen === "pengaturan" && <ModalPengaturan />}
            {isModalOpen === "logout" && <ModalConfirmLogout />}
            {userSession?.dataUser?.IsKetentuan === false &&
                userSession?.dataUser?.Status !== "RevokeAgreement" && <ModalTnC />}
            {userSession?.dataUser?.Status === "RevokeAgreement" && <ModalDownloadData />}
        </>
    );
}

export default Home;
