const axios = require("axios");
const tokenAPI = "8dceb2f4-0df1-4d77-87bb-00a87b35b9aa";
const templateOtpUUID = "a614fd97-9280-40b7-a850-ba2be55e4b15";
const templateNotifUUID = "b7f019fd-1d5e-43e5-98ba-831ef18b9824";
const chatBotUUID = "75beaafa-d688-44f1-b904-c73ab7c40ccc";
async function sendOtpToWa(nama, noTelp, otp) {
    const body = {
        company_uuid: tokenAPI,
        contacts: [
            {
                user_name: nama,
                number: noTelp,
                variabel: {
                    "{{1}}": `(otp)${otp}`,
                },
            },
        ],
        template_uuid: templateOtpUUID,
        chat_bot_uuid: chatBotUUID,
    };
    try {
        await axios.post("https://api.barantum.com/api/v1/send-message-template-custom", body);
        // console.log(`OTP sent to ${noTelp}`);
    } catch (error) {
        // console.error("Error sending OTP:", error);
        throw new Error("Could not send OTP. Please try again.");
    }
}

async function sendNotifToWa(dataUser, tipeInfo) {
    const body = {
        company_uuid: tokenAPI,
        contacts: dataUser.map((user) => ({
            user_name: user.Nama,
            number: user.NoTelp,
            variabel: {
                "{{1}}": `${tipeInfo}`,
                "{{2}}": `${user.Nama}`,
            },
        })),
        template_uuid: templateNotifUUID,
        chat_bot_uuid: chatBotUUID,
    };
    try {
        const response = await axios.post(
            "https://api.barantum.com/api/v1/send-message-template-custom",
            body
        );
        // console.log(`Notif sent to ${dataUser}`);
        // console.log(response);
    } catch (error) {
        // console.error("Error sending Notif:", error);
        throw new Error("Could not send Notif. Please try again.");
    }
}

module.exports = { sendOtpToWa, sendNotifToWa };
