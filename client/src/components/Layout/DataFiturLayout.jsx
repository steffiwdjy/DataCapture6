import React from "react";
import FilterTable from "../Filter/FilterTable";
import { Menu, Table } from "antd";

function DataFiturLayout({
    hakAksesInsert,
    setModalInsert,
    range,
    setRange,
    searchValue,
    handleSearch,
    currTipeData,
    setCurrTipeData,
    menu,
    loading,
    dataTable,
    filteredDataTable,
    handleTableChange,
    pagination,
    columns,
    nameInsert,
    isDateExists = true,
}) {
    return (
        <>
            <FilterTable
                isInsert={hakAksesInsert ? true : false}
                nameInsert={nameInsert}
                setInsertBtn={setModalInsert}
                range={range}
                setRange={setRange}
                searchValue={searchValue}
                onChangeSearch={handleSearch}
                isDateExists={isDateExists}
            />
            <Menu
                onClick={(e) => setCurrTipeData(e.key)}
                selectedKeys={[currTipeData]}
                mode="horizontal"
                items={menu}
                className="d-flex w-100 justify-content-start"
            />

            <div className="w-100 p-4" style={{ height: "100vh" }}>
                <Table
                    scroll={{ x: "max-content", y: 400 }}
                    loading={loading}
                    dataSource={
                        searchValue === "" || null || undefined ? dataTable : filteredDataTable
                    }
                    onChange={handleTableChange}
                    pagination={pagination}
                    columns={columns}
                />
            </div>
        </>
    );
}

export default DataFiturLayout;
