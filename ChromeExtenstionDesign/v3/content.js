console.log('Voice Command Executor content script loaded');

// Helper function to find an element by text content (more robust)
function findElementByText(text, selector = '*') {
  const elements = document.querySelectorAll(selector);
  text = text.toLowerCase().trim();
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    // Check innerText, textContent, value, aria-label, placeholder
    const elText = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').toLowerCase().trim();
    if (elText.includes(text)) {
      // Check if element is visible
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none') {
         return el;
      }
    }
  }
  return null;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.action === "performClick") {
    let elementToClick = null;
    if (request.selector) {
      try {
        elementToClick = document.querySelector(request.selector);
      } catch (e) {
        console.warn(`Invalid selector for click: ${request.selector}`, e);
      }
    }

    if (!elementToClick && request.element_text_match) {
      console.log(`Selector failed or not provided, trying to find element by text: "${request.element_text_match}"`);
      // Try to find a clickable element (button, link, input[type=button/submit/reset])
      elementToClick = findElementByText(request.element_text_match, 'a, button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [role="link"]');
      if (!elementToClick) {
        // Fallback to any element if specific clickable ones are not found
        elementToClick = findElementByText(request.element_text_match);
      }
    }

    if (elementToClick) {
      console.log('Clicking element:', elementToClick);
      elementToClick.click();
      sendResponse({ success: true, message: `Clicked element matching: ${request.selector || request.element_text_match}` });
    } else {
      const errorMsg = `Could not find element to click with selector "${request.selector}" or text "${request.element_text_match}"`;
      console.error(errorMsg);
      sendResponse({ success: false, error: errorMsg });
    }
    return true; // Indicates async response
  }

  if (request.action === "performTypeAndSubmit") {
    let inputElement = null;
    if (request.selector) {
      try {
        inputElement = document.querySelector(request.selector);
      } catch (e) {
        console.warn(`Invalid selector for input: ${request.selector}`, e);
      }
    }

    if (inputElement && (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA')) {
      console.log(`Typing "${request.text}" into:`, inputElement);
      inputElement.value = request.text;
      // Dispatch input and change events to simulate user typing, which some frameworks might need
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));

      // Attempt to submit
      let form = inputElement.form;
      let submitted = false;

      if (request.submit_selector) {
        try {
          const submitButton = document.querySelector(request.submit_selector);
          if (submitButton) {
            console.log('Clicking explicit submit button:', submitButton);
            submitButton.click();
            submitted = true;
          } else {
            console.warn(`Specified submit_selector "${request.submit_selector}" not found.`);
          }
        } catch (e) {
          console.warn(`Invalid submit_selector: ${request.submit_selector}`, e);
        }
      }

      if (!submitted && form) {
        console.log('Submitting form:', form);
        // Check for a submit button within the form
        const submitButtonInForm = form.querySelector('input[type="submit"], button[type="submit"]');
        if (submitButtonInForm) {
          submitButtonInForm.click();
        } else {
          form.requestSubmit ? form.requestSubmit() : form.submit();
        }
        submitted = true;
      } else if (!submitted) {
        // If no form, try dispatching an Enter key event on the input field
        console.log('No form or explicit submit, trying Enter key press on input.');
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
        inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
        // Some SPAs might listen for 'submit' on the input itself or a parent div if not a form
        inputElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        submitted = true; // Assume it worked
      }

      sendResponse({ success: true, message: `Typed "${request.text}" and attempted submit.` });
    } else {
      const errorMsg = `Could not find input element with selector "${request.selector}" or it's not an input/textarea.`;
      console.error(errorMsg);
      sendResponse({ success: false, error: errorMsg });
    }
    return true; // Indicates async response
  }

  // Keep this for potential future use if background needs more detailed page content
  if (request.action === 'getPageContent') {
    const pageContent = {
      html: document.documentElement.outerHTML.substring(0, 200000), // Limit HTML size
      url: window.location.href,
      title: document.title
    };
    sendResponse(pageContent);
    return true;
  }

  return true; // Important for asynchronous sendResponse
});