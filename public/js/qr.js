// QR Code Generator Service
const QR = (() => {
  // Generate QR Code for Client (using qrcode-generator CDN)
  const generate = (clientId, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      container.innerHTML = '';
      
      // Type number: 4, Error Correction Level: 'L'
      const qr = qrcode(4, 'L');
      qr.addData(clientId);
      qr.make();
      
      // Create element image tag (size multiplier: 4)
      container.innerHTML = qr.createImgTag(4, 8);
    } catch (err) {
      console.error("Error generating QR code:", err);
      container.textContent = "QR Code Error";
    }
  };

  return {
    generate
  };
})();