# Web-Projector

Web-Projector is a lightweight, fully web-based live presentation and projection application. Designed as a modern alternative to traditional church presentation software (like ProPresenter or EasyWorship), it allows you to project Bible verses, song lyrics, and custom media to external displays or live streams directly from your browser.

## Features

- **Bible Verse Projection**: Load and display scriptures instantly. Includes support for importing custom Bible translations via Zefania XML.
- **Song Lyrics Management**: Search for song lyrics online (powered by `lyrics.ovh`), import `.txt` files, and manage your library. Automatically parses lyrics into projectable slides.
- **OBS & Live Stream Integration**: Dedicated output view (`/output`) designed to be captured as a Browser Source in OBS or displayed full-screen on an extended monitor.
- **Highly Customizable Themes**: Control exactly how your projection looks.
  - Custom backgrounds (Solid colors, Images, or Videos)
  - Dynamic typography (Fonts, sizing, text transforms)
  - Lower-third styling and positioning
  - Text animations and transitions
- **Setlists & Data Management**: Build setlists for your events, and easily export/import your entire song library and settings via JSON files.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with [Lucide React](https://lucide.dev/) for icons
- **Backend/Database**: [Firebase](https://firebase.google.com/)

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/kachidegreat/web-projector.git
   cd web-projector
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

   _The server will start (usually on `http://localhost:5173`)._

4. **Open the Control Panel:**
   Navigate to the local URL provided by Vite in your browser to access the main control interface.

5. **Launch the Output View:**
   Use the built-in output window (or press `Ctrl + Alt + P`) to open the projection view. You can drag this to an extended monitor or capture the URL in OBS Studio.

## Usage Guide

- **Bibles Tab**: Import a Zefania XML file to load a Bible version. Use the search bar for quick navigation (e.g., `John 3 16`).
- **Songs Tab**: Search for songs or import `.txt` lyrics. Edit formatting and save them to your local library. Click on verse chunks to push them to the live screen.
- **Settings**: Adjust the global display styles such as fonts, backgrounds, and lower-thirds.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

## License

This project is open-source and available under the [MIT License](LICENSE).
