const State = {
  Start: "0",
  Stop: "1",
};

// Important: use "all" context as this also allows to write
// on "special" elements, such as google docs
chrome.contextMenus.create({
  id: State.Start,
  title: "Start typing",
  contexts: ["all"],
});

chrome.contextMenus.create({
  id: State.Stop,
  title: "Stop typing",
  contexts: ["all"],
});

chrome.contextMenus.onClicked.addListener(({ menuItemId }, tab) => {
  if (menuItemId == State.Start) {
    startTyping(tab.id);
  } else {
    stopTyping(tab.id);
  }
});

// Track current task for each tab to prevent running multiple
// tasks on the same tab. New tasks will end previous ones.
let tasks = {};

const startTyping = async (tabId) => {
  const taskId = Math.random();

  tasks[tabId] = taskId;

  await chrome.debugger.attach({ tabId }, "1.3").catch(() => {});

  const text = [...(await readClipboard(tabId))];

  let i = 0;

  while (tasks[tabId] === taskId && i < text.length) {
    await typeCharacter(tabId, text[i]);
    // Random delay from 50ms to 200ms
    // Source: https://sa.rochester.edu/jur/issues/fall2005/ordal.pdf
    await wait(randomNumber(50, 200));
    i++;
  }

  // cleanup
  stopTyping(tabId);
};

const stopTyping = (tabId) => {
  delete tasks[tabId];
};

const typeCharacter = async (tabId, character) => {
  await chrome.debugger.sendCommand({ tabId }, "Input.insertText", { text: character });

  /* 
     As there isn't a reliable way of sending certain characters like \n without
     adding additional logic and the method below doesn't support emojis, the above
     solution was just simpler. Might consider the one below if the current method
     gets detected or blocked. 
  */

  //await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", {
  //  type: "keyDown",
  //  code: character,
  //});
  //await wait(randomNumber(70, 150));
  //await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", {
  //  type: "keyUp",
  //  code: character,
  //});
};

const readClipboard = async (tabId) => {
  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => navigator.clipboard.readText(),
    })
    .then(([{ result }]) => result);
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
