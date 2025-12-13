document.addEventListener("DOMContentLoaded", () => {
    const prefillMessage = encodeURIComponent("Hello Durgesh, I need help regarding an issue on the admin panel.");

    // ---------------- Instagram ----------------
    document.getElementById("instagramBtn").addEventListener("click", () => {
        const instagramUsername = "durgesh_gaud_45"; // Only username, cannot prefill DM
        const url = `https://instagram.com/${instagramUsername}`;
        window.open(url, "_blank");
    });

    // ---------------- WhatsApp ----------------
    document.getElementById("whatsappBtn").addEventListener("click", () => {
        const waNumber = "918237362463"; // Include country code
        const waUrl = `https://wa.me/${waNumber}?text=${prefillMessage}`;
        window.open(waUrl, "_blank");
    });

    // ---------------- Email ----------------
    document.getElementById("emailBtn").addEventListener("click", () => {
        const email = "gaudd221@gmail.com";
        const subject = encodeURIComponent("Admin Panel Help Needed");
        const body = prefillMessage;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const mailUrl = isMobile ? `mailto:${email}?subject=${subject}&body=${body}` 
                                 : `https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`;
        window.open(mailUrl, "_blank");
    });

    // ---------------- Telegram ----------------
    document.getElementById("telegramBtn").addEventListener("click", () => {
        const tgNumber = "8237362463"; // Include country code
        const tgUrl = `https://t.me/+${tgNumber}?text=${prefillMessage}`;
        window.open(tgUrl, "_blank");
    });

    // ---------------- Phone ----------------
    document.getElementById("phoneBtn").addEventListener("click", () => {
        const phone = "8237362463";
        window.location.href = `tel:${phone}`;
    });

    // ---------------- SMS ----------------
    document.getElementById("smsBtn").addEventListener("click", () => {
        const smsNumber = "8237362463";
        const smsUrl = `sms:${smsNumber}?body=${prefillMessage}`;
        window.location.href = smsUrl;
    });
});
