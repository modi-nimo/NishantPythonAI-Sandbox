console.log('Service worker started.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'processNavigationCommand') {
    const transcript = request.transcript;
    console.log('Background received command:', transcript);

    if (transcript.startsWith('click on')) {
      const elementText = transcript.substring('click on'.length).trim();
      console.log('Attempting to click on:', elementText);

      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "clickElement", elementText: elementText }, function(response) {
            if (response && response.success) {
              console.log(`Content script success: Clicked on "${elementText}"`);
            } else if (response && response.error) {
              console.error("Content script error:", response.error);
            } else {
              console.log("No response from content script.");
            }
          });
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
    } else {
      console.log('Unrecognized command:', transcript);
    }
  }
  // Important: Return true if you want to send a response asynchronously
  return true;
});