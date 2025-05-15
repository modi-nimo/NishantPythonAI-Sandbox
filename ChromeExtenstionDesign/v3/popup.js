document.addEventListener('DOMContentLoaded', function() {
  const startNavButton = document.getElementById('startNavButton');
  const stopNavButton = document.getElementById('stopNavButton');
  const feedbackDiv = document.getElementById('feedback');
  const responseContainer = document.getElementById('responseContainer');
  const responseBox = document.getElementById('responseBox');
  let recognition;
  let isNavigating = false;

  // Initialize speech recognition
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started in popup.');
      startNavButton.disabled = true;
      stopNavButton.disabled = false;
      feedbackDiv.textContent = 'Listening for commands...';
      isNavigating = true;
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      console.log('Transcribed command in popup:', transcript);
      feedbackDiv.textContent = 'Sending to Ollama...';

      // Send the transcript to the background service worker
      sendCommandToBackground(transcript)
        .then(response => {
          if (response && response.success) {
            console.log('Ollama response received:', response.ollamaResponse);
            feedbackDiv.textContent = 'Ollama response received:';

            // Display the response in the popup
            responseContainer.style.display = 'block';
            responseBox.textContent = response.ollamaResponse;
          } else {
            console.error('Error processing command:', response ? response.error : 'No response');
            feedbackDiv.textContent = 'Error processing command. Check console for details.';
            responseContainer.style.display = 'none';
          }
        })
        .catch(error => {
          console.error("Failed to process command:", error);
          feedbackDiv.textContent = 'Communication error. Check console for details.';
          responseContainer.style.display = 'none';
        });

      stopRecognition();
      isNavigating = false;
      startNavButton.disabled = false;
      stopNavButton.disabled = true;
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
      if (isNavigating) {
        startNavButton.disabled = false;
        stopNavButton.disabled = true;
        isNavigating = false;
      }
    };

    function startRecognition() {
      recognition.start();
      // Clear previous response when starting new recognition
      responseContainer.style.display = 'none';
      responseBox.textContent = '';
    }

    function stopRecognition() {
      recognition.stop();
    }

    function sendCommandToBackground(transcript) {
      return new Promise((resolve, reject) => {
        try {
          const port = chrome.runtime.connect({name: "voice-command"});

          port.onMessage.addListener(function(response) {
            console.log("Received response:", response);
            resolve(response);
          });

          port.postMessage({command: 'processNavigationCommand', transcript: transcript});
        } catch (error) {
          console.error("Connection error:", error);
          reject(error);
        }
      });
    }

    // Add event listeners
    startNavButton.addEventListener('click', startRecognition);
    stopNavButton.addEventListener('click', stopRecognition);

  } else {
    feedbackDiv.textContent = 'Web Speech API not supported in this browser.';
    startNavButton.disabled = true;
    stopNavButton.disabled = true;
  }
});