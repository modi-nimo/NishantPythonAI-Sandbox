console.log('Service worker started.');

// Listen for connections from the popup
chrome.runtime.onConnect.addListener(function(port) {
  console.log("Connection established with", port.name);

  port.onMessage.addListener(async function(request) {
    console.log("Background received message:", request);

    if (request.command === 'processNavigationCommand') {
      const transcript = request.transcript;
      console.log('Background received transcript:', transcript);

      try {
        // Get active tab for context
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab) {
          console.error("No active tab found.");
          port.postMessage({ success: false, error: "No active tab found." });
          return;
        }

        const pageContext = {
          url: activeTab.url,
          title: activeTab.title
        };

        // Send the transcript and context to Ollama
        const ollamaResponseString = await sendToOllama(transcript, pageContext);
        console.log('Ollama Raw Response:', ollamaResponseString);

        let ollamaAction;
        try {
          ollamaAction = JSON.parse(ollamaResponseString);
        } catch (e) {
          console.error('Failed to parse Ollama JSON response:', e);
          console.error('Ollama response was:', ollamaResponseString);
          port.postMessage({ success: false, error: 'Failed to parse Ollama response. Response was: ' + ollamaResponseString });
          return;
        }

        console.log('Ollama Parsed Action:', ollamaAction);
        port.postMessage({ success: true, ollamaResponse: ollamaAction }); // Send parsed action back to popup

        // Execute the action determined by Ollama
        await executePageAction(ollamaAction, activeTab.id);

      } catch (error) {
        console.error('Error in background processing:', error);
        port.postMessage({ success: false, error: error.toString() });
      }
    }
  });
});

// Function to execute actions based on Ollama's response
async function executePageAction(actionDetails, tabId) {
  console.log(`Executing action on tab ${tabId}:`, actionDetails);

  if (!actionDetails || !actionDetails.action) {
    console.error("Invalid action details from Ollama:", actionDetails);
    return;
  }

  switch (actionDetails.action) {
    case 'type_and_submit':
      if (actionDetails.selector && actionDetails.text) {
        chrome.tabs.sendMessage(tabId, {
          action: "performTypeAndSubmit",
          selector: actionDetails.selector,
          text: actionDetails.text,
          submit_selector: actionDetails.submit_selector // Optional
        }, response => {
          if (chrome.runtime.lastError) {
            console.error("Error sending type_and_submit to content script:", chrome.runtime.lastError.message);
          } else {
            console.log("Type and submit response from content script:", response);
          }
        });
      } else {
        console.error("Missing selector or text for type_and_submit", actionDetails);
      }
      break;
    case 'click':
      if (actionDetails.selector || actionDetails.element_text_match) {
        chrome.tabs.sendMessage(tabId, {
          action: "performClick",
          selector: actionDetails.selector,
          element_text_match: actionDetails.element_text_match
        }, response => {
          if (chrome.runtime.lastError) {
            console.error("Error sending click to content script:", chrome.runtime.lastError.message);
          } else {
            console.log("Click response from content script:", response);
          }
        });
      } else {
        console.error("Missing selector or element_text_match for click", actionDetails);
      }
      break;
    case 'navigate':
      if (actionDetails.url) {
        chrome.tabs.update(tabId, { url: actionDetails.url });
        console.log('Navigating to:', actionDetails.url);
      } else {
        console.error("Missing URL for navigate action", actionDetails);
      }
      break;
    case 'go_back':
      chrome.tabs.goBack(tabId);
      console.log('Command: Go Back');
      break;
    case 'go_forward':
      chrome.tabs.goForward(tabId);
      console.log('Command: Go Forward');
      break;
    case 'unsupported':
      console.log('Ollama determined command is unsupported:', actionDetails.reasoning);
      // Optionally, notify the user via the popup or a notification
      break;
    default:
      console.warn('Unknown action from Ollama:', actionDetails.action);
  }
}

// Function to send text to local Ollama model
async function sendToOllama(transcript, pageContext) {
  // IMPORTANT: Change 'gemma:latest' to your specific gemma3 model name in Ollama
  const modelName = 'gemma3'; // E.g., 'gemma:2b', 'gemma:7b', or your custom model name

  const prompt = `You are an expert web automation assistant. Your task is to interpret a user's voice command and the context of the current web page, then provide a structured JSON command to interact with the page.

Current Page URL: ${pageContext.url}
Current Page Title: ${pageContext.title}
User Voice Command: "${transcript}"

Based on the command and page context, determine the most appropriate action.
Output ONLY a JSON object with one of the following structures:

1. For searching or typing into an input field and then submitting:
   {
     "action": "type_and_submit",
     "selector": "CSS_SELECTOR_FOR_INPUT_FIELD",
     "text": "TEXT_TO_TYPE",
     "submit_selector": "CSS_SELECTOR_FOR_SUBMIT_BUTTON_OR_FORM",
     "reasoning": "Brief explanation of why this action and selector were chosen."
   }
   Example for Amazon "Search for Eraser":
   {
     "action": "type_and_submit",
     "selector": "input#twotabsearchtextbox",
     "text": "Eraser",
     "submit_selector": "form[action*='/s']",
     "reasoning": "User wants to search. Identified Amazon's main search input and form."
   }

2. For clicking an element (link, button, etc.):
   {
     "action": "click",
     "selector": "CSS_SELECTOR_FOR_CLICKABLE_ELEMENT",
     "element_text_match": "TEXT_CONTENT_OF_THE_ELEMENT",
     "reasoning": "Brief explanation."
   }
   Example for Amazon "Open Cart":
   {
     "action": "click",
     "selector": "a#nav-cart",
     "element_text_match": "Cart",
     "reasoning": "User wants to open the cart. Identified the cart link/button."
   }

3. For navigating to a new URL:
   {
     "action": "navigate",
     "url": "FULL_URL_TO_NAVIGATE_TO",
     "reasoning": "Brief explanation."
   }

4. For going back or forward in history:
   {
     "action": "go_back",
     "reasoning": "User wants to go to the previous page."
   }
   OR
   {
     "action": "go_forward",
     "reasoning": "User wants to go to the next page in history."
   }

5. If the command cannot be reliably mapped to an action:
   {
     "action": "unsupported",
     "reasoning": "Explanation of why the command is unsupported or unclear."
   }

Important considerations:
- Prefer specific CSS selectors (IDs, unique attributes like 'name', 'aria-label').
- If providing 'element_text_match', ensure it's reasonably unique or the most prominent match.
- For 'type_and_submit', if 'submit_selector' is not provided or not found, an attempt will be made to submit the form containing the input field or simulate an 'Enter' key press.
- Ensure the JSON output is valid and contains ONLY the JSON object.

JSON Response:
`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        format: "json" // Request JSON output format if model supports it
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}. Body: ${errorBody}`);
    }

    const data = await response.json();
    // Ollama sometimes wraps the JSON in its response field, sometimes not when format: "json" is used.
    // And sometimes it might still return a string that needs parsing.
    if (typeof data.response === 'string') {
        try {
            // Attempt to parse if it's a stringified JSON
            JSON.parse(data.response);
            return data.response; // Return the stringified JSON
        } catch (e) {
            // If parsing fails, it might be a non-JSON string or malformed.
            console.warn("Ollama response was a string but not valid JSON. Returning as is.", data.response);
            return data.response; // Or handle as an error
        }
    } else if (typeof data.response === 'object') {
        return JSON.stringify(data.response); // Stringify if it's already an object
    }
    // If format: "json" works perfectly, data itself might be the JSON object.
    // However, the /api/generate endpoint usually has a "response" field.
    // The most reliable is to expect data.response to be a string containing JSON.
    // Let's assume data.response is the string containing JSON.
    return data.response;

  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw error;
  }
}