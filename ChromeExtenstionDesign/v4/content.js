console.log('Voice Command Executor content script loaded');

// Helper function to find an element by text content (more robust)
function findElementByText(text, selector = '*') {
  const elements = document.querySelectorAll(selector);
  text = text.toLowerCase().trim();

  // Sort elements by visibility and specificity of match
  const matches = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];

    // Check innerText, textContent, value, aria-label, placeholder
    const innerText = (el.innerText || '').toLowerCase().trim();
    const textContent = (el.textContent || '').toLowerCase().trim();
    const value = (el.value || '').toLowerCase().trim();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase().trim();
    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase().trim();

    // Check for exact match first, then partial match
    const allTexts = [innerText, textContent, value, ariaLabel, placeholder].filter(t => t);

    let matchScore = 0;
    let exactMatch = false;

    for (const elText of allTexts) {
      if (elText === text) {
        exactMatch = true;
        matchScore = 100; // Prioritize exact matches
        break;
      } else if (elText.includes(text)) {
        // Score based on how close the match is to the full text
        const score = text.length / elText.length * 50;
        matchScore = Math.max(matchScore, score);
      }
    }

    if (matchScore > 0) {
      // Check if element is visible
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const isVisible = rect.width > 0 &&
                        rect.height > 0 &&
                        style.visibility !== 'hidden' &&
                        style.display !== 'none' &&
                        style.opacity !== '0';

      if (isVisible) {
        matches.push({
          element: el,
          score: matchScore + (exactMatch ? 1000 : 0), // Heavily favor exact matches
          inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
        });
      }
    }
  }

  // Sort by score (descending) and prioritize elements in viewport
  matches.sort((a, b) => {
    if (a.inViewport !== b.inViewport) {
      return a.inViewport ? -1 : 1; // Prioritize elements in viewport
    }
    return b.score - a.score; // Then by score
  });

  return matches.length ? matches[0].element : null;
}

// Function to perform scrolling actions
function performScroll(direction, amount = 'medium') {
  console.log(`Performing scroll ${direction} (${amount})`);

  let scrollAmount;

  // Determine scroll amount
  switch (amount) {
    case 'little':
    case 'small':
      scrollAmount = window.innerHeight * 0.25;
      break;
    case 'medium':
    case 'half':
      scrollAmount = window.innerHeight * 0.5;
      break;
    case 'page':
    case 'full':
      scrollAmount = window.innerHeight * 0.9;
      break;
    case 'end':
    case 'bottom':
      // For "end"/"bottom", we'll override direction
      scrollAmount = document.body.scrollHeight;
      direction = 'toposition';
      break;
    case 'top':
    case 'start':
      scrollAmount = 0;
      direction = 'toposition';
      break;
    default:
      // Try to parse if it's a number (like "scroll down 300")
      const parsedAmount = parseInt(amount);
      scrollAmount = !isNaN(parsedAmount) ? parsedAmount : window.innerHeight * 0.5;
  }

  // Perform the actual scroll
  switch (direction) {
    case 'down':
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
      break;
    case 'up':
      window.scrollBy({
        top: -scrollAmount,
        behavior: 'smooth'
      });
      break;
    case 'toposition':
      window.scrollTo({
        top: scrollAmount,
        behavior: 'smooth'
      });
      break;
    case 'right':
      window.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      break;
    case 'left':
      window.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
      break;
  }

  return true;
}

// Function to perform a sequence of actions
function performSequence(actions) {
  return new Promise((resolve, reject) => {
    const executeNextAction = (index) => {
      if (index >= actions.length) {
        resolve({ success: true, message: 'All actions completed successfully' });
        return;
      }

      const action = actions[index];
      console.log(`Executing sequence action ${index + 1}/${actions.length}:`, action);

      let actionPromise;

      switch (action.type) {
        case 'click':
          actionPromise = new Promise(resolveAction => {
            const response = handleClickAction(action);
            // Check if handleClickAction returned a Promise (due to scrolling)
            if (response instanceof Promise) {
              response.then(resolveAction).catch(resolveAction); // Resolve sequence promise on action completion/failure
            } else {
              setTimeout(() => resolveAction(response), action.delay || 500);
            }
          });
          break;
        case 'type':
        case 'type_and_submit':
          actionPromise = new Promise(resolveAction => {
            const response = handleTypeAction(action);
             // Check if handleTypeAction returned a Promise (due to scrolling)
            if (response instanceof Promise) {
              response.then(resolveAction).catch(resolveAction); // Resolve sequence promise on action completion/failure
            } else {
              setTimeout(() => resolveAction(response), action.delay || 500);
            }
          });
          break;
        case 'scroll':
          actionPromise = new Promise(resolveAction => {
            const response = performScroll(action.direction, action.amount);
            setTimeout(() => resolveAction({ success: response }), action.delay || 1000); // performScroll returns boolean, wrap in success object
          });
          break;
        case 'wait':
          actionPromise = new Promise(resolveAction => {
            setTimeout(() => resolveAction({ success: true }), action.duration || 1000);
          });
          break;
        default:
          actionPromise = Promise.resolve({ success: false, error: `Unknown action type: ${action.type}` });
      }

      actionPromise.then(result => {
        console.log(`Action ${index + 1} result:`, result);
        // Continue sequence even if an action fails, unless continueOnError is explicitly false
        if (result.success || action.continueOnError !== false) {
          executeNextAction(index + 1);
        } else {
          reject({ error: `Action ${index + 1} failed: ${result.error || 'Unknown error'}`, failedAt: index });
        }
      }).catch(error => {
        // Catch unexpected exceptions during action execution
        reject({ error: `Exception in action ${index + 1}: ${error.message}`, failedAt: index });
      });
    };

    executeNextAction(0);
  });
}


// Handle click actions (used by both direct and sequence calls)
function handleClickAction(options) {
  let elementToClick = null;

  if (options.selector) {
    try {
      elementToClick = document.querySelector(options.selector);
    } catch (e) {
      console.warn(`Invalid selector for click: ${options.selector}`, e);
    }
  }

  if (!elementToClick && options.element_text_match) {
    console.log(`Selector failed or not provided, trying to find element by text: "${options.element_text_match}"`);
    // Try to find a clickable element (button, link, input[type=button/submit/reset])
    elementToClick = findElementByText(options.element_text_match, 'a, button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [role="link"], [tabindex]');

    if (!elementToClick) {
      // Fallback to any element if specific clickable ones are not found
      elementToClick = findElementByText(options.element_text_match);
    }
  }

  if (elementToClick) {
    // Scroll element into view if needed
    if (!isElementInViewport(elementToClick)) {
      elementToClick.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Give a small delay for scrolling before clicking
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('Clicking element:', elementToClick);
          try {
            elementToClick.click();
            resolve({
              success: true,
              message: `Clicked element matching: ${options.selector || options.element_text_match}`
            });
          } catch (e) {
            console.error('Error clicking element:', e);
            resolve({
              success: false,
              error: `Error clicking element: ${e.message}`
            });
          }
        }, 500); // Delay after scroll
      });
    }

    console.log('Clicking element:', elementToClick);
    try {
      elementToClick.click();
      return {
        success: true,
        message: `Clicked element matching: ${options.selector || options.element_text_match}`
      };
    } catch (e) {
      console.error('Error clicking element:', e);
      return {
        success: false,
        error: `Error clicking element: ${e.message}`
      };
    }
  } else {
    const errorMsg = `Could not find element to click with selector "${options.selector}" or text "${options.element_text_match}"`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Handle typing actions (used by both direct and sequence calls)
function handleTypeAction(options) {
  let inputElement = null;

  if (options.selector) {
    try {
      inputElement = document.querySelector(options.selector);
    } catch (e) {
      console.warn(`Invalid selector for input: ${options.selector}`, e);
    }
  }

  if (!inputElement && options.element_text_match) {
    // Try to find input by placeholder, label, etc.
    const inputSelectors = 'input, textarea, [contenteditable="true"]';
    inputElement = findElementByText(options.element_text_match, inputSelectors);
  }

  if (inputElement) {
    // Is this an input element or something contenteditable?
    const isEditableElement = inputElement.tagName === 'INPUT' ||
                              inputElement.tagName === 'TEXTAREA' ||
                              inputElement.getAttribute('contenteditable') === 'true';

    if (isEditableElement) {
      // Scroll element into view if needed
      if (!isElementInViewport(inputElement)) {
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Small delay for scroll
        return new Promise(resolve => {
           setTimeout(() => {
             console.log(`Typing "${options.text}" into:`, inputElement);

             // Focus the element first
             inputElement.focus();

             // For contenteditable, set innerHTML
             if (inputElement.getAttribute('contenteditable') === 'true') {
               inputElement.innerHTML = options.text;
             } else {
               // For regular input/textarea
               inputElement.value = options.text;
             }

             // Dispatch input and change events to simulate user typing
             inputElement.dispatchEvent(new Event('input', { bubbles: true }));
             inputElement.dispatchEvent(new Event('change', { bubbles: true }));

             // Handle submission if needed
             if (options.type === 'type_and_submit') {
               let submitted = false;
               let form = inputElement.form;

               if (options.submit_selector) {
                 try {
                   const submitButton = document.querySelector(options.submit_selector);
                   if (submitButton) {
                     console.log('Clicking explicit submit button:', submitButton);
                     submitButton.click();
                     submitted = true;
                   } else {
                     console.warn(`Specified submit_selector "${options.submit_selector}" not found.`);
                   }
                 } catch (e) {
                   console.warn(`Invalid submit_selector: ${options.submit_selector}`, e);
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
                 // If no form, try Enter key
                 console.log('No form or explicit submit, trying Enter key press on input.');
                 inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                   key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
                 }));
                 inputElement.dispatchEvent(new KeyboardEvent('keyup', {
                   key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
                 }));

                 // Some SPAs might listen for 'submit' on the input itself or a parent div
                 inputElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                 submitted = true;
               }
             }

             resolve({ success: true, message: `Typed "${options.text}" and ${options.type === 'type_and_submit' ? 'attempted submit.' : 'completed typing.'}` });
           }, 500); // Delay after scroll
        });
      }

      console.log(`Typing "${options.text}" into:`, inputElement);

      // Focus the element first
      inputElement.focus();

      // For contenteditable, set innerHTML
      if (inputElement.getAttribute('contenteditable') === 'true') {
        inputElement.innerHTML = options.text;
      } else {
        // For regular input/textarea
        inputElement.value = options.text;
      }

      // Dispatch input and change events to simulate user typing
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));

      // Handle submission if needed
      if (options.type === 'type_and_submit') {
        let submitted = false;
        let form = inputElement.form;

        if (options.submit_selector) {
          try {
            const submitButton = document.querySelector(options.submit_selector);
            if (submitButton) {
              console.log('Clicking explicit submit button:', submitButton);
              submitButton.click();
              submitted = true;
            } else {
              console.warn(`Specified submit_selector "${options.submit_selector}" not found.`);
            }
          } catch (e) {
            console.warn(`Invalid submit_selector: ${options.submit_selector}`, e);
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
          // If no form, try Enter key
          console.log('No form or explicit submit, trying Enter key press on input.');
          inputElement.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
          }));
          inputElement.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
          }));

          // Some SPAs might listen for 'submit' on the input itself or a parent div
          inputElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          submitted = true;
        }
      }

      return { success: true, message: `Typed "${options.text}" and ${options.type === 'type_and_submit' ? 'attempted submit.' : 'completed typing.'}` };
    } else {
      return { success: false, error: `Found element but it's not an input/textarea/contenteditable: ${options.selector || options.element_text_match}` };
    }
  } else {
    const errorMsg = `Could not find input element with selector "${options.selector}" or text "${options.element_text_match}".`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Helper function to check if element is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.action === "performClick") {
    const result = handleClickAction(request);
    // If the result is a promise (like when we scroll before clicking)
    if (result instanceof Promise) {
      result.then(sendResponse);
      return true; // Indicates async response
    }
    sendResponse(result);
    return true;
  }

  if (request.action === "performTypeAndSubmit") {
    const options = {
      ...request,
      type: 'type_and_submit'
    };
     const result = handleTypeAction(options);
     // If the result is a promise (like when we scroll before typing)
     if (result instanceof Promise) {
       result.then(sendResponse);
       return true; // Indicates async response
     }
    sendResponse(result);
    return true;
  }

  if (request.action === "performScroll") {
    const success = performScroll(request.direction, request.amount);
    sendResponse({ success, message: `Scrolled ${request.direction} by ${request.amount}` });
    return true;
  }

  if (request.action === "performSequence") {
    performSequence(request.actions)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message || JSON.stringify(error) }));
    return true;
  }

  // For potential future use
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