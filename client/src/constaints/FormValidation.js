import { create } from "zustand";

const useValidator = create((set) => ({
  ValidationStatus: null,

  setValidationStatus: (Path, Message) => {
    set({ ValidationStatus: { Path: Path, Message: Message } });
  },

  setCloseAlert: () => {
    set({ ValidationStatus: null });
  },
}));

export default useValidator;
