import { PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Input, Menu, Modal, Result } from "antd";
import { threelogo } from "../../../public/assets/images";
import { useEffect, useState } from "react";
import { inputValidator } from "../../utils/inputValidator";
import useValidator from "../../constaints/FormValidation";
import axios from "axios";
import { urlClient, urlServer } from "../../utils/endpoint";
// import { useNavigate } from "react-router-dom";
import UseSessionCheck from "../../utils/useSessionCheck";
import formatTime from "../../utils/formatTime";

function Login() {
    UseSessionCheck();
    // const navigate = useNavigate();
    const [dataLogin, setDataLogin] = useState({});
    const { ValidationStatus, setValidationStatus, setCloseAlert } = useValidator();
    // const [noTelp, setNoTelp] = useState("");
    const [otp, setOtp] = useState({ Otp: "" });
    const [tipeLogin, setTipeLogin] = useState("email");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [isActiveStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false); // Tambahkan state loading
    // Countdown timer logic
    useEffect(() => {
        let timer;
        if (isActiveStep === 2 && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timer);
            // Handle when the time runs out, e.g., show alert or allow OTP resend
            // console.log("Time's up! Resend OTP or show alert.");
        }

        return () => clearInterval(timer); // Cleanup on component unmount
    }, [timeLeft, isActiveStep]);

    const menuLogin = [
        {
            label: "Email",
            key: "email",
        },
        {
            label: "No Telepon",
            key: "noTelp",
        },
    ];
    const handleChangeDataLogin = (e) => {
        const { value: inputValue } = e.target;

        if (tipeLogin === "noTelp") {
            //jika tipe login no telp
            const reg = /^-?\d*(\.\d*)?$/; // Validasi untuk input angka (noTelp)
            if (reg.test(inputValue) || inputValue === "" || inputValue === "-") {
                setDataLogin({
                    User: { NoTelp: inputValue }, // Hanya menyimpan noTelp
                });
            }
        } else if (tipeLogin === "email") {
            //jika tipe login email
            setDataLogin({
                User: { Email: inputValue }, // Hanya menyimpan Email
            });
        }
    };

    const handleChangeMenuLogin = (value) => {
        setDataLogin({});
        setTipeLogin(value);
    };

    // console.log(dataLogin);

    const handleChangeOtp = (inputValue) => {
        setOtp((prevData) => ({ ...prevData, Otp: inputValue }));
    };

    const listOfStep = [
        {
            judul: "Insert noTelp",
            urut: 1,
        },
        {
            judul: "Insert otp",
            urut: 2,
        },
    ];

    const formStepDisplay = () => {
        if (isActiveStep === 1) {
            return (
                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: "#b6b6b6",
                        },
                    }}
                >
                    <Input
                        size="large"
                        className="bg-transparent text-light"
                        placeholder={`${tipeLogin === "email" ? "email" : "no telepon"}`}
                        prefix={tipeLogin === "email" ? <UserOutlined /> : <PhoneOutlined />}
                        onChange={(e) => handleChangeDataLogin(e)}
                        value={
                            tipeLogin === "email" ? dataLogin.User?.Email : dataLogin.User?.NoTelp
                        }
                    />
                </ConfigProvider>
            );
        } else if (isActiveStep === 2) {
            return (
                <>
                    <div className="d-flex flex-column justify-content-center">
                        <p className="text-light" style={{ fontSize: "0.9rem" }}>
                            Masukan kode yang dikirimkan melalui{" "}
                            {tipeLogin === "email" ? "Email " : "Whattsap "}
                            anda
                        </p>
                        <p className="text-light" style={{ fontSize: "0.8rem" }}>
                            Waktu anda untuk memasukan kode {formatTime.formatTime1(timeLeft)}
                        </p>
                    </div>
                    <Input.OTP
                        inputMode="numeric"
                        length={6}
                        size="large"
                        className="bg-transparent"
                        onChange={(e) => handleChangeOtp(e)}
                        value={otp.Otp}
                    />
                </>
            );
        }
    };

    const login = async (currIsActive) => {
        setLoading(true); // Set loading ke true saat login dijalankan
        try {
            if (currIsActive === 1) {
                const validateFunction = inputValidator["Login"];
                validateFunction(dataLogin);
                const response = await axios.post(`${urlServer}/login`, dataLogin);
                const responseData = response.data.data.User;

                setOtp((prevData) => ({
                    ...prevData,
                    Email: responseData.Email,
                    NoTelp: responseData.NoTelp,
                }));
                // console.log(response);

                setActiveStep(isActiveStep + 1);
                setLoading(false);
            }

            if (currIsActive === 2) {
                const response = await axios.post(`${urlServer}/login/verify-otp`, otp);
                // console.log(response);

                const authorizationHeader = response.headers["authorization"];
                const userSession = {
                    AuthKey: authorizationHeader.replace("Bearer ", ""),
                    dataUser: response.data.data,
                };
                if (userSession.AuthKey !== "") {
                    // sessionStorage.setItem("userSession", JSON.stringify(userSession));
                    // Simpan userSession di localStorage
                    localStorage.setItem("userSession", JSON.stringify(userSession));
                }
                window.location.href = `${urlClient}/`; //enggunakan window.location.href karena agar me reload halaman tujuan;
                // console.log(response);
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            if (error?.response?.data?.error) {
                setValidationStatus(error.path, error.response.data.error);
            } else {
                setValidationStatus(error.path, error.message);
            }
        }
    };

    // console.log(otp);

    return (
        <div className="container-login d-flex w-100 h-100 flex-column p-4 position-fixed">
            {ValidationStatus && (
                <Modal
                    open={ValidationStatus}
                    onCancel={setCloseAlert}
                    footer={null}
                    centered={true}
                >
                    <Result
                        status="error"
                        title={
                            ValidationStatus.Message === `"User" is required`
                                ? "Isi email / no telepon terlebih dahulu"
                                : ValidationStatus.Message
                        }
                    />
                </Modal>
            )}
            <div
                className="container-form-login container d-flex justify-content-center align-items-center flex-column h-100 w-25 gap-5"
                style={{ zIndex: "99" }}
            >
                <h5 className="text-light text-uppercase fw-semibold">Login Member</h5>
                {isActiveStep === 1 && (
                    <ConfigProvider
                        theme={{
                            components: { Menu: { itemColor: "white", itemHoverColor: "#399051" } },
                        }}
                    >
                        <Menu
                            onClick={(e) => handleChangeMenuLogin(e.key)}
                            selectedKeys={[tipeLogin]}
                            mode="horizontal"
                            items={menuLogin}
                            className="d-flex w-100 justify-content-start"
                            style={{ backgroundColor: "transparent" }}
                        />
                    </ConfigProvider>
                )}
                {listOfStep.map((step) => (
                    <div key={step.urut}>{isActiveStep === step.urut && formStepDisplay()}</div>
                ))}
                <div className="d-flex w-100 gap-2 flex-column">
                    <Button
                        type="primary"
                        loading={loading}
                        className="w-100"
                        size="large"
                        onClick={() => login(isActiveStep)}
                    >
                        Selanjutnya
                    </Button>
                    <Button
                        className="w-100 bg-transparent text-light"
                        size="large"
                        onClick={() => (window.location.href = "https://www.thejarrdin.com")}
                    >
                        Kembali
                    </Button>
                </div>
            </div>

            <div
                className="footer container d-flex w-100 justify-content-center"
                style={{ zIndex: 99 }}
            >
                <img
                    className="img-threeLogo"
                    src={threelogo}
                    alt="3 logo"
                    style={{ width: "350px", height: "75px" }}
                />
            </div>
        </div>
    );
}

export default Login;
