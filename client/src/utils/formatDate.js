const formatDate = (dateString, isWaktu = false, isEpoch = false) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  let date;
  if (dateString != undefined || dateString != null) {
    if (isEpoch) {
      date = typeof dateString === "number" ? new Date(dateString) : new Date(dateString);
    } else {
      date = new Date(dateString);
    }

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    if (isWaktu) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${day} ${month} ${year}, pada waktu ${hours}:${minutes}:${seconds}`;
    } else {
      return `${day} ${month} ${year}`;
    }
  } else {
    return "-";
  }
};

const revertDate = (formattedDate) => {
  const months = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  // Memisahkan bagian tanggal
  const [day, monthName, year] = formattedDate.split(" ");

  // Mengambil nomor bulan dari nama bulan
  const month = months[monthName];

  // Mengembalikan format YYYY-MM-DD
  return `${year}-${month}-${day.padStart(2, "0")}`;
};

const convertToISO = (date) => {
  // Ubah ke ISO string
  const isoString = date.toISOString();

  // Pisahkan tanggal dan waktu
  const [datePart, timePart] = isoString.split("T");

  // Tambahkan "Z" di akhir waktu untuk menandakan UTC
  const formattedDate = `${datePart}T${timePart.slice(0, 8)}Z`;

  return formattedDate;
};

export { formatDate, revertDate, convertToISO };
