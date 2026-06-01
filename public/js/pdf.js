// PDF & CSV Export Service
const PDF = (() => {
  // Export table data to CSV format and trigger download
  const exportToCSV = (headers, rows, filename = 'export.csv') => {
    if (!rows || !rows.length) {
      alert('Aucune donnée à exporter');
      return;
    }

    // Map headers to CSV row
    const csvContent = [];
    csvContent.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // Map rows to CSV format
    rows.forEach(row => {
      csvContent.push(row.map(cell => {
        const str = cell === null || cell === undefined ? '' : String(cell);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','));
    });

    // Add Byte Order Mark (BOM) to support Excel UTF-8 reading
    const blob = new Blob(['\uFEFF' + csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export element content to PDF using html2pdf.js
  const exportToPDF = (elementId, filename = 'report.pdf', rtl = false) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`PDF: Element with ID ${elementId} not found.`);
      return;
    }

    // Default configuration for html2pdf
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
    } else {
      console.warn('PDF: html2pdf library not loaded. Falling back to window.print()');
      window.print();
    }
  };

  return {
    exportToCSV,
    exportToPDF
  };
})();