import { faBell } from "@fortawesome/free-regular-svg-icons";
import { multiRoleAkses, bagiArrayAkses } from "../../models/menuRoleAkses";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons/faArrowRightFromBracket";
import { threelogo } from "../../../public/assets/images/index";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import UseSessionCheck from "../../utils/useSessionCheck";
import { Avatar, Badge, Empty, List, Modal, Popconfirm, Popover } from "antd";
import axios from "axios";
import { urlServer } from "../../utils/endpoint";
import { fiturMaping2 } from "../../utils/mappingFiturID";
import formatString from "../../utils/formatString";
import DetailDataController from "../../utils/detailDataController";
import { formatDate } from "../../utils/formatDate";

function Home() {
  UseSessionCheck();
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const dataUser = userSession?.dataUser;
  const [rolesUser, setRolesUser] = useState([]);
  const navigate = useNavigate();
  const [isNotifOpen, setNotif] = useState(false);
  const handleModalNotif = () => {
    setNotif(!isNotifOpen);
  };
  const [dataNotif, setDataNotif] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const { setDetailOpen } = DetailDataController();

  // console.log(dataUser);
  // console.log(rolesUser);

  useEffect(() => {
    const transformedRole = () => {
      const transformedData = dataUser?.Role.map((data) => data.Nama.replace(/\s+/g, "")); // Menghapus semua spasi);
      const arr = multiRoleAkses(transformedData);
      const arr2 = bagiArrayAkses(arr);

      setRolesUser(arr2);
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

        setDataNotif(response.data.Notif);
        setTotalUnread(response.data.TotalUnRead);
      } catch (error) {
        // console.log(error);
      }
    };

    transformedRole();
    fetchNotif();
  }, []);

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
    }
  };

  const handleNotifOpen = async (id, fiturId, tipe) => {
    const url = formatString(fiturMaping2[fiturId]);
    const body = {
      Id: id,
      Tipe: tipe,
    };
    const headers = {
      headers: {
        authorization: userSession?.AuthKey,
      },
    };

    try {
      await axios.patch(`${urlServer}/notif`, body, headers);
      // console.log(response);
      setDetailOpen(fiturMaping2[fiturId], id);
      navigate(`/${url}`);
    } catch (error) {
      // console.log(error);
    }
  };
  return (
    <>
      <div className="container-home d-flex w-100 h-100 flex-column">
        <div className="header bg-theme shadow p-3 ps-5 pe-5 d-flex w-100 justify-content-between align-items-center">
          <h5 className="text-light fw-medium" style={{ fontSize: "15px" }}>
            Selamat Datang, {dataUser?.Nama}
          </h5>
          <Badge count={totalUnread}>
            <Avatar
              onClick={handleModalNotif}
              style={{ cursor: "pointer" }}
              shape="circle"
              size={"large"}
              className="bg-theme2"
              icon={<FontAwesomeIcon size="xs" icon={faBell} color="#024332" />}
            />
          </Badge>
        </div>

        <div className="container container-home-v3 d-flex mt-5 gap-4 align-items-center flex-column h-100 ps-3 pe-3">
          <div className="w-100">
            <List
              size="small"
              className="list-role text-light position-absolute"
              style={{ top: 100, left: 50 }}
              header={<div>Peran Anda saat ini sebagai :</div>}
              bordered
              dataSource={dataUser?.Role}
              renderItem={(item, i) => (
                <>
                  <Popover
                    placement="right"
                    title={<span>Fitur yang dimiliki:</span>}
                    content={contentInfoRole(item.Nama)}
                  >
                    <List.Item style={{ cursor: "help" }} className="text-light ms-3">
                      <p>
                        {i + 1 + ". "} ({item.Nama})
                      </p>
                    </List.Item>
                  </Popover>
                </>
              )}
            />
          </div>
          <div
            className="container-menu-v3 d-flex flex-column align-items-center gap-3"
            style={{ marginTop: "10rem" }}
          >
            {rolesUser.map((arrAkses, i) => (
              <div key={i} className={`gap-3 d-flex`}>
                {arrAkses.map((akses, j) => (
                  <div
                    key={j}
                    className="menu-v3 bg-theme-subtle d-flex shadow rounded flex-column justify-content-center align-items-center p-5"
                    style={{ cursor: "pointer", height: "10rem" }}
                    onClick={() => {
                      navigate(akses.key);
                    }}
                  >
                    {/* <FontAwesomeIcon icon={akses.icon} size="2xl" /> */}
                    <img
                      className="text-light"
                      width={35}
                      height={35}
                      src={akses.icon}
                      alt={`img-icon-${j}`}
                    />
                    <p className="text-hexagon text-center fw-medium">{akses.label}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
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
            onClick={() => navigate("/logout")}
          >
            <FontAwesomeIcon size="sm" icon={faArrowRightFromBracket} color="#FFFFFF" />
          </div>
        </div>
      </div>

      <Modal title="Notifikasi" open={isNotifOpen} onCancel={handleModalNotif} footer={false}>
        {dataNotif && dataNotif.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {dataNotif.map((notif, i) => (
              <Popconfirm
                key={i}
                icon={false}
                title="Lihat Notifikasi?"
                description={notif.IsRead ? "" : "Lihat untuk tandai notif menjadi dibaca"}
                onConfirm={() => handleNotifOpen(notif.Id, notif.FiturID, notif.Tipe)}
                okText="Lihat"
                cancelText="Tutup"
              >
                <div
                  className={`${!notif.IsRead ? "btn-theme2" : "btn-white border"} p-3 rounded`}
                  style={{ cursor: "pointer" }}
                  // onClick={() => handleNotifOpen(notif.Id, notif.FiturID, notif.Tipe)}
                >
                  <div className="d-flex justify-content-between">
                    <p className="fw-semibold">{fiturMaping2[notif.FiturID]}</p>
                    <p>{formatDate(notif.TglDibuat)}</p>
                  </div>
                  {notif.Judul}
                </div>
              </Popconfirm>
            ))}
          </div>
        ) : (
          <Empty description="Tidak ada notifikasi terbaru" />
        )}
      </Modal>
    </>
  );
}

export default Home;
