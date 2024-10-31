import { Storage } from "@plasmohq/storage"

const storage = new Storage()

chrome.runtime.onInstalled.addListener(async function (details) {
        console.log("Extension Installed or Updated", details)
        const userDetails = await storage.get("user")
        if (!userDetails) {
            const uniqueId = generateUniqueId()
            await storage.set("user", JSON.stringify({ userId: uniqueId, onboarded: false }));
        }})

      function generateUniqueId() {
        return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function () {
            return (Math.random() * 16 | 0).toString(16);
        });
    }


    chrome.action.onClicked.addListener(async () => {
        try {
          const userData = await storage.get("user"); 
      
          if (!userData) {
            return;
          }
      
          const user = JSON.parse(userData); 
      
          if (user.onboarded === false) {
            chrome.tabs.create({
              url: chrome.runtime.getURL("tabs/welcome.html") 
            });
          } else {
            console.log("User onboarded, opening main interface");
            chrome.sidePanel
              .setPanelBehavior({ openPanelOnActionClick: true })
              .catch((error) => console.error("SidePanel Error:", error));
          }
        } catch (error) {
          console.error("Error retrieving user data or parsing:", error);
        }
      });
      