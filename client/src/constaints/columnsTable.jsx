// columns.jsx
import { CheckOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import { urlServer } from "../utils/endpoint";
import axios from "axios";
import { revertDate } from "../utils/formatDate";

const userSession = JSON.parse(localStorage.getItem("userSession"));
axios.defaults.withCredentials = true;
const updateIsRead = async (Id) => {
    const body = {
        MessageID: Id,
    };
    const headers = {
        headers: {
            authorization: userSession?.AuthKey,
        },
    };
    try {
        await axios.patch(`${urlServer}/aspirasi`, body, headers);
        window.location.reload();
    } catch (error) {
        // console.log(error);
    }
};
const columnsDataFitur = (isDetailOpen, setDetailOpen, tipeAspirasi = "") => {
    const baseColumns = [
        {
            title: "Judul",
            dataIndex: "Judul",
            key: "Judul",
            sorter: (a, b) => a.Judul.localeCompare(b.Judul),
        },
        {
            title: "Diunggah oleh",
            dataIndex: "DibuatOleh",
            key: "DibuatOleh",
            sorter: (a, b) => a.DibuatOleh.localeCompare(b.DibuatOleh),
        },
        {
            title: "Tanggal dibuat",
            dataIndex: "TglDibuat",
            key: "TglDibuat",
            sorter: (a, b) => {
                const dateA = new Date(revertDate(a.TglDibuat));
                const dateB = new Date(revertDate(b.TglDibuat));
                return dateA - dateB;
            },
        },
    ];

    // Tambahkan kolom "Status" jika
    if (isDetailOpen === "Masukan & Aspirasi" && tipeAspirasi === "untukSaya") {
        baseColumns.push({
            title: "Status",
            dataIndex: "IsRead",
            key: "IsRead",
            render: (text, record) => (
                <Button
                    key="isRead"
                    type={record.IsRead ? "primary" : ""}
                    icon={record.IsRead ? <CheckOutlined /> : false}
                    onClick={() => updateIsRead(record.Id)}
                >
                    {record.IsRead ? "Dibaca" : "Tandai untuk dibaca"}
                </Button>
            ),
        });
    }

    baseColumns.push({
        title: "Aksi",
        dataIndex: "Id",
        key: "Id",
        render: (text, record) => (
            <Button onClick={() => setDetailOpen(isDetailOpen, record.Id)}>Lihat detail</Button>
        ),
    });

    return baseColumns;
};

const columnsDaftarPengguna = (isDetailOpen, setDetailOpen) => [
    {
        title: "Nama",
        dataIndex: "Nama",
        key: "Nama",
        sorter: (a, b) => a.Nama.localeCompare(b.Nama),
    },
    {
        title: "Email",
        dataIndex: "Email",
        key: "Email",
        sorter: (a, b) => a.Email.localeCompare(b.Email),
    },
    {
        title: "No Telepon",
        dataIndex: "NoTelp",
        key: "NoTelp",
    },
    {
        title: "Status",
        dataIndex: "Status",
        key: "Status",
        sorter: (a, b) => a.Status.localeCompare(b.Status),
        render: (text, record) => (
            <Tag
                color={
                    record.Status === "Active"
                        ? "success"
                        : record.Status === "RevokeAgreement"
                        ? "warning"
                        : record.Status === "Unactive"
                        ? "error"
                        : "default"
                }
            >
                {record.Status === "Active"
                    ? "Aktif"
                    : record.Status === "RevokeAgreement"
                    ? "Izin dinonaktifkan"
                    : record.Status === "Unactive"
                    ? "Tidak aktif"
                    : "Tidak terdefinisi"}
            </Tag>
        ),
    },
    {
        title: "Aksi",
        dataIndex: "UserID",
        key: "UserID",
        render: (text, record) => (
            <Button onClick={() => setDetailOpen(isDetailOpen, record.UserID)}>Lihat detail</Button>
        ),
    },
];

export { columnsDataFitur, columnsDaftarPengguna };
