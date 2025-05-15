console.log('Service worker started.');

// Listen for connections from the popup
chrome.runtime.onConnect.addListener(function(port) {
  console.log("Connection established with", port.name);

  port.onMessage.addListener(async function(request) {
    console.log("Background received message:", request);

    if (request.command === 'processNavigationCommand') {
      const transcript = request.transcript;
      console.log('Background received command:', transcript);

      try {
        // Send the transcript to Ollama
        const ollamaResponse = await sendToOllama(transcript);
        console.log('Ollama Response:', ollamaResponse);
        port.postMessage({ success: true, ollamaResponse: ollamaResponse });

        // Process navigation commands (if needed)
        processNavigationCommand(transcript);
      } catch (error) {
        console.error('Ollama Error:', error);
        port.postMessage({ success: false, error: error.toString() });
      }
    }
  });
});

// Function to process navigation commands
function processNavigationCommand(transcript) {
  if (transcript.startsWith('click on')) {
    const elementText = transcript.substring('click on'.length).trim();
    console.log('Attempting to click on:', elementText);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "clickElement", elementText: elementText });
      } else {
        console.error("No active tab found.");
      }
    });
  } else if (transcript === 'go back') {
    chrome.tabs.goBack();
    console.log('Command: Go Back');
  } else if (transcript === 'go forward') {
    chrome.tabs.goForward();
    console.log('Command: Go Forward');
  }
}

// Function to send text to local Ollama model
async function sendToOllama(text) {
  try {
    // Adjust this URL to match your local Ollama endpoint
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'granite3.3',
        prompt: text,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.response; // Return the LLM response
  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw error;
  }
}