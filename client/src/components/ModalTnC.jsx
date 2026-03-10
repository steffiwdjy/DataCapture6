import React, { useRef, useState, useEffect, useMemo } from "react";
import { Button, Divider, Modal, Typography } from "antd";
import axios from "axios";
import { urlServer } from "../utils/endpoint";

const { Title, Paragraph } = Typography;

function ModalTnC() {
    const userSession = useMemo(() => {
        return JSON.parse(localStorage.getItem("userSession"));
    }, []);

    const contentRef = useRef(null);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

    const handleScroll = () => {
        const el = contentRef.current;
        if (el) {
            const isBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
            setIsScrolledToBottom(isBottom);
        }
    };

    useEffect(() => {
        const el = contentRef.current;
        if (el) {
            el.addEventListener("scroll", handleScroll);
            return () => el.removeEventListener("scroll", handleScroll);
        }
    }, []);

    axios.defaults.withCredentials = true;
    const onAgree = async () => {
        try {
            const headers = {
                headers: {
                    authorization: userSession?.AuthKey,
                },
            };

            const formattedFormData = {
                User: {
                    UserID: userSession?.dataUser.UserID,
                    IsKetentuan: true,
                },
                Mode: {
                    Nama: "updateKetentuan",
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
                    },
                };

                // Simpan kembali ke localStorage
                localStorage.setItem("userSession", JSON.stringify(updatedSession));

                // Reload atau tutup modal jika perlu
                window.location.reload(); // atau props.onClose() kalau kamu ingin tutup modal saja
            }
        } catch (error) {
            console.error("Gagal memperbarui IsKetentuan", error);
        }
    };

    return (
        <Modal
            open={true}
            onCancel={false}
            closable={false}
            centered
            footer={
                <Button
                    type="primary"
                    className="w-100"
                    disabled={!isScrolledToBottom}
                    onClick={onAgree}
                >
                    Saya Setuju
                </Button>
            }
        >
            <div
                ref={contentRef}
                className="d-flex flex-column overflow-auto"
                style={{ height: "30rem" }}
            >
                <Title level={2}>Syarat dan Ketentuan Penggunaan</Title>
                <Paragraph type="secondary">Terakhir diperbarui: 15 Mei 2025</Paragraph>

                <Paragraph>
                    Dengan mengakses atau menggunakan situs{" "}
                    <strong>Member The Jarrdin Cihampelas</strong>, Anda menyetujui pengumpulan,
                    pemrosesan, dan penyimpanan data pribadi sesuai dengan
                    <strong>
                        {" "}
                        Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)
                    </strong>
                    .
                </Paragraph>

                <Divider />

                <Title level={4}>1. Pengumpulan dan Penggunaan Data</Title>
                <Paragraph>
                    Kami mengumpulkan data pribadi secara sah, terbatas, dan transparan untuk
                    keperluan operasional layanan, termasuk nama, email, nomor telepon, alamat, dan
                    informasi unit. Data tidak akan diproses di luar tujuan yang telah disampaikan.
                </Paragraph>

                <Title level={4}>2. Hak Pengguna</Title>
                <Paragraph>
                    Anda memiliki hak untuk:
                    <ul>
                        <li>Mendapat informasi terkait data Anda yang kami simpan.</li>
                        <li>Mengakses, memperbarui, atau menghapus data pribadi Anda.</li>
                        <li>Menarik kembali persetujuan atas pengolahan data kapan saja.</li>
                    </ul>
                </Paragraph>

                <Title level={4}>3. Keamanan dan Kerahasiaan</Title>
                <Paragraph>
                    Kami menggunakan langkah teknis dan administratif yang wajar untuk menjaga
                    keamanan dan kerahasiaan data pribadi Anda dari akses ilegal atau
                    penyalahgunaan.
                </Paragraph>

                <Title level={4}>4. Pembagian ke Pihak Ketiga</Title>
                <Paragraph>
                    Data Anda tidak akan dibagikan ke pihak ketiga tanpa persetujuan Anda, kecuali
                    untuk memenuhi kewajiban hukum atau kontrak layanan tertentu.
                </Paragraph>

                <Title level={4}>5. Persetujuan</Title>
                <Paragraph>
                    Dengan menyetujui Syarat dan Ketentuan ini, Anda memberikan persetujuan
                    eksplisit atas pengumpulan dan pemrosesan data pribadi Anda sesuai UU PDP.
                </Paragraph>

                <Title level={4}>6. Perubahan Syarat</Title>
                <Paragraph>
                    Kami dapat memperbarui ketentuan ini sewaktu-waktu. Kami akan memberi tahu Anda
                    jika ada perubahan signifikan.
                </Paragraph>

                <Title level={4}>7. Kontak</Title>
                <Paragraph>
                    Untuk permintaan atau pertanyaan terkait data pribadi Anda, silakan hubungi kami
                    melalui email:{" "}
                    <a href="mailto:thejarrdinbdg@gmail.com">thejarrdinbdg@gmail.com</a>
                </Paragraph>
            </div>
        </Modal>
    );
}

export default ModalTnC;
