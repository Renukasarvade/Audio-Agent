# OxiqAI Google Meet Audio Engine

A lightweight, powerful browser extension that captures live Google Meet captions and displays them in a sleek, draggable Chat-Bubble UI overlay with perfect speaker diarization.

## Features

- **Perfect Diarization:** Uses structural DOM parsing to accurately distinguish between local and remote speakers, completely immune to Google Meet's chaotic CSS class updates.
- **Sleek Chat UI:** Renders spoken text in real-time using an intuitive, modern chat bubble interface (similar to iMessage/WhatsApp), keeping the transcript readable and clean.
- **Draggable Overlay:** The transcript box can be dragged anywhere on the screen so it never blocks important presentation content.
- **Real-Time Capture:** Hooks directly into Google Meet's live captioning engine.

## Prerequisites

- Node.js (v16 or higher recommended)
- Google Chrome or Microsoft Edge

## How to Install & Run

1. **Install Dependencies**
   Navigate to the project root and install the necessary packages:
   ```bash
   npm install
   ```

2. **Build the Extension**
   Build the production version of the extension into the `dist` folder:
   ```bash
   npm run build
   ```
   *(Note: You can also use `npm run dev` if you are actively modifying the code, though `npm run build` is recommended for stable usage).*

3. **Load the Extension into your Browser**
   - **Chrome:** Go to `chrome://extensions`
   - **Edge:** Go to `edge://extensions`
   - Toggle **Developer mode** ON (usually in the top right or left menu).
   - Click **Load unpacked**.
   - Select the `dist` folder located inside the `AudioEngine` project directory.

## How to Use

1. Join or start a **Google Meet** call.
2. Turn on **Captions** (the "CC" button at the bottom of the Meet window).
3. The OxiqAI overlay will automatically appear at the bottom of your screen!
4. As people speak, you will see blue chat bubbles for you ("local") and gray chat bubbles for others ("remote").
5. You can grab the handle at the top of the transcript box to drag it anywhere on the screen.

## Development Stack

- **Vite** + **CRXJS** for lightning-fast extension bundling.
- **TypeScript** for robust typing.
- **React** (Popup UI) and Vanilla JS/DOM Manipulation (Content Scripts).
