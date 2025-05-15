console.log('Voice Command Executor content script loaded');

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageContent') {
    const pageContent = {
      html: document.documentElement.outerHTML,
      url: window.location.href,
      title: document.title
    };
    sendResponse(pageContent);
  }

  return true; // Indicates async response
});