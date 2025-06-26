document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const amountInput = document.getElementById('amountInput');
    const dateInput = document.getElementById('dateInput');
    const receiptNoInput = document.getElementById('receiptNoInput'); // NEW: Receipt No input
    const collectorNameInput = document.getElementById('collectorNameInput'); // NEW: Collector Name input

    const generateBtn = document.getElementById('generateBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadImageBtn = document.getElementById('downloadImageBtn');

    const receiptNameVal = document.getElementById('receipt-name-val');
    const receiptAmountVal = document.getElementById('receipt-amount-val');
    const receiptAmountText = document.getElementById('receipt-amount-text');
    const receiptNoVal = document.getElementById('receipt-no-val');
    const receiptDateVal = document.getElementById('receipt-date-val');
    const rupeeAmountBox = document.querySelector('.rupee-amount-box');
    const collectorNameVal = document.getElementById('collector-name-val'); // NEW: Collector Name display span

    let receiptCounter = localStorage.getItem('receiptCounter') ? parseInt(localStorage.getItem('receiptCounter')) : 1001;

    // Set default date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    receiptDateVal.textContent = `${dd}-${mm}-${yyyy}`;

    // Initialize the receipt number input field with the current counter
    receiptNoInput.value = receiptCounter;
    receiptNoVal.textContent = receiptCounter; // Also update the receipt display initially

    function formatAmountInWords(num) {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        function inWords(num) {
            if ((num = num.toString()).length > 9) return 'overflow';
            let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return '';
            let str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
            return str.replace(/\s+/g, ' ').trim().replace(/only$/, '');
        }
        const words = inWords(num);
        return words ? words.charAt(0).toUpperCase() + words.slice(1) + ' Only.' : '';
    }

    generateBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const date = dateInput.value;
        const manualReceiptNo = parseInt(receiptNoInput.value); // Get value from manual input
        const collectorName = collectorNameInput.value.trim(); // Get value from collector name input

        if (!name || isNaN(amount) || amount <= 0 || !date) {
            alert('Please enter a valid donor name, a positive amount, and a date.');
            return;
        }

        // Determine which receipt number to use: manual input if valid, otherwise auto-incremented
        let currentReceiptNumber;
        if (!isNaN(manualReceiptNo) && manualReceiptNo > 0) {
            currentReceiptNumber = manualReceiptNo;
        } else {
            currentReceiptNumber = receiptCounter;
        }

        // Update receipt details
        receiptNameVal.textContent = name;
        receiptAmountVal.textContent = amount.toLocaleString('en-IN');
        receiptAmountText.textContent = formatAmountInWords(amount);
        rupeeAmountBox.textContent = amount.toLocaleString('en-IN');

        // Update date, receipt number, and collector name on the receipt
        const [year, month, day] = date.split('-');
        receiptDateVal.textContent = `${day}-${month}-${year}`;
        receiptNoVal.textContent = currentReceiptNumber; // Display the chosen receipt number
        collectorNameVal.textContent = collectorName || '___________________'; // Display collector name, fallback if empty

        downloadPdfBtn.disabled = false;
        downloadImageBtn.disabled = false;
    });

    downloadPdfBtn.addEventListener('click', () => {
        const receiptContainer = document.getElementById('receipt-container');
        const inputSection = document.querySelector('.input-section');
        inputSection.style.display = 'none'; // Temporarily hide input section

        html2canvas(receiptContainer, {
            scale: 3, // Increased scale for even better quality in PDF
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFDE7', // Ensure background is captured correctly
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgWidth = 297;
            const pageHeight = 210;
            const imgHeight = canvas.height * imgWidth / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Use the displayed receipt number for the filename
            pdf.save(`Ganpati_Receipt_${receiptNoVal.textContent}_${nameInput.value.replace(/\s/g, '_')}.pdf`);

            // Update receipt counter for the next receipt:
            // Ensure the next auto-incremented number is at least one greater than the one just used
            // and also respects any higher numbers previously stored in local storage.
            const currentDisplayedReceiptNo = parseInt(receiptNoVal.textContent);
            if (!isNaN(currentDisplayedReceiptNo)) {
                receiptCounter = Math.max(currentDisplayedReceiptNo + 1, receiptCounter);
                localStorage.setItem('receiptCounter', receiptCounter);
                receiptNoInput.value = receiptCounter; // Update the input field for the next receipt
                receiptNoVal.textContent = receiptCounter; // Update receipt display too, anticipating the next
            }

            inputSection.style.display = 'flex'; // Re-show input section
        }).catch(error => {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
            inputSection.style.display = 'flex'; // Re-show input section on error
        });
    });

    // Image download does not increment the receipt counter (typically PDF is the official record)
    downloadImageBtn.addEventListener('click', () => {
        const receiptContainer = document.getElementById('receipt-container');
        const inputSection = document.querySelector('.input-section');
        inputSection.style.display = 'none'; // Temporarily hide input section

        html2canvas(receiptContainer, {
            scale: 3, // Increased scale for better quality image
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFDE7',
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Ganpati_Receipt_${receiptNoVal.textContent}_${nameInput.value.replace(/\s/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            link.remove();

            inputSection.style.display = 'flex'; // Re-show input section
        }).catch(error => {
            console.error("Error generating image:", error);
            alert("Failed to generate image. Please try again.");
            inputSection.style.display = 'flex'; // Re-show input section on error
        });
    });
});