chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "clickElement") {
    const targetText = request.elementText.toLowerCase().trim();
    const clickableElements = document.querySelectorAll('button, a, input[type="submit"], input[type="button"], label, span, div'); // Added more potential clickable elements

    let clicked = false;
    clickableElements.forEach(element => {
      const elementText = (element.textContent || element.innerText || element.value || element.getAttribute('aria-label')).toLowerCase().trim(); // Include aria-label
      if (elementText.includes(targetText)) {
        console.log('Found matching element:', element); // Log the matching element
        element.click();
        clicked = true;
      }
    });

    if (clicked) {
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: `Could not find and click element with text: "${request.elementText}"` });
    }
  }
});