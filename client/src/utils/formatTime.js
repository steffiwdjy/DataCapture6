const formatTime1 = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${
        remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
};

const formatTime2 = (isoString) => {
    const date = new Date(isoString);

    // Ambil jam dan menit lokal
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Format jam:menit
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${formattedHours}:${formattedMinutes}`;
};

export default { formatTime1, formatTime2 };
