// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.revisedText) {
    // Get the ChatGPT input field
    const chatInput = document.querySelector('textarea[placeholder="Send a message..."]');
    if (chatInput) {
      // Insert revised text into ChatGPT input field
      chatInput.value = request.revisedText;
      // Trigger input event to update the ChatGPT interface
      const inputEvent = new InputEvent('input', { bubbles: true });
      chatInput.dispatchEvent(inputEvent);
    }
  }
});
