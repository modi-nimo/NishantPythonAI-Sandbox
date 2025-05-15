document.addEventListener('DOMContentLoaded', function() {
  const startNavButton = document.getElementById('startNavButton');
  const stopNavButton = document.getElementById('stopNavButton');
  const feedbackDiv = document.getElementById('feedback');
  const responseContainer = document.getElementById('responseContainer');
  const responseBox = document.getElementById('responseBox');
  let recognition;
  let isNavigating = false;
  let port; // Declare port here to reuse if needed, or establish new one each time

  // Initialize speech recognition
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Stop after first utterance
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started in popup.');
      startNavButton.disabled = true;
      stopNavButton.disabled = false;
      feedbackDiv.textContent = 'Listening for commands...';
      isNavigating = true; // This flag seems to be used for UI state, ensure it's managed correctly
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      console.log('Transcribed command in popup:', transcript);
      feedbackDiv.textContent = `Heard: "${transcript}". Sending to Ollama...`;

      // Send the transcript to the background service worker
      sendCommandToBackground(transcript)
        .then(response => {
          if (response && response.success) {
            console.log('Ollama action received:', response.ollamaResponse);
            feedbackDiv.textContent = 'Ollama action processing...';

            // Display the structured response (JSON) in the popup
            responseContainer.style.display = 'block';
            try {
              // ollamaResponse should be the parsed JSON object from background
              responseBox.textContent = JSON.stringify(response.ollamaResponse, null, 2);
              if (response.ollamaResponse.reasoning) {
                feedbackDiv.textContent = `Ollama action: ${response.ollamaResponse.action}. Reasoning: ${response.ollamaResponse.reasoning}`;
              } else {
                feedbackDiv.textContent = `Ollama action: ${response.ollamaResponse.action}.`;
              }
            } catch (e) {
              responseBox.textContent = "Error displaying Ollama response: " + response.ollamaResponse;
              feedbackDiv.textContent = 'Ollama response received (raw).';
            }

          } else {
            console.error('Error processing command:', response ? response.error : 'No response');
            feedbackDiv.textContent = 'Error processing command. Check console for details. ' + (response ? response.error : '');
            responseContainer.style.display = 'none';
          }
        })
        .catch(error => {
          console.error("Failed to process command:", error);
          feedbackDiv.textContent = 'Communication error with background. Check console for details.';
          responseContainer.style.display = 'none';
        })
        .finally(() => {
          // Recognition stops automatically due to continuous=false
          // but we manage UI state here
          isNavigating = false;
          startNavButton.disabled = false;
          stopNavButton.disabled = true;
        });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error in popup:', event.error);
      feedbackDiv.textContent = 'Speech recognition error: ' + event.error;
      startNavButton.disabled = false;
      stopNavButton.disabled = true;
      isNavigating = false;
    };

    recognition.onend = () => {
      console.log('Speech recognition ended in popup.');
      // If recognition ends unexpectedly while navigating, reset UI
      if (isNavigating) {
        startNavButton.disabled = false;
        stopNavButton.disabled = true;
        isNavigating = false;
        // feedbackDiv.textContent = 'Recognition stopped.'; // Optional: update feedback
      }
    };

    function startRecognition() {
      if (recognition) {
        recognition.start();
        // Clear previous response when starting new recognition
        responseContainer.style.display = 'none';
        responseBox.textContent = '';
      }
    }

    function stopRecognition() {
      if (recognition) {
        recognition.stop();
        // UI state managed by onend and onresult
      }
    }

    function sendCommandToBackground(transcript) {
      return new Promise((resolve, reject) => {
        try {
          // Establish a new port for each command to ensure clean state
          port = chrome.runtime.connect({name: "voice-command-popup"});

          port.onMessage.addListener(function(response) {
            console.log("Popup received response from background:", response);
            resolve(response);
            port.disconnect(); // Disconnect after receiving the response
          });

          port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
              console.error('Port disconnected with error:', chrome.runtime.lastError.message);
              // Potentially reject the promise if it hasn't resolved yet,
              // though typically onMessage should fire first for a successful exchange.
            }
            console.log("Port disconnected.");
          });

          port.postMessage({command: 'processNavigationCommand', transcript: transcript});
        } catch (error) {
          console.error("Connection error in sendCommandToBackground:", error);
          reject(error);
        }
      });
    }

    // Add event listeners
    startNavButton.addEventListener('click', startRecognition);
    stopNavButton.addEventListener('click', stopRecognition);
    stopNavButton.disabled = true; // Initially stop button is disabled

  } else {
    feedbackDiv.textContent = 'Web Speech API not supported in this browser.';
    startNavButton.disabled = true;
    stopNavButton.disabled = true;
  }
});