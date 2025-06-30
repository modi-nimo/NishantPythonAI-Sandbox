document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const amountInput = document.getElementById('amountInput');
    const dateInput = document.getElementById('dateInput');
    const receiptNoInput = document.getElementById('receiptNoInput');
    const flatNoInput = document.getElementById('flatNoInput');
    const numMembersInput = document.getElementById('numMembersInput');
    const contactNoInput = document.getElementById('contactNoInput');
    const collectorNameInput = document.getElementById('collectorNameInput');
    const collectorFlatNoInput = document.getElementById('collectorFlatNoInput');

    const generateBtn = document.getElementById('generateBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadImageBtn = document.getElementById('downloadImageBtn');

    const receiptNameVal = document.getElementById('receipt-name-val');
    const receiptAmountVal = document.getElementById('receipt-amount-val');
    const receiptNoVal = document.getElementById('receipt-no-val');
    const receiptDateVal = document.getElementById('receipt-date-val');
    const rupeeAmountBox = document.querySelector('.rupee-amount-box');

    // Updated element references for address lines
    const receiptAddressFlatNoVal = document.getElementById('receipt-address-flat-no-val'); // Now holds only flat number value
    const receiptAddressSocietyVal = document.getElementById('receipt-address-society-val'); // Now holds only society value

    const receiptNumMembersVal = document.getElementById('receipt-num-members-val');
    const receiptContactNoVal = document.getElementById('receipt-contact-no-val');
    const collectorNameVal = document.getElementById('collector-name-val');
    const collectorFlatNoVal = document.getElementById('collector-flat-no-val');
    const collectorUnderline = document.querySelector('.collector-underline');

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
    receiptNoVal.textContent = receiptCounter;

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
        const manualReceiptNo = parseInt(receiptNoInput.value);
        const flatNo = flatNoInput.value.trim();
        const numMembers = parseInt(numMembersInput.value);
        const contactNo = contactNoInput.value.trim();
        const collectorName = collectorNameInput.value.trim();
        const collectorFlatNo = collectorFlatNoInput.value.trim();

        if (!name || isNaN(amount) || amount <= 0 || !date) {
            alert('Please enter a valid donor name, a positive amount, and a date.');
            return;
        }
        if (isNaN(numMembers) || numMembers <= 0) {
            alert('Please enter a valid number of members (a positive integer).');
            return;
        }

        // Determine which receipt number to use
        let currentReceiptNumber;
        if (!isNaN(manualReceiptNo) && manualReceiptNo > 0) {
            currentReceiptNumber = manualReceiptNo;
        } else {
            currentReceiptNumber = receiptCounter;
        }

        // Update receipt details
        receiptNameVal.textContent = name;
        receiptAmountVal.textContent = amount.toLocaleString('en-IN');
        rupeeAmountBox.textContent = amount.toLocaleString('en-IN');

        // Update address with Flat No.
        if (flatNo) {
            receiptAddressFlatNoVal.textContent = flatNo; // Just the flat number here
        } else {
            receiptAddressFlatNoVal.textContent = '.................................'; // Placeholder if empty
        }
        receiptAddressSocietyVal.textContent = `Sensorium by Joyville Society.`; // Static society text

        // Update Number of Members
        receiptNumMembersVal.textContent = numMembers;

        // Update Contact Number
        receiptContactNoVal.textContent = contactNo || '.................................'; // Display contact no, or default placeholder

        // Update date, receipt number
        const [year, month, day] = date.split('-');
        receiptDateVal.textContent = `${day}-${month}-${year}`;
        receiptNoVal.textContent = currentReceiptNumber;

        // Update Collector Name and Flat No
        collectorNameVal.textContent = collectorName || '';
        collectorFlatNoVal.textContent = collectorFlatNo;

        // Show/hide collector flat no and underline based on input
        if (collectorName || collectorFlatNo) {
            collectorUnderline.style.display = 'block';
        } else {
            collectorUnderline.style.display = 'none'; // Hide underline if no collector info
        }
        // If collector flat no is empty, hide its span.
        if (!collectorFlatNo) {
            collectorFlatNoVal.style.display = 'none';
        } else {
            collectorFlatNoVal.style.display = 'block';
        }

        // If both collector name and flat no are empty, replace with underscores and hide extra info
        if (!collectorName && !collectorFlatNo) {
            collectorNameVal.textContent = '___________________';
            collectorFlatNoVal.style.display = 'none';
            collectorUnderline.style.display = 'none';
        }


        downloadPdfBtn.disabled = false;
        downloadImageBtn.disabled = false;
    });

    downloadPdfBtn.addEventListener('click', () => {
        const receiptContainer = document.getElementById('receipt-container');
        const inputSection = document.querySelector('.input-section');
        inputSection.style.display = 'none';

        html2canvas(receiptContainer, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFDE7',
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgWidth = 297;
            const pageHeight = 210;
            const imgHeight = canvas.height * imgWidth / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            pdf.save(`Ganpati_Receipt_${receiptNoVal.textContent}_${nameInput.value.replace(/\s/g, '_')}.pdf`);

            const currentDisplayedReceiptNo = parseInt(receiptNoVal.textContent);
            if (!isNaN(currentDisplayedReceiptNo)) {
                receiptCounter = Math.max(currentDisplayedReceiptNo + 1, receiptCounter);
                localStorage.setItem('receiptCounter', receiptCounter);
                receiptNoInput.value = receiptCounter;
            }

            inputSection.style.display = 'flex';
        }).catch(error => {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
            inputSection.style.display = 'flex';
        });
    });

    downloadImageBtn.addEventListener('click', () => {
        const receiptContainer = document.getElementById('receipt-container');
        const inputSection = document.querySelector('.input-section');
        inputSection.style.display = 'none';

        html2canvas(receiptContainer, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFDE7',
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Ganpati_Receipt_${receiptNoVal.textContent}_${nameInput.value.replace(/\s/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            link.remove();

            inputSection.style.display = 'flex';
        }).catch(error => {
            console.error("Error generating image:", error);
            alert("Failed to generate image. Please try again.");
            inputSection.style.display = 'flex';
        });
    });
});