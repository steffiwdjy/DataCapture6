import { useEffect, useMemo, useState } from "react";
import GlobalLayout from "../../components/Layout/GlobalLayout";
import MainContent from "../../components/Layout/MainContent";
import HeaderKonten from "../../components/HeaderKonten";
import DataFiturLayout from "../../components/Layout/DataFiturLayout";
import { addDays, addYears } from "date-fns";
import DetailDataController from "../../utils/detailDataController";
import HakAkses from "../../utils/hakAkses";
import toogleSidebarMobile from "../../utils/toogleSidebarMobile";
import ModalInsert from "../../components/ModalInsert";
import ModalDetail from "../../components/ModalDetail";
import SidebarMobile from "../../components/SidebarMobile";
import axios from "axios";
import { urlServer } from "../../utils/endpoint";
import { Fitur } from "../../models/FiturModel";
import { formatDate } from "../../utils/formatDate";
import ModalInsertAspirasi from "../../components/ModalInsertAspirasi";
import ModalDetailAspirasi from "../../components/ModalDetailAspirasi";
import { columnsDaftarPengguna, columnsDataFitur } from "../../constaints/columnsTable";
import ModalDetailPengguna from "../../components/ModalDetailPengguna";
import ModalInsertPengguna from "../../components/ModalInsertPengguna";

function DataFitur({ active }) {
    // console.log(active);

    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);
    // Date state for one year range
    const [range, setRange] = useState([
        {
            startDate: addYears(new Date(), -1), // One year ago from today
            endDate: addDays(new Date(), 1), // Tomorrow's date
            key: "selection",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const { isDetailOpen, setDetailOpen } = DetailDataController();
    const { hasPengurus, hasPengelola, hasPemilikUnit, hasPelakuKomersil, hasAdmin } = HakAkses();
    const { isSidebarMobileOpen } = toogleSidebarMobile();

    const hakAksesInsert = () => {
        if (hasPengurus && (active === "Laporan" || active === "Pengumuman")) {
            return true;
        }

        if (
            hasPengelola &&
            (active === "Tagihan Bulanan" ||
                active === "Pengumuman Pengelola" ||
                active === "Informasi Paket" ||
                active === "Buletin Kegiatan")
        ) {
            return true;
        }

        if (hasPemilikUnit && active === "Masukan & Aspirasi") {
            return true;
        }

        if (hasPelakuKomersil && active === "Pengumuman") {
            return true;
        }

        if (hasAdmin && active === "Pengguna") {
            return true;
        }

        return false;
    };

    const menuInsert = [
        {
            label: "Untuk saya",
            key: "untukSaya",
        },
    ];
    const menuPengguna = [
        {
            label: "Daftar Pengguna",
            key: "daftarPengguna",
        },
    ];
    // Jika hasPengurus true, tambahkan "Data diunggah" ke dalam menu
    if (hakAksesInsert()) {
        menuInsert.push({
            label: "Data diunggah",
            key: "dataDiunggah",
        });
    }
    const [searchValue, setSearchValue] = useState("");
    const [filteredDataTable, setFilteredDataTable] = useState([]);
    const [dataTable, setDataTable] = useState([]);
    const [modalInsert, setModalInsert] = useState(false);
    const [currTipeData, setCurrTipeData] = useState(
        active === "Pengguna" ? "daftarPengguna" : "untukSaya"
    );

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
    });

    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchValue(value);
        const searchTerm = value.toLowerCase();
        const filtered = dataTable.filter(
            (item) =>
                (item.Judul && item.Judul.toLowerCase().includes(searchTerm)) ||
                (item.DibuatOleh && item?.DibuatOleh.toLowerCase().includes(searchTerm)) ||
                (item.Nama && item?.Nama.toLowerCase().includes(searchTerm)) ||
                (item.Email && item?.Email.toLowerCase().includes(searchTerm)) ||
                (item.NoTelp && item?.NoTelp.toLowerCase().includes(searchTerm))
        );
        setFilteredDataTable(filtered);
    };

    const handleTableChange = (pagination) => {
        setPagination((prev) => ({
            ...prev,
            current: pagination.current,
            pageSize: pagination.pageSize,
        }));
        // fetchData(); // Fetch data after changing pagination
    };

    axios.defaults.withCredentials = true;
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };
            try {
                // console.log(Fitur[active], "TEST");
                const urlAspirasi = `${urlServer}/aspirasi/${
                    currTipeData === "untukSaya" ? "untukUser" : "dibuatUser"
                }/${range[0].startDate.getTime()}/${range[0].endDate.getTime()}`;

                const urlDaftarPengguna = `${urlServer}/user`;

                const url = `${urlServer}/data/${Fitur[active]}/${
                    currTipeData === "untukSaya" ? "untukUser" : "dibuatUser"
                }/${range[0].startDate.getTime()}/${range[0].endDate.getTime()}`;

                const response = await axios.get(
                    active === "Masukan & Aspirasi"
                        ? urlAspirasi
                        : active === "Pengguna"
                        ? urlDaftarPengguna
                        : url,
                    headers
                );
                // console.log(response);

                const transformedData = response.data.map((data) => ({
                    ...data,
                    TglDibuat: formatDate(data.TglDibuat),
                }));
                setDataTable(transformedData);
            } catch (error) {
                // console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [active, currTipeData, range]);

    useEffect(() => {
        // Reset range and currTipeData when active changes
        setRange([
            {
                startDate: addYears(new Date(), -1), // One year ago from today
                endDate: addDays(new Date(), 1), // Tomorrow's date
                key: "selection",
            },
        ]);
        setSearchValue("");
        setCurrTipeData(active === "Pengguna" ? "daftarPengguna" : "untukSaya");
    }, [active]);

    return (
        <>
            <GlobalLayout>
                {!isSidebarMobileOpen && (
                    <>
                        <MainContent
                            header={
                                <HeaderKonten
                                    judul={`Data ${active}`}
                                    isInsert={hakAksesInsert()}
                                    nameInsert={`Tambah Data ${active}`}
                                    setInsertBtn={setModalInsert}
                                    searchValue={searchValue}
                                    onChangeSearch={handleSearch}
                                />
                            }
                            content={
                                <DataFiturLayout
                                    hakAksesInsert={hakAksesInsert()}
                                    setModalInsert={setModalInsert}
                                    range={range}
                                    setRange={setRange}
                                    searchValue={searchValue}
                                    handleSearch={handleSearch}
                                    currTipeData={currTipeData}
                                    setCurrTipeData={setCurrTipeData}
                                    menu={active === "Pengguna" ? menuPengguna : menuInsert}
                                    loading={loading}
                                    dataTable={dataTable}
                                    filteredDataTable={filteredDataTable}
                                    handleTableChange={handleTableChange}
                                    pagination={pagination}
                                    columns={
                                        active === "Pengguna"
                                            ? columnsDaftarPengguna(active, setDetailOpen)
                                            : columnsDataFitur(active, setDetailOpen, currTipeData)
                                    }
                                    isDateExists={active === "Pengguna" ? false : true}
                                    nameInsert={`Tambah Data ${active}`}
                                />
                            }
                        />
                        {modalInsert &&
                            active !== "Masukan & Aspirasi" &&
                            active !== "Pengguna" && (
                                <ModalInsert
                                    currState={modalInsert}
                                    setState={setModalInsert}
                                    judulInsert={`Tambah Data ${active}`}
                                />
                            )}
                        {modalInsert && active === "Masukan & Aspirasi" && (
                            <ModalInsertAspirasi
                                currState={modalInsert}
                                setState={setModalInsert}
                                judulInsert={`Tambah Data ${active}`}
                            />
                        )}
                        {modalInsert && active === "Pengguna" && (
                            <ModalInsertPengguna
                                currState={modalInsert}
                                setState={setModalInsert}
                                judulInsert={`Tambah Data ${active}`}
                            />
                        )}
                        {isDetailOpen &&
                            active !== "Masukan & Aspirasi" &&
                            active !== "Pengguna" && (
                                <ModalDetail
                                    judulDetail={`Detail ${active}`}
                                    tipeDetail={currTipeData}
                                />
                            )}
                        {isDetailOpen && active === "Masukan & Aspirasi" && (
                            <ModalDetailAspirasi
                                judulDetail={`Detail ${active}`}
                                tipeDetail={currTipeData}
                            />
                        )}
                        {isDetailOpen && active === "Pengguna" && (
                            <ModalDetailPengguna judulDetail={`Detail ${active}`} />
                        )}
                    </>
                )}
                {isSidebarMobileOpen && <SidebarMobile />}
            </GlobalLayout>
        </>
    );
}

export default DataFitur;
