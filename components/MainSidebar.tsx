import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Button } from "~components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { Input } from "~components/ui/input"
import { Badge } from "~components/ui/badge"
import { ScrollArea } from "~components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~components/ui/accordion"
import { Label } from "~components/ui/label"
import { Textarea } from "~components/ui/textarea"
import { Search, Wifi, X, ChevronRight, ChevronDown, Send, Plus, Copy, Settings, Mail } from "lucide-react"
import { Switch } from "~components/ui/switch"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export default function MainSidebar() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [domains, setDomains] = useState<string[]>([])
  const [currentDomain, setCurrentDomain] = useState("")
  const [apiRequests, setApiRequests] = useState<any[]>([])
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [isAutoSaveOn, setIsAutoSaveOn] = useState(false)
  const [autoClearOption, setAutoClearOption] = useState("24h")
  const [email, setEmail] = useState("")
  const [activeTab, setActiveTab] = useState<"capture" | "requests">("capture")
  const [showSettings, setShowSettings] = useState(false)
  const [method, setMethod] = useState("all")

  const toggleCapture = async () => {
    setIsCapturing(!isCapturing);
  
    if (!isCapturing) {
      const resp = await sendToBackground({
        name: "start-capture",
        body: {
          method: method === "all" ? null : method,  
          urls: domains.length > 0 ? domains : null  
        }
      });
      if (resp) {
        setApiRequests((prevRequests) => [...prevRequests, resp]);
      }
    } else {
      const resp = await sendToBackground({
        name: "stop-capture"
      });
    }
  };
  

  const addDomain = () => {
    if (currentDomain && !domains.includes(currentDomain)) {
      setDomains([...domains, currentDomain])
      setCurrentDomain("")
    }
  }

  const removeDomain = (domain: string) => {
    setDomains(domains.filter(d => d !== domain))
  }

  useEffect(() => {
    if (!isCapturing) {
      const loadRequests = async () => {
        const storedRequests = await storage.get("apiRequests")
        if (storedRequests) {
          try {
            const parsedRequests = typeof storedRequests === "string" ? JSON.parse(storedRequests) : storedRequests
            console.log("Parsed requests:", parsedRequests)
            
            setApiRequests(parsedRequests || []); 
          } catch (error) {
            console.error("Error parsing stored requests:", error)
          }
        }
      }
  
      loadRequests()
    }
  }, [isCapturing])
  

  const handleEdit = (request: any) => {
    setEditingRequest({ ...request })
  }

  const handleSave = async () => {
  if (editingRequest.payload) {
    try {
      const parsedPayload = JSON.parse(editingRequest.payload);
      setEditingRequest({ ...editingRequest, payload: parsedPayload });
    } catch (error) {
      console.error("Invalid JSON payload");
      alert("Invalid JSON format in payload");
      return; 
    }
  }

  const updatedRequests = apiRequests.map((req) =>
    req.id === editingRequest.id ? editingRequest : req
  );

  await storage.set("apiRequests", updatedRequests);
  setApiRequests(updatedRequests);
  setEditingRequest(null); 
};


  const handleInputChange = (field: string, value: string) => {
    if (field === "payload") {
      setEditingRequest({ ...editingRequest, [field]: value });
    } else {
      setEditingRequest({ ...editingRequest, [field]: value });
    }
  };  

  const handleObjectChange = (field: string, key: string, value: string) => {
    setEditingRequest({
      ...editingRequest,
      [field]: { ...editingRequest[field], [key]: value }
    })
  }

  const addObjectEntry = (field: string) => {
    setEditingRequest({
      ...editingRequest,
      [field]: { ...editingRequest[field], "": "" }
    })
  }

  const removeObjectEntry = (field: string, key: string) => {
    const newObject = { ...editingRequest[field] }
    delete newObject[key]
    setEditingRequest({
      ...editingRequest,
      [field]: newObject
    })
  }

  const sendRequest = async (request: any) => {
    try {
      const startTime = performance.now();
      const queryString = new URLSearchParams(request.queryParams).toString();
      const urlWithQuery = `${request.url}${queryString ? `?${queryString}` : ''}`;
      
      let requestBody = request.payload;
      if (typeof request.payload === 'string') {
        try {
          requestBody = JSON.parse(request.payload); 
        } catch (error) {
          console.error("Invalid JSON format in payload. Sending raw string as payload.");
          requestBody = request.payload;  
        }
      }
  
      const response = await fetch(urlWithQuery, {
        method: request.method,
        headers: {
          ...request.requestHeaders,
          'Content-Type': 'application/json'
        },
        body: request.method !== 'GET' ? JSON.stringify(requestBody) : undefined  
      });
  
      const data = await response.json();
      const endTime = performance.now();
      const updatedRequest = {
        ...request,
        status: response.status,
        time: `${Math.round(endTime - startTime)}ms`,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        response: data,
      };
  
      setApiRequests(apiRequests.map(req => req.id === request.id ? updatedRequest : req));
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };
  

  const copyRequestToClipboard = (request: any) => {
    const curlCommand = `curl -X ${request.method} '${request.url}' \\
      ${Object.entries(request.requestHeaders).map(([key, value]) => `-H '${key}: ${value}'`).join(" \\\n")} \\
      ${request.payload ? `--data '${JSON.stringify(request.payload)}'` : ''}`;
    
    navigator.clipboard.writeText(curlCommand).then(() => {
      console.log('Copied cURL to clipboard');
    });
  };
  


  const openFeedbackEmail = () => {
    window.open('mailto:tammilore@gmail.com?subject=Feedback on Relay')
  }

  const clearAllRequests = async () => {
    try {
      await storage.set("apiRequests", []);
      setApiRequests([]);
    } catch (error) {
      console.error("Error clearing requests:", error);
    }
  };

  const subscribeToUpdates = async () => {
    try {
      if (!email) {
        alert("Please enter your email address.");
        return;
      }
  
      const response = await fetch("https://your-subscription-endpoint.com/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
  
      if (response.ok) {
        alert("You have successfully subscribed to updates!");
      } else {
        console.error("Failed to subscribe:", response.statusText);
        alert("Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("An error occurred while subscribing. Please try again.");
    }
  };
  
  

  return (
    <div className="w-96 h-screen bg-background flex flex-col relative">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        >
        <image
          href="https://res.cloudinary.com/tamilore/image/upload/v1729539540/boomerang-stick_2_ovbuyf.png"
          width="24"
          height="24"
        />
        </svg>
          <h1 className="text-lg font-semibold">Relay</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      {showSettings ? (
        <ScrollArea className="flex-grow p-4">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save">Auto-save requests</Label>
              <Switch
                id="auto-save"
                checked={isAutoSaveOn}
                onCheckedChange={setIsAutoSaveOn}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-clear">Auto-clear saved data</Label>
              <Select
                value={autoClearOption}
                onValueChange={setAutoClearOption}
                disabled={!isAutoSaveOn}
              >
                <SelectTrigger id="auto-clear">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">After 24 hours</SelectItem>
                  <SelectItem value="7d">After 7 days</SelectItem>
                  <SelectItem value="100r">After 100 requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="storage">Storage</Label>
              <div className="flex items-center space-x-2">
                <Select disabled>
                  <SelectTrigger id="storage">
                    <SelectValue placeholder="Local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subscription">Subscribe for updates</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="email-subscription"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button size="icon" variant="ghost" onClick={subscribeToUpdates}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="link" className="p-0 h-auto font-normal" onClick={openFeedbackEmail}>
                Send feedback
              </Button>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "capture" | "requests")} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="capture">Capture</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="capture" className="flex-grow overflow-auto">
            <div className="p-4 space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative w-24 h-24">
                  <Search className="w-24 h-24 text-muted-foreground" />
                  <Wifi className="w-8 h-8 text-primary absolute bottom-0 right-0" />
                </div>
                <h2 className="text-xl font-semibold">Start capturing network traffic</h2>
                <p className="text-sm text-muted-foreground">
                  All requests captured are present in the Requests tab.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-medium">
                    {isCapturing ? 'Capturing' : 'Ready to capture'}
                  </span>
                </div>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="get">GET</SelectItem>
                    <SelectItem value="post">POST</SelectItem>
                    <SelectItem value="put">PUT</SelectItem>
                    <SelectItem value="delete">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add domain or URL"
                      value={currentDomain}
                      onChange={(e) => setCurrentDomain(e.target.value)}
                    />
                    <Button onClick={addDomain}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {domains.map((domain) => (
                      <Badge key={domain} variant="secondary" className="flex items-center space-x-1">
                        <span>{domain}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeDomain(domain)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={toggleCapture}
              >
                {isCapturing ? 'Stop Capture' : 'Start Capture'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="requests" className="flex-grow overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
              <div className="mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllRequests}
                  >
                    Clear All Requests
                  </Button>
                </div>
                {apiRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant={request.status < 400 ? "default" : "destructive"}>
                          {request.method}
                        </Badge>
                        <span className="text-sm font-medium truncate max-w-[150px]">{request.url}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyRequestToClipboard(request)
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {expandedRequest === request.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    {expandedRequest === request.id && (
                      <div className="p-2 bg-muted/30 border-t">
                        {editingRequest && editingRequest.id === request.id ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="method">Method</Label>
                              <Select
                                value={editingRequest.method}
                                onValueChange={(value) => handleInputChange('method', value)}
                              >
                                <SelectTrigger id="method">
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GET">GET</SelectItem>
                                  <SelectItem value="POST">POST</SelectItem>
                                  <SelectItem value="PUT">PUT</SelectItem>
                                  <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="url">URL</Label>
                              <Input
                                id="url"
                                value={editingRequest.url}
                                onChange={(e) => handleInputChange('url', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="payload">Payload</Label>
                              <Textarea
                                id="payload"
                                value={editingRequest?.payload || ""} 
                                onChange={(e) => handleInputChange("payload", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Query Params</Label>
                              {Object.entries(editingRequest.queryParams).map(([key, value]) => (
                                <div key={key} className="flex gap-2 mt-2">
                                  <Input
                                    value={key}
                                    onChange={(e) => handleObjectChange('queryParams', e.target.value, value as string)}
                                    placeholder="Key"
                                  />
                                  <Input
                                    value={value as string}
                                    onChange={(e) => handleObjectChange('queryParams', key, e.target.value)}
                                    placeholder="Value"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeObjectEntry('queryParams', key)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addObjectEntry('queryParams')}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Query Param
                              </Button>
                            </div>
                            <div>
                              <Label>Request Headers</Label>
                              {Object.entries(editingRequest.requestHeaders).map(([key, value]) => (
                                <div key={key} className="flex gap-2 mt-2">
                                  <Input
                                    value={key}
                                    onChange={(e) => handleObjectChange('requestHeaders', e.target.value, value as string)}
                                    placeholder="Key"
                                  />
                                  <Input
                                    value={value as string}
                                    onChange={(e) => handleObjectChange('requestHeaders', key, e.target.value)}
                                    placeholder="Value"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeObjectEntry('requestHeaders', key)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addObjectEntry('requestHeaders')}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Request Header
                              </Button>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button onClick={() => setEditingRequest(null)} variant="outline">Cancel</Button>
                              <Button onClick={handleSave}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <Tabs defaultValue="details">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="details">Details</TabsTrigger>
                              <TabsTrigger value="response">Response</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details">
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="url">
                                  <AccordionTrigger className="text-sm py-1">URL</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="text-xs break-all">{request.url}</div>
                                  </AccordionContent>
                                </AccordionItem>
                                {request.payload && (
                                  <AccordionItem value="payload">
                                    <AccordionTrigger className="text-sm  py-1">Payload</AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(request.payload, null, 2)}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                                {Object.keys(request.queryParams).length > 0 && (
                                  <AccordionItem value="queryParams">
                                    <AccordionTrigger className="text-sm py-1">Query Params</AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(request.queryParams, null, 2)}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                                <AccordionItem value="responseHeaders">
                                  <AccordionTrigger className="text-sm py-1">Response Headers</AccordionTrigger>
                                  <AccordionContent>
                                    <pre className="text-xs whitespace-pre-wrap">
                                      {JSON.stringify(request.responseHeaders, null, 2)}
                                    </pre>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="requestHeaders">
                                  <AccordionTrigger className="text-sm py-1">Request Headers</AccordionTrigger>
                                  <AccordionContent>
                                    <pre className="text-xs whitespace-pre-wrap">
                                      {JSON.stringify(request.requestHeaders, null, 2)}
                                    </pre>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </TabsContent>
                            <TabsContent value="response">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Status: <Badge variant={request.status < 400 ? "default" : "destructive"}>{request.status}</Badge></span>
                                  <span>Time: {request.time}</span>
                                </div>
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="responseBody">
                                    <AccordionTrigger className="text-sm py-1">Response Body</AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(request.response, null, 2)}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button onClick={() => handleEdit(request)} variant="outline">
                            Edit
                          </Button>
                          <Button onClick={() => sendRequest(request)}>
                            <Send className="w-4 mr-2" />
                            Send Request
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}