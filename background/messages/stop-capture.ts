import type { PlasmoMessaging } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0].id;
    chrome.debugger.detach({ tabId: activeTabId });
  });

  res.send("Capture stopped");
};

export default handler;
