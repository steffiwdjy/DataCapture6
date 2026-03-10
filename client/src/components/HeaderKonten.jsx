import Line from "../components/Line";
import { Button, Input } from "antd";
import { MenuUnfoldOutlined, SearchOutlined } from "@ant-design/icons";
import toogleSidebarMobile from "../utils/toogleSidebarMobile";
// eslint-disable-next-line react/prop-types
function HeaderKonten({ judul, isInsert, nameInsert, setInsertBtn, searchValue, onChangeSearch }) {
  const { isSidebarMobileOpen, setIsSidebarMobileOpen } = toogleSidebarMobile();
  const toggleisSidebarMobileOpen = () => {
    setIsSidebarMobileOpen(isSidebarMobileOpen);
  };
  return (
    <div className="container-header-content d-flex flex-column w-100">
      <div className="header-content w-100 d-flex justify-content-between align-items-center p-4 bg-light">
        <Button
          className="btn-sidebar-mobile d-none"
          type="primary"
          onClick={toggleisSidebarMobileOpen}
        >
          {isSidebarMobileOpen ? <MenuUnfoldOutlined /> : <MenuUnfoldOutlined />}
        </Button>
        <h5>{judul}</h5>
        <div className={`header-item d-flex gap-3 ${isInsert ? "w-50" : "w-25"}`}>
          <Input
            className="header-item search-input"
            placeholder="Cari.."
            value={searchValue}
            onChange={onChangeSearch}
            prefix={<SearchOutlined />}
          />
          {isInsert && (
            <Button
              className="header-item btn-insert"
              type="primary"
              onClick={() => setInsertBtn(true)}
            >
              {nameInsert}
            </Button>
          )}
        </div>
      </div>
      <Line bgColour={"#ACACAC"} width={100} />
    </div>
  );
}

export default HeaderKonten;
