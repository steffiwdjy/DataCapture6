/* eslint-disable react/prop-types */
import { Button, Input } from "antd";
import ChooseDate from "./ChooseDate";
import { SearchOutlined } from "@ant-design/icons";
// import SelectComp from "./SelectComp";

function FilterTable({
    isInsert,
    nameInsert,
    setInsertBtn,
    range,
    setRange,
    searchValue,
    onChangeSearch,
    isDateExists,
}) {
    return (
        <div className="filter-content w-100 d-flex justify-content-end p-4 gap-3">
            {/* <SelectComp value={currSort} handleChange={handleSort} /> */}
            <Input
                className="filter-item search-input d-none"
                placeholder="Cari.."
                value={searchValue}
                onChange={onChangeSearch}
                prefix={<SearchOutlined />}
            />
            {isDateExists && <ChooseDate range={range} setRange={setRange} />}

            {isInsert && (
                <Button
                    className="filter-item btn-insert d-none"
                    type="primary"
                    onClick={() => setInsertBtn(true)}
                >
                    {nameInsert}
                </Button>
            )}
        </div>
    );
}

export default FilterTable;
