import { create } from "zustand";
const userSession = JSON.parse(localStorage.getItem("userSession"));
// console.log(userSession);

const dataUser = userSession?.dataUser;

const HakAkses = create(() => ({
    hasPengurus: dataUser?.Role.some((role) => role.Nama === "Pengurus"),
    hasPengelola: dataUser?.Role.some((role) => role.Nama === "Pengelola"),
    hasPemilikUnit: dataUser?.Role.some((role) => role.Nama === "Pemilik Unit"),
    hasPelakuKomersil: dataUser?.Role.some((role) => role.Nama === "Pelaku Komersil"),
    hasAdmin: dataUser?.Role.some((role) => role.Nama === "Admin"),
}));

export default HakAkses;
