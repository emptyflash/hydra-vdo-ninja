# Hydra-vdo.ninja Integration

A library that extends [Hydra](https://hydra.ojack.xyz/) to stream WebGL canvas content to [vdo.ninja](https://vdo.ninja/) using WebRTC, providing APIs similar to `pb.setGraphics` and `s0.initStream`.

## Features

- Stream Hydra's WebGL canvas to vdo.ninja in real-time
- Support for VDO.Ninja P2P streaming, WHIP-compatible services, and Twitch
- Modern streaming using MediaStreamTrackProcessor with fallback to toDataURL
- API patterns that match existing Hydra conventions
- Easy integration with existing Hydra projects

## Installation

Include the library after Hydra in your HTML:

```html
<!-- Load Hydra first -->
<script src="path/to/hydra-synth.js"></script>

<!-- Load Hydra-vdo.ninja integration -->
<script src="hydra-vdo-ninja.js"></script>
<script src="hydra-vdo-ninja-integration.js"></script>
```

## Quick Start

### Basic Usage

```javascript
// Initialize Hydra first
const hydra = new Hydra({ makeGlobal: true });

// Create some visuals
osc(10, 0.1, 1.2).out();

// Initialize vdo.ninja integration
initVdoNinja();

// Start streaming
const result = startVdoStream('my-hydra-visuals');
console.log('View link:', result.viewLink);
```

### Hydra-like API

```javascript
// Similar to pb.setGraphics pattern
initVdoNinja();

// Start streaming with options
vdo.start({
    pushId: 'custom-stream-id',
    roomName: 'my-room',
    password: 'optional-password'
});

// Similar to s0.initStream pattern
s0.initVdoNinja('stream-name');

// Stop streaming
vdo.stop();
```

### Advanced Usage

```javascript
// Manual initialization with options
const hydraVdo = new HydraVdoNinja(hydra, {
    width: 1280,
    height: 720,
    fps: 30,
    useMediaTrackProcessor: true
});

// Stream to VDO.Ninja
const result = hydraVdo.startVDOStream({
    pushId: 'my-stream',
    roomName: 'hydra-room'
});

// Stream to Twitch
hydraVdo.startTwitchStream('your-twitch-token');

// Stream to WHIP service
hydraVdo.startWhipStream('https://whip.service.url', 'optional-token');

// Get view link for sharing
console.log(hydraVdo.getViewLink());

// Copy to clipboard
hydraVdo.copyViewLink();

// Stop streaming
hydraVdo.stopStreaming();
```

## API Reference

### `initVdoNinja(options)`
Initializes the vdo.ninja integration globally.

- `options.width` - Stream width (default: 1280)
- `options.height` - Stream height (default: 720)
- `options.fps` - Target frame rate (default: 30)
- `options.useMediaTrackProcessor` - Use modern streaming API (default: true)

### `startVdoStream(streamName, options)`
Quick start function for streaming.

- `streamName` - Optional stream identifier
- `options` - Additional streaming options

### `vdo.start(options)`
Start VDO.Ninja streaming (global API).

- `options.pushId` - Stream identifier
- `options.roomName` - Room name
- `options.password` - Optional password

### `s0.initVdoNinja(streamName, options)`
Initialize vdo.ninja stream on source 0 (mimics s0.initStream).

### `HydraVdoNinja` Class

#### Constructor
`new HydraVdoNinja(hydraInstance, options)`

#### Methods
- `startVDOStream(options)` - Start VDO.Ninja streaming
- `startWhipStream(whipUrl, whipToken)` - Stream to WHIP service
- `startTwitchStream(twitchToken)` - Stream to Twitch
- `stopStreaming()` - Stop all streaming
- `getViewLink()` - Get view link for sharing
- `copyViewLink()` - Copy view link to clipboard

## Examples

See the `example.html` file for a complete working example with UI controls.

## How It Works

1. **Canvas Capture**: The library captures frames from Hydra's WebGL canvas
2. **Composite Canvas**: Creates a composite canvas for consistent streaming
3. **WebRTC Streaming**: Uses vdo.ninja's iframe-based approach to stream content
4. **Modern APIs**: Prefers MediaStreamTrackProcessor with fallback to toDataURL

## Browser Support

- Modern browsers with WebRTC support
- Chrome, Firefox, Edge (recent versions)
- Safari 14+ for MediaStreamTrackProcessor
- Fallback support for older browsers

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions welcome! Please feel free to submit issues and pull requests.

## Related Projects

- [Hydra](https://hydra.ojack.xyz/) - Live coding visuals
- [vdo.ninja](https://vdo.ninja/) - WebRTC video streaming platform
- [Peer Broadcast](https://github.com/ojack/hydra-peer-broadcast) - Original Hydra streaming solution

