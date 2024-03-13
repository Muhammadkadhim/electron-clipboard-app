# Electron Clipboard App

## Overview

This is a clipboard application built using Electron.js. It provides users with the ability to save text and images to their clipboard, along with additional features such as timestamped entries, deletion of individual clips, and bulk deletion with confirmation. The app also offers system tray integration, theme customization, and keyboard shortcut functionality for ease of use.

## Features

1. **Text and Image Saving**: Save both text and images to the clipboard.
2. **Timestamps**: Displays the time clips were added, such as "1 minute ago".
3. **Individual Clip Deletion**: Delete single clips as needed.
4. **Bulk Clip Deletion**: Delete all clips at once with a confirmation modal.
5. **System Tray Integration**: Access the app through a tray icon for quick access and hiding.
6. **Tray Icon Functionality**:
    - **Open/Hide**: Clicking the tray icon toggles the visibility of the app.
    - **Right-Click Options**:
        - **Always on Top**: Choose whether the clipboard should stay on top of other windows.
        - **Theme Selection**: Choose between dark, light, or system-based theme.
7. **Keyboard Shortcut**: Use Alt + K to show and hide the clipboard.
8. **Permanent Clip Storage**: Clips are saved indefinitely, ensuring they are accessible even after restarting the application.

## Usage

1. Clone this repository.
2. Navigate to the project directory in your terminal.
3. Run `npm install` to install dependencies.
4. Run `npx electron-packager . appname` to package the app and generate a `.exe` file. This will create a folder named `appname-win32-x64` with the necessary files to run the app.

## Acknowledgements

- [Electron.js](https://www.electronjs.org/)
- [Electron Store](https://www.npmjs.com/package/electron-store)
- [Electron Packager](https://github.com/electron/electron-packager)

## Contributors

- [Muhammad Kadhim](https://github.com/Muhammadkadhim)
