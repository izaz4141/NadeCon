<h1 align="center">
  <br>
    <a href="https://github.com/izaz4141/NadeCon"><img src="https://github.com/izaz4141/NadeCon/blob/main/icons/nadecon-115.png?raw=true" alt="NadeCon" width="115"></a>
  <br>
  NadeCon
  <br>
</h1>

<h4 align="center">
  A Firefox extension that detects media on webpages and connects to <a href="https://github.com/izaz4141/nadekodon-rs" target="_blank">**Nadeko~don**</a>.
</h4>

## Features

- Detects video and audio elements on webpage
- One-click sending of media URLs to the desktop application

## Requirements

1. [**Nadeko~don**](https://github.com/izaz4141/nadekodon-rs)
2. Firefox-based browser (version 142+ recommended)


## Usage

1. Ensure [**Nadeko~don**](https://github.com/izaz4141/nadekodon-rs) is running
2. Browse to any webpage with media content
3. Click the extension icon in Firefox's toolbar or popup
4. Click the "Configuration" button and set up the extension to use the Nadeko~don port along with your API keys
    
## Installation

### Download Packaged Extension
1. Download the extension in [**GitHub Releases**](https://github.com/izaz4141/Nadecon/releases/latest/download/NadeCon.xpi)
2. Go to [about:config](about:config)
3. Turn `xpinstall.signatures.required` off ( sorry no verification yet )
4. Go to [**Manage your Extension**](about:addons)
5. Click on the ⚙ and select **Install Add-on from File...**
6. Select the downloaded NadeCon.xpi

### Package from Source
1. Clone this repository
2. Package to xpi:
    - **Not Minified**: `zip -1 -r NadeCon.xpi * -x@xpi.ignore`
    - **Minified**: `npm run build`
3. Go to [about:config](about:config)
4. Turn `xpinstall.signatures.required` off ( sorry no verification yet )
5. Go to [**Manage your Extension**](about:addons)
6. Click on the ⚙ and select **Install Add-on from File...**
7. Select the packaged NadeCon.xpi

## Planned Features

1. ~~Window in add-on to show media~~
2. ~~Window in add-on to select quality and download media~~
3. ~~Window in add-on to configure port, turnoff popup~~
4. Open app through extension

## Troubleshooting
1. "Error sending URL" in browser console:
    - Ensure desktop application is running
    - Check firewall allows connections on selected port (default is 8080)
    - Verify application didn't crash on startup
2. No media detected:
    - Some sites use iframes or custom players
    - Manually copy-paste URL into application as alternative
