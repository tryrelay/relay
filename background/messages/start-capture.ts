import type { PlasmoMessaging } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

let activeTabId: number | null = null;
let requests: Record<string, any> = {}; 

const generateUniqueId = () => `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { method, urls } = req.body;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    activeTabId = tabs[0].id;

    chrome.debugger.attach({ tabId: activeTabId }, "1.3", () => {
      chrome.debugger.sendCommand({ tabId: activeTabId }, "Network.enable");

      chrome.debugger.onEvent.addListener((source, eventMethod, params: any) => {
        if (eventMethod === "Network.requestWillBeSent" && params.requestId) {
          const { requestId, request } = params;

          const uniqueId = generateUniqueId();

          requests[requestId] = {
            id: uniqueId, 
            url: request.url,
            method: request.method,
            requestHeaders: request.headers,
            payload: request.postData,
            queryParams: new URL(request.url).searchParams.toString(),
            startTime: performance.now(),
          };
        }

        if (eventMethod === "Network.responseReceived" && params.requestId) {
          const { requestId, response } = params;

          if (
            requests[requestId] &&
            (!urls || urls.some((url: string) => response.url.includes(url))) &&
            (!method || method.toUpperCase() === requests[requestId].method.toUpperCase()) // Ensure method check is case-insensitive
          ) {
            const endTime = performance.now();
            const duration = `${Math.round(endTime - requests[requestId].startTime)}ms`;

            const requestData = {
              ...requests[requestId],
              status: response.status,
              responseHeaders: response.headers,
              duration,
              response: {}, 
            };

            chrome.debugger.sendCommand(
              { tabId: activeTabId },
              "Network.getResponseBody",
              { requestId },
              async (bodyResponse) => {
                requestData.response = bodyResponse;
                const storedRequests = (await storage.get("apiRequests")) || [];

                await storage.set("apiRequests", [...storedRequests, requestData]);

                res.send(requestData);
              }
            );
          } else {
            console.log(`Request ${requestId} filtered out due to method mismatch. Expected: ${method}, Actual: ${requests[requestId].method}`);
          }
        }
      });
    });
  });
};

export default handler;
