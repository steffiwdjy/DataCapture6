import { useEffect, useRef, useState } from "react";
import { DateRangePicker } from "react-date-range";
import format from "date-fns/format";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// eslint-disable-next-line react/prop-types
const ChooseDate = ({ range, setRange }) => {
    // Date state for one year range
    // const [range, setRange] = useState([
    //   {
    //     startDate: addYears(new Date(), -1), // One year ago from today
    //     endDate: new Date(), // Today's date
    //     key: "selection",
    //   },
    // ]);

    // Open close state
    const [open, setOpen] = useState(false);

    // Reference to the calendar wrapper
    const refOne = useRef(null);
    const inputRef = useRef(null); // Reference for the input

    useEffect(() => {
        // Event listeners for escape key and outside click
        document.addEventListener("keydown", hideOnEscape, true);
        document.addEventListener("click", hideOnClickOutside, true);

        // Clean up event listeners on unmount
        return () => {
            document.removeEventListener("keydown", hideOnEscape, true);
            document.removeEventListener("click", hideOnClickOutside, true);
        };
    }, []);

    const [direction, setDirection] = useState("horizontal"); // Default to horizontal

    // Check window size and adjust layout direction
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setDirection("vertical"); // Use vertical layout for mobile
            } else {
                setDirection("horizontal"); // Use horizontal layout for larger screens
            }
        };

        window.addEventListener("resize", handleResize);

        // Initial check on component mount
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Hide calendar on ESC press
    const hideOnEscape = (e) => {
        if (e.key === "Escape") {
            setOpen(false);
        }
    };

    // Hide calendar on outside click
    const hideOnClickOutside = (e) => {
        if (
            refOne.current &&
            !refOne.current.contains(e.target) &&
            !inputRef.current.contains(e.target) // Ensure input click doesn't close calendar
        ) {
            setOpen(false);
        }
    };

    const [isHover, setHover] = useState(false);

    return (
        <div className="d-flex flex-column gap-3 justify-content-center">
            <div className="calendarWrap">
                <label htmlFor="dateRange"></label>
                <input
                    id="dateRange"
                    ref={inputRef} // Set the reference to the input
                    value={`${format(range[0]?.startDate, "d MMM yyyy")} - ${format(
                        range[0]?.endDate,
                        "d MMM yyyy"
                    )}`}
                    readOnly
                    className="input-dateRangePicker inputBox rounded p-2"
                    onClick={() => setOpen(!open)}
                    style={{
                        width: "15rem",
                        cursor: "pointer",
                        border: isHover ? "1px solid #399051" : "1px solid #E0E0E0",
                        color: "#344767",
                        transition: "0.5s",
                    }}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                />

                <div
                    className="position-absolute shadow rounded"
                    style={{ zIndex: "999", right: 25 }}
                    ref={refOne} // Set the reference to the calendar wrapper
                >
                    {open && (
                        <DateRangePicker
                            maxDate={new Date()}
                            onChange={(item) => setRange([item.selection])}
                            editableDateInputs={true}
                            moveRangeOnFirstSelection={false}
                            ranges={range}
                            months={2}
                            direction={direction}
                            className="calendarElement"
                            rangeColors={["#399051", "#0a7e66"]}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChooseDate;
