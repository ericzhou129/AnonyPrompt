let wordReplacementContainer = document.getElementById('wordReplacementContainer');
let wordMappings = {};

// Load wordMappings, inputText, outputText, and wordsToReplaceArray from local storage when the popup opens
chrome.storage.local.get(['wordMappings', 'inputText', 'outputText', 'wordsToReplaceArray'], (data) => {
  if (data.wordMappings) {
    wordMappings = data.wordMappings;
  }
  if (data.inputText) {
    document.getElementById('inputText').value = data.inputText;
  }
  if (data.outputText) {
    document.getElementById('outputText').value = data.outputText;
  }
  // Recreate the input boxes for words to replace
  if (data.wordsToReplaceArray) {
    data.wordsToReplaceArray.forEach(word => {
      let wordField = document.createElement('input');
      wordField.type = 'text';
      wordField.className = 'form-control rounded mb-2';
      wordField.placeholder = 'Word to replace';
      wordField.value = word;
      wordReplacementContainer.appendChild(wordField);
    });
  }
});

// Function to add word fields for replacement
document.getElementById('addWordBtn').addEventListener('click', () => {
  let wordField = document.createElement('input');
  wordField.type = 'text';
  wordField.className = 'form-control rounded mb-2';
  wordField.placeholder = 'Word to replace';
  wordReplacementContainer.appendChild(wordField);
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Function to replace sensitive words with placeholders
document.getElementById('replaceBtn').addEventListener('click', () => {
  let inputText = document.getElementById('inputText').value;
  let wordsToReplace = wordReplacementContainer.querySelectorAll('input');
  wordMappings = {}; // Reset the word mappings
  let outputText = inputText;
  let wordsToReplaceArray = []; // Array to store words to replace
  for (let wordField of wordsToReplace) {
    let word = wordField.value.trim();
    wordsToReplaceArray.push(word); // Add word to the array
    // Ignore empty word fields
    if (word !== '') {
      let placeholder = generateRandomWord(); 
      wordMappings[word.toLowerCase()] = placeholder;
      // Use regex to match whole words only and ignore case
      outputText = outputText.replace(new RegExp('\\b' + escapeRegExp(word) + '\\b', 'gi'), placeholder);
    }
  }
  document.getElementById('outputText').value = outputText;
  // Save wordMappings, inputText, outputText, and wordsToReplaceArray to local storage
  chrome.storage.local.set({ wordMappings, inputText, outputText, wordsToReplaceArray });

  // Insert revised text into ChatGPT chatbox
  insertTextIntoChatGPT(outputText);
});



// Function to copy altered text to clipboard and insert into ChatGPT chatbox
document.getElementById('copyAndInsertBtn').addEventListener('click', () => {
  let outputText = document.getElementById('outputText').value;
  outputText = outputText.trim();
  if (outputText) {
    // Copy revised text to clipboard
    navigator.clipboard.writeText(outputText).then(() => {
      console.log('Text successfully copied to clipboard');
    }).catch(err => {
      console.error('Unable to copy text to clipboard', err);
    });

    // Insert the revised text into Chat.openai.com chatbox
    insertTextIntoChatGPT(outputText);
  }
});



// Function to revert placeholders in the response text
document.getElementById('revertBtn').addEventListener('click', () => {
  const responseText = document.getElementById('responseText').value;
  const revertedText = revertPlaceholders(responseText);
  // Display the reverted text in the revertedText textarea
  document.getElementById('revertedText').value = revertedText;
});

// Function to copy reverted text to clipboard
document.getElementById('copyRevertedBtn').addEventListener('click', () => {
  let revertedText = document.getElementById('revertedText');
  revertedText.select();
  document.execCommand('copy');
});

// Function to clear everything
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('inputText').value = '';
  document.getElementById('outputText').value = '';
  document.getElementById('responseText').value = '';
  document.getElementById('revertedText').value = '';
  wordReplacementContainer.innerHTML = ''; // Clear word replacement fields
  wordMappings = {};
  chrome.storage.local.remove(['wordMappings', 'inputText', 'outputText', 'wordsToReplaceArray']); // Remove wordsToReplaceArray from local storage
});


// Function to insert revised text into ChatGPT chatbox
function insertTextIntoChatGPT(revisedText) {
  // Query for the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Get the tabId of the active tab
    const tabId = tabs[0].id;

    // Execute the content script
    chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      func: (text) => {
        // Find the chat input element on Chat.openai.com using the correct class name
        const chatInput = document.querySelector('textarea[placeholder="Send a message..."]');
        if (chatInput) {
          // Update the value of the chat input element
          chatInput.value = text;
          // Trigger an input event to ensure the UI updates
          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('Text successfully inserted into ChatGPT chatbox');
        } else {
          console.log('Chat input element not found');
        }
      },
      args: [revisedText],
    });
  });
}




// Function to generate random words for placeholders
function generateRandomWord() {
  const words = [];
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 1; i <= 10; i++) {
    for (let j = 0; j < alphabet.length && words.length < 100; j++) {
      words.push('word' + i + alphabet[j]);
    }
  }
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Function to revert placeholders to original words based on wordMappings
function revertPlaceholders(responseText) {
  for (const [originalWord, placeholder] of Object.entries(wordMappings)) {
    responseText = responseText.replace(new RegExp(placeholder, 'g'), originalWord);
  }
  return responseText;
}

