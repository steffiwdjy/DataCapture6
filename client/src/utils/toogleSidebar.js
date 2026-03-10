import { create } from "zustand";

const toogleSidebar = create((set) => ({
  isSidebarOpen: true,
  setIsSidebarOpen: (curr) => set({ isSidebarOpen: !curr }),
}));

export default toogleSidebar;
