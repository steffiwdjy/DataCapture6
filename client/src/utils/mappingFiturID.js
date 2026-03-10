const fiturMaping = {
    "Tambah Data Pengumuman": 1,
    "Tambah Data Pengumuman Pengelola": 2,
    // "Tambah Data Pengumuman Usaha": 3,
    "Tambah Data Laporan": 3,
    "Tambah Data Tagihan Bulanan": 4,
    // "Unggah Kwitansi Tagihan": 5,
    "Tambah Data Buletin Kegiatan": 5,
    "Tambah Data Informasi Paket": 6,
    "Tambah Data Masukan & Aspirasi": 7,
    "Tambah Data Pengguna": 8,
};

const tujuanMapingByFitur = {
    "Tambah Data Pengumuman": [
        { value: 1, label: "Pengurus" },
        { value: 2, label: "Pengelola" },
        { value: 3, label: "Pemilik Unit" },
        { value: 4, label: "Pelaku Komersil" },
    ],
    "Tambah Data Pengumuman Pengelola": [
        { value: 1, label: "Pengurus" },
        { value: 2, label: "Pengelola" },
        { value: 3, label: "Pemilik Unit" },
        { value: 4, label: "Pelaku Komersil" },
    ],
    "Tambah Data Laporan": [{ value: 3, label: "Pemilik Unit" }],
    "Tambah Data Tagihan Bulanan": [
        { value: 3, label: "Pemilik Unit" },
        { value: 4, label: "Pelaku Komersil" },
    ],
    "Tambah Data Buletin Kegiatan": [
        { value: 3, label: "Pemilik Unit" },
        { value: 4, label: "Pelaku Komersil" },
    ],
    "Tambah Data Informasi Paket": [{ value: 3, label: "Pemilik Unit" }],
};

const fiturMaping2 = {
    1: "Pengumuman",
    2: "Pengumuman Pengelola",
    // 3: "Pengumuman Usaha",
    3: "Laporan",
    4: "Tagihan Bulanan",
    5: "Buletin Kegiatan",
    6: "Informasi Paket",
    7: "Masukan & Aspirasi",
    8: "Daftar Pengguna",
};

export { fiturMaping, fiturMaping2, tujuanMapingByFitur };
