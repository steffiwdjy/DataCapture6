import { create } from "zustand";

const toogleSidebarMobile = create((set) => ({
  isSidebarMobileOpen: false,
  setIsSidebarMobileOpen: (curr) => set({ isSidebarMobileOpen: !curr }),
}));

export default toogleSidebarMobile;
