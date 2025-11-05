# Hydra VDO Ninja

An integration between [Hydra](https://hydra.ojack.xyz/) and [VDO.Ninja](https://vdo.ninja/) that enables real-time video streaming and processing between Hydra and VDO.Ninja peer-to-peer video rooms.

## Overview

This project aims to replace pb.setName and s0.initStream functionality which have been broken for a while.

- **Stream Hydra visuals to VDO.Ninja rooms** - Send your Hydra-generated visuals as a video stream to any VDO.Ninja room
- **Use VDO.Ninja streams as Hydra sources** - Pull video streams from VDO.Ninja rooms and use them as input sources in Hydra

## Features

- **Bidirectional streaming**: Both send Hydra output to VDO.Ninja and receive VDO.Ninja streams in Hydra
- **Real-time processing**: Low-latency video processing using MediaStreamTrackProcessor
- **Multiple room support**: Handle multiple VDO.Ninja rooms simultaneously
- **Cross-platform compatibility**: Works in browsers that support MediaStreamTrackProcessor API

## Quick Start

### Prerequisites

- A modern web browser with MediaStreamTrackProcessor support (Chrome 94+, Edge 94+, etc.)
- Basic knowledge of Hydra
- Access to VDO.Ninja rooms

## API Reference

### `setVdoOutput(roomName)`

Sends the current Hydra canvas output to a VDO.Ninja room.

- `roomName` (string): The name of the VDO.Ninja room to stream to

### `source.initVdoStream(roomName, params)`

Initializes a Hydra source from a VDO.Ninja room stream.

- `roomName` (string): The name of the VDO.Ninja room to pull from
- `params` (object, optional): Additional parameters for the texture

## Examples

### Example 1: Simple Output Streaming

```javascript
setVdoOutput("hydra_output")

osc().rotate(.1,.1).out()
```

### Example 2: Video Processing Pipeline

```javascript
await import("https://cdn.jsdelivr.net/gh/emptyflash/hydra-vdo-ninja/hydra-vdo-ninja.js")

s0.initVdoStream("hydra_output")

src(s0).diff(shape()).out()
```

### Example 3: Multi-room Setup

```javascript
await import("https://cdn.jsdelivr.net/gh/emptyflash/hydra-vdo-ninja/hydra-vdo-ninja.js")

// Pull from multiple rooms
await s0.initVdoStream("room1");
await s1.initVdoStream("room2");

// Mix the streams
src(s0).blend(src(s1)).out()

// Send to output room
setVdoOutput("mixed_output")
```


## Development

### Project Structure

- `hydra-vdo-ninja.js` - Main integration script
- `server.py` - Local development server with cross-origin isolation
- `source.html` - Example for receiving VDO.Ninja streams
- `output.html` - Example for sending Hydra output to VDO.Ninja

## Acknowledgments

- [Hydra](https://hydra.ojack.xyz/) - Live-coding visual synthesizer
- [VDO.Ninja](https://vdo.ninja/) - Peer-to-peer video streaming platform
- The creative coding community for inspiration and support

