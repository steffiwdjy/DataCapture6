import { create } from "zustand";

const toogleModal = create((set) => ({
    isModalOpen: false,
    setIsModalOpen: (curr) => set({ isModalOpen: curr }),
}));

export default toogleModal;
