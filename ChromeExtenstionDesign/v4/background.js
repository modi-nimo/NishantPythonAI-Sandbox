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
          // Attempt to parse the JSON string from Ollama
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
      if (actionDetails.selector || actionDetails.element_text_match) {
        chrome.tabs.sendMessage(tabId, {
          action: "performTypeAndSubmit",
          selector: actionDetails.selector,
          element_text_match: actionDetails.element_text_match,
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
        console.error("Missing selector or text match for type_and_submit", actionDetails);
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
    case 'scroll':
      chrome.tabs.sendMessage(tabId, {
        action: "performScroll",
        direction: actionDetails.direction || 'down',
        amount: actionDetails.amount || 'medium'
      }, response => {
        if (chrome.runtime.lastError) {
          console.error("Error sending scroll to content script:", chrome.runtime.lastError.message);
        } else {
          console.log("Scroll response from content script:", response);
        }
      });
      break;
    case 'sequence':
      if (Array.isArray(actionDetails.actions) && actionDetails.actions.length > 0) {
        chrome.tabs.sendMessage(tabId, {
          action: "performSequence",
          actions: actionDetails.actions
        }, response => {
          if (chrome.runtime.lastError) {
            console.error("Error sending sequence to content script:", chrome.runtime.lastError.message);
          } else {
            console.log("Sequence response from content script:", response);
          }
        });
      } else {
        console.error("Invalid or empty actions array for sequence", actionDetails);
      }
      break;
    case 'navigate':
      if (actionDetails.url) {
        let url = actionDetails.url;
        // Basic URL normalization: add https:// if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        chrome.tabs.update(tabId, { url: url });
        console.log('Navigating to:', url);
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
  // IMPORTANT: Change 'gemma3' to your specific gemma3 model name in Ollama
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
     "element_text_match": "PLACEHOLDER_OR_LABEL_TEXT",
     "text": "TEXT_TO_TYPE",
     "submit_selector": "CSS_SELECTOR_FOR_SUBMIT_BUTTON_OR_FORM",
     "reasoning": "Brief explanation of why this action and selector were chosen."
   }
   Example for Amazon "Search for Eraser":
   {
     "action": "type_and_submit",
     "selector": "input#twotabsearchtextbox",
     "element_text_match": "Search Amazon",
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

3. For scrolling:
   {
     "action": "scroll",
     "direction": "down|up|right|left",
     "amount": "small|medium|full|page|end|bottom|top|[number]",
     "reasoning": "Brief explanation of why scrolling is needed."
   }
   Example for "Scroll to bottom":
   {
     "action": "scroll",
     "direction": "down",
     "amount": "end",
     "reasoning": "User wants to scroll to the bottom of the page."
   }
    Example for "Scroll up":
   {
     "action": "scroll",
     "direction": "up",
     "amount": "medium",
     "reasoning": "User wants to scroll up the page."
   }
    Example for "Go to top":
   {
     "action": "scroll",
     "direction": "toposition",
     "amount": "top",
     "reasoning": "User wants to scroll to the top of the page."
   }


4. For multi-step sequences (like "click the button and then type in the search box"):
   {
     "action": "sequence",
     "actions": [
       {
         "type": "click",
         "element_text_match": "Sign in",
         "delay": 1000
       },
       {
         "type": "type_and_submit",
         "element_text_match": "Email",
         "text": "example@email.com",
         "delay": 500
       }
     ],
     "reasoning": "User wants to perform a multi-step action. First clicking, then typing."
   }

5. For navigating to a new URL (e.g., "open google.com", "go to wikipedia"):
   {
     "action": "navigate",
     "url": "FULL_URL_TO_NAVIGATE_TO",
     "reasoning": "Brief explanation."
   }
   Example for "open google.com":
   {
     "action": "navigate",
     "url": "google.com",
     "reasoning": "User wants to open Google."
   }

6. For going back or forward in history:
   {
     "action": "go_back",
     "reasoning": "User wants to go to the previous page."
   }
   OR
   {
     "action": "go_forward",
     "reasoning": "User wants to go to the next page in history."
   }

7. If the command cannot be reliably mapped to an action:
   {
     "action": "unsupported",
     "reasoning": "Explanation of why the command is unsupported or unclear."
   }

Important considerations:
- Provide BOTH selector and element_text_match when possible to maximize chances of finding the right element
- For scrolling commands, parse phrases like "scroll down", "scroll up", "scroll to bottom", "scroll to top", etc.
- For navigate commands, extract the website name and format it as a URL (e.g., "google.com" from "open google.com").
- For multi-step sequences, include appropriate delays between actions (in milliseconds)
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
    // The most reliable is to expect data.response to be a string containing JSON.
    if (typeof data.response === 'string') {
       // Attempt to parse the string content of data.response
        try {
            JSON.parse(data.response); // Just validate it's parseable JSON
            return data.response; // Return the stringified JSON
        } catch (e) {
            console.warn("Ollama response.response was a string but not valid JSON. Returning raw response.", data.response);
             // If it's not valid JSON, return the raw text for debugging,
             // but the parsing in the caller will likely fail.
             // You might want to return an error structure here instead.
            return data.response;
        }
    } else if (typeof data === 'object' && data !== null) {
        // If data itself is the JSON object (less common for /api/generate but possible)
         console.log("Ollama response was a direct JSON object.", data);
         return JSON.stringify(data); // Stringify the object
    } else {
        // Handle unexpected response format
        const errorMsg = "Ollama returned an unexpected format.";
        console.error(errorMsg, data);
        throw new Error(errorMsg);
    }


  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw error;
  }
}