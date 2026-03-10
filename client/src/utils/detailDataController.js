import { create } from "zustand";

const DetailDataController = create((set) => ({
  isDetailOpen: null,
  oneDataID: null,
  setDetailOpen: (currDetailOpen, currDataID) =>
    set({ isDetailOpen: currDetailOpen, oneDataID: currDataID }),
}));

export default DetailDataController;
