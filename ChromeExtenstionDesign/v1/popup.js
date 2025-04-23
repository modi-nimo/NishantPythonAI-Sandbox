const startNavButton = document.getElementById('startNavButton');
const stopNavButton = document.getElementById('stopNavButton');
const feedbackDiv = document.getElementById('feedback');
let recognition;
let isNavigating = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    console.log('Speech recognition started in popup.');
    startNavButton.disabled = true;
    stopNavButton.disabled = false;
    feedbackDiv.textContent = 'Listening for navigation commands...';
    isNavigating = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    console.log('Transcribed command in popup:', transcript);

    // Send the transcript to the background service worker for processing
    chrome.runtime.sendMessage({ command: 'processNavigationCommand', transcript: transcript });

    stopRecognition(); // Stop listening after processing a command
    isNavigating = false;
    startNavButton.disabled = false;
    stopNavButton.disabled = true;
    feedbackDiv.textContent = 'Command processed.';
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
    if (isNavigating) { // If stopped after a command
      startNavButton.disabled = false;
      stopNavButton.disabled = true;
      isNavigating = false;
    }
  };

  function startRecognition() {
    recognition.start();
  }

  function stopRecognition() {
    recognition.stop();
  }

  startNavButton.addEventListener('click', startRecognition);
  stopNavButton.addEventListener('click', stopRecognition);

} else {
  feedbackDiv.textContent = 'Web Speech API not supported in this browser.';
  startNavButton.disabled = true;
  stopNavButton.disabled = true;
}