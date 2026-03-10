export const mapMultiRoleSelect = (currentUnits, previousUnits, idField) => {
    const prevUnitsMap = new Map(previousUnits.map((unit) => [unit[idField], unit]));
    const newUnitsMap = new Map(currentUnits.map((unit) => [unit[idField], unit]));
    console.log(previousUnits, "prev");
    console.log(currentUnits, "curr");

    // Tambahkan unit baru dengan aksi "CREATE"
    const unitsWithActions = currentUnits
        .map((unit) => {
            if (!unit[idField] || !prevUnitsMap.has(unit[idField])) {
                return { ...unit, Action: "CREATE" };
            }
            return null;
        })
        .filter(Boolean); // Hapus nilai null atau undefined

    // Tambahkan unit yang dihapus dengan aksi "DELETE"
    const deletedUnits = previousUnits
        .filter((prevUnit) => !newUnitsMap.has(prevUnit[idField]))
        .map((unit) => ({ ...unit, Action: "DELETE" }));

    // Jika tidak ada perubahan, kembalikan array kosong
    if (unitsWithActions.length === 0 && deletedUnits.length === 0) {
        return [];
    }

    // Jika semua role sebelumnya ada tapi sekarang kosong, berarti semua role dihapus
    const allDeleted = currentUnits.length === 0 && previousUnits.length > 0;
    if (allDeleted) {
        return null;
    }

    return [...unitsWithActions, ...deletedUnits];
};
