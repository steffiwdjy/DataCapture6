import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

// eslint-disable-next-line react/prop-types
function SelectComp({ value, handleChange }) {
  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 250 }} size="small" className="select-filter">
        <InputLabel id="demo-simple-select-autowidth-label">Sort: Berdasarkan</InputLabel>
        <Select
          labelId="demo-simple-select-autowidth-label"
          id="demo-simple-select-autowidth"
          value={value}
          onChange={handleChange}
          autoWidth
          label="Sort: Berdasarkan"
          MenuProps={{
            sx: {
              "&& .Mui-selected": {
                background: "#39905237",
              },
            },
          }}
        >
          <MenuItem value="">
            <em>Tidak ada</em>
          </MenuItem>
          <MenuItem value={"Judul"}>Judul</MenuItem>
          <MenuItem value={"DibuatOleh"}>Dibuat oleh</MenuItem>
          <MenuItem value={"TglDibuat"}>Tanggal dibuat</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}

export default SelectComp;
