import { useState } from 'react'
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import "./styles.css";

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export default function OnboardingPage() {
  const [email, setEmail] = useState('')


  // Function to close the current tab and open the extension
  const closeTabAndOpenExtension = () => {
    // Close the onboarding tab
    chrome.tabs.getCurrent((tab) => {
      chrome.tabs.remove(tab.id);
    });
  
    // Open the extension in the side panel
  }

  // Handle subscription logic
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Send the email to the API
      const response = await fetch('https://hook.eu2.make.com/22xhnkjjvpw7v2c569uxiucep6jvpayu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        console.log('Subscribed successfully with email:', email);

        // Update the user's 'onboarded' status in storage
        const existingUserData = await storage.get("user");
        let userData = existingUserData ? JSON.parse(existingUserData) : {};

        // Update only the 'onboarded' status
        userData = { ...userData, onboarded: true };

        // Save the updated user data
        await storage.set("user", JSON.stringify(userData));

        console.log('User onboarding completed. Updated user data:', userData);

        // Close tab and open the actual extension
        closeTabAndOpenExtension();
      } else {
        console.error('Failed to subscribe');
      }
    } catch (error) {
      console.error('Error during subscription:', error);
    }
  }

  // Handle "No, thank you" button click
  const handleNoThanks = async () => {
    try {
      // Update the user's 'onboarded' status in storage
      const existingUserData = await storage.get("user");
      let userData = existingUserData ? JSON.parse(existingUserData) : {};

      // Update only the 'onboarded' status
      userData = { ...userData, onboarded: true };

      // Save the updated user data
      await storage.set("user", JSON.stringify(userData));

      console.log('User opted out of onboarding. Updated user data:', userData);

      // Close tab and open the actual extension
      closeTabAndOpenExtension();
    } catch (error) {
      console.error('Error during opt-out:', error);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-4">
        <h1 className="text-3xl font-bold text-center mb-6">Capture, edit and run network requests with Relay</h1>
        <p className="text-center mb-6">Subscribe to get updates and early access to new features</p>
        <form onSubmit={handleSubscribe} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Subscribe
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            className="text-orange-500 hover:text-orange-600"
            onClick={handleNoThanks}
          >
            No, thank you
          </Button>
        </div>
      </div>
    </div>
  )
}