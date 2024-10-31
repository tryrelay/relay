# Relay

Relay is an open source HTTP interceptor that helps you to **capture**, **edit**, and **run requests** directly in your browser. 

## Features

- **Capture Requests**: Automatically capture HTTP/HTTPS API requests from your browser.
- **Edit & Replay**: Modify captured requests and replay them with one click.
- **Save Sessions**: Keep a history of your sessions for easier access and analysis.
- **Real-time Editing**: Adjust headers, parameters, and body content directly.
- **Run Requests**: Execute API requests within the browser and get instant feedback.
- **No Postman Required**: No need for external applications, just run everything in the extension.

Stay tuned for upcoming features and enhancements in future versions.

## Installation

To install Relay:

1. Clone the repo:
   ```bash
   git clone https://github.com/Tammilore/relay.git
   ```

2. Navigate to the project folder:
   ```bash
   cd relay
   ```

3. Install the dependencies using `pnpm`:
   ```bash
   pnpm install
   ```

4. Run the extension:
   ```bash
   pnpm dev
   ```

5. Load the extension in Chrome:
   - Open **chrome://extensions/**
   - Enable **Developer Mode** (toggle on top-right)
   - Click **Load unpacked** and navigate to the extension's `build/chrome-mv3-dev` directory.
   - To see Relay, click on the puzzle piece icon on the Chrome toolbar. Click on the extension and it'll open in the sidebar of your browser.

Now Relay is ready to use! Don't forget to pin the extension to your Chrome toolbar for easy access.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or above)
- [pnpm](https://pnpm.io/installation) 

## Usage

Once installed, you can open Relay directly in your browser. It will automatically detect any API requests made in your active tab and allow you to:

- View requests in real-time.
- Modify request details, including headers, params and body content.
- Send modified requests back to the server and see the response directly in the extension.

## License

See the [LICENSE](LICENSE) file for details.

## Stay Updated

Get updates as soon as we add new features. 
