import { faBell } from "@fortawesome/free-regular-svg-icons";
import { multiRoleAkses, bagiArrayAkses } from "../../models/menuRoleAkses";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons/faArrowRightFromBracket";
import { threelogo } from "../../../public/assets/images/index";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import UseSessionCheck from "../../utils/useSessionCheck";
import { Avatar, Badge, List, Popover } from "antd";

function Home() {
  UseSessionCheck();
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const dataUser = userSession?.dataUser;
  const [rolesUser, setRolesUser] = useState([]);
  const navigate = useNavigate();

  // console.log(dataUser);
  // console.log(rolesUser);

  useEffect(() => {
    const transformedRole = () => {
      const transformedData = dataUser?.Role.map((data) => data.Nama.replace(/\s+/g, "")); // Menghapus semua spasi);
      const arr = multiRoleAkses(transformedData);
      const arr2 = bagiArrayAkses(arr);

      setRolesUser(arr2);
    };

    transformedRole();
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
  return (
    <>
      <div className="container-home d-flex w-100 h-100 flex-column p-4">
        <div className="header container d-flex w-100 justify-content-between align-items-start">
          <div className="d-flex flex-column gap-3">
            <h5 className="text-light fw-medium">Selamat Datang, {dataUser?.Nama}</h5>
            <List
              size="small"
              className="list-role text-light"
              header={<div>Peran Anda saat ini sebagai :</div>}
              bordered
              dataSource={dataUser?.Role}
              renderItem={(item) => (
                <>
                  <Popover
                    placement="right"
                    title={<span>Fitur yang dimiliki:</span>}
                    content={contentInfoRole(item.Nama)}
                  >
                    <List.Item style={{ cursor: "help" }} className="text-light ms-3">
                      <p>({item.Nama})</p>
                    </List.Item>
                  </Popover>
                </>
              )}
            />
          </div>
          <Badge count={0}>
            <Avatar
              style={{ cursor: "pointer" }}
              shape="circle"
              size={"large"}
              className="bg-theme2"
              icon={<FontAwesomeIcon size="sm" icon={faBell} color="#024332" />}
            />
          </Badge>
        </div>

        <div className="container d-flex justify-content-center align-items-center flex-column flex-wrap h-100">
          {rolesUser.map((arrAkses, i) => (
            <div
              key={i}
              className={`hexagonArea d-flex ${i === 0 ? "first" : "last"} ${
                arrAkses.length % 2 === 0 && i !== 0 ? "genap" : ""
              }`}
            >
              {arrAkses.map((akses, j) => (
                <div
                  key={j}
                  className="hexagon p-2 shadow shadow-lg"
                  onClick={() => {
                    navigate(akses.key);
                  }}
                >
                  {/* <FontAwesomeIcon icon={akses.icon} size="2xl" /> */}
                  <img
                    className="icon-hexagon"
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
        <div className="footer container d-flex w-100 justify-content-between align-items-center">
          <img
            className="img-threeLogo"
            src={threelogo}
            alt="3 logo"
            style={{ width: "250px", height: "50px" }}
          />
          <div
            className="d-flex btn-home-logout justify-content-center align-items-center rounded-circle border border-2"
            style={{ height: "45px", width: "45px", cursor: "pointer" }}
            onClick={() => navigate("/logout")}
          >
            <FontAwesomeIcon size="sm" icon={faArrowRightFromBracket} color="#FFFFFF" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
