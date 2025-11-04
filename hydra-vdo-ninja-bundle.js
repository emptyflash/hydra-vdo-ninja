/**
 * Hydra-vdo.ninja Integration Bundle
 * Includes both main library and integration helpers
 */
/**
 * Hydra-vdo.ninja Integration Library
 *
 * This library extends Hydra to stream WebGL canvas content to vdo.ninja
 * using WebRTC streaming similar to pb.setGraphics and s0.initStream
 */

class HydraVdoNinja {
  constructor(hydra, options = {}) {
    this.hydra = hydra;
    this.options = {
      width: options.width || 1280,
      height: options.height || 720,
      fps: options.fps || 30,
      useMediaTrackProcessor: options.useMediaTrackProcessor !== false,
      ...options
    };

    this.isStreaming = false;
    this.iframe = null;
    this.frameGenerator = null;
    this.compositeCanvas = null;
    this.compositeCtx = null;

    // Initialize composite canvas
    this._initCompositeCanvas();
  }

  /**
   * Initialize composite canvas for streaming
   */
  _initCompositeCanvas() {
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = this.options.width;
    this.compositeCanvas.height = this.options.height;
    this.compositeCtx = this.compositeCanvas.getContext('2d');
  }

  /**
   * Create and append vdo.ninja iframe for streaming
   */
  createAndAppendIframe(config) {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
    }

    let url = new URL("https://vdo.ninja", window.location.href);

    if (config.mode === 'vdo') {
      if (config.room) url.searchParams.set("room", config.room);
      if (config.push) url.searchParams.set("push", config.push);
      if (config.password) url.searchParams.set("password", config.password);
    } else if (config.mode === 'whip') {
      url.searchParams.set("whippush", config.whipUrl);
      if (config.whipToken) url.searchParams.set("whippushtoken", config.whipToken);
    }

    url.searchParams.set("framegrab", "");
    url.searchParams.set("view", "");

    this.iframe = document.createElement("iframe");
    this.iframe.style.width = "0";
    this.iframe.style.height = "0";
    this.iframe.style.position = "absolute";
    this.iframe.style.left = "-9999px";
    this.iframe.src = url.toString() + window.location.search.replace("&","?");

    this.iframe.onload = () => {
      setTimeout(() => {
        this.startStreaming();
      }, 100);
    };

    document.body.appendChild(this.iframe);
    return this.iframe;
  }

  /**
   * Start streaming to vdo.ninja using VDO.Ninja mode
   */
  startVDOStream(options = {}) {
    const config = {
      mode: 'vdo',
      push: options.pushId || this._generatePushId(),
      room: options.roomName || '',
      password: options.password || ''
    };

    this.createAndAppendIframe(config);

    // Generate view link
    const viewUrl = new URL("https://vdo.ninja", window.location.href);
    if (config.push) viewUrl.searchParams.set("view", config.push);
    if (config.room) viewUrl.searchParams.set("room", config.room);
    if (config.push && config.room) viewUrl.searchParams.set("solo", "");
    if (config.password) viewUrl.searchParams.set("password", config.password);

    this.viewLink = viewUrl.toString() + "&sharperscreen";

    return {
      viewLink: this.viewLink,
      pushId: config.push
    };
  }

  /**
   * Start streaming to WHIP-compatible service
   */
  startWhipStream(whipUrl, whipToken = '') {
    const config = {
      mode: 'whip',
      whipUrl,
      whipToken
    };

    this.createAndAppendIframe(config);
    setTimeout(() => {
      this.startStreaming();
    }, 1000);
  }

  /**
   * Start streaming to Twitch
   */
  startTwitchStream(twitchToken) {
    const config = {
      mode: 'whip',
      whipUrl: 'https://twitch.vdo.ninja',
      whipToken: twitchToken
    };

    this.createAndAppendIframe(config);
    setTimeout(() => {
      this.startStreaming();
    }, 1000);
  }

  /**
   * Start the actual canvas streaming
   */
  async startStreaming() {
    if (!this.iframe) return;

    this.isStreaming = true;

    try {
      if (this.options.useMediaTrackProcessor && typeof MediaStreamTrackProcessor === 'function') {
        await this._startStreamingWithProcessor();
      } else {
        this._startStreamingWithDataURL();
      }
    } catch (e) {
      console.error("MediaTrackProcessor method failed, falling back to toDataURL:", e);
      this.options.useMediaTrackProcessor = false;
      this._startStreamingWithDataURL();
    }
  }

  /**
   * Modern streaming using MediaStreamTrackProcessor
   */
  async _startStreamingWithProcessor() {
    // Start continuous canvas updates
    this._startCanvasUpdates();

    const stream = this.compositeCanvas.captureStream(this.options.fps);
    const tracks = stream.getVideoTracks();

    // Process each track using MediaStreamTrackProcessor
    await Promise.all(tracks.map(async track => {
      const processor = new MediaStreamTrackProcessor(track);
      const reader = processor.readable.getReader();

      while (this.isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          if (value) value.close();
          break;
        }

        try {
          this.iframe.contentWindow.postMessage({
            type: 'canvas-frame',
            frame: value
          }, '*');
        } finally {
          value.close();
        }
      }
    }));
  }

  /**
   * Start continuous canvas updates
   */
  _startCanvasUpdates() {
    const updateCanvas = () => {
      if (this.isStreaming) {
        this._drawComposite();
        requestAnimationFrame(updateCanvas);
      }
    };
    updateCanvas();
  }

  /**
   * Fallback streaming using toDataURL
   */
  _startStreamingWithDataURL() {
    this.frameGenerator = setInterval(() => {
      this._drawComposite();
      const imageData = this.compositeCanvas.toDataURL('image/webp');
      this.iframe.contentWindow.postMessage({
        type: 'canvas-frame',
        frame: imageData
      }, '*');
    }, 1000 / 10); // 10 fps for fallback
  }

  /**
   * Draw Hydra canvas to composite canvas
   */
  _drawComposite() {
    // Clear composite canvas
    this.compositeCtx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);

    // Draw Hydra canvas
    this.compositeCtx.drawImage(this.hydra.canvas, 0, 0);
  }

  /**
   * Stop streaming
   */
  stopStreaming() {
    this.isStreaming = false;

    if (this.frameGenerator) {
      clearInterval(this.frameGenerator);
      this.frameGenerator = null;
    }

    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }
  }

  /**
   * Generate random push ID
   */
  _generatePushId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Get view link for sharing
   */
  getViewLink() {
    return this.viewLink;
  }

  /**
   * Copy view link to clipboard
   */
  copyViewLink() {
    if (!this.viewLink) return;

    const tempInput = document.createElement('input');
    tempInput.value = this.viewLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HydraVdoNinja;
} else if (typeof define === 'function' && define.amd) {
  define([], () => HydraVdoNinja);
} else {
  window.HydraVdoNinja = HydraVdoNinja;
}


/**
 * Hydra-vdo.ninja Integration with Hydra API Patterns
 *
 * This file provides integration that mimics pb.setGraphics and s0.initStream patterns
 */

// Global vdo.ninja integration instance
let hydraVdoNinja = null;


function getHydra() {
  const whereami = window.location?.href?.includes("hydra.ojack.xyz")
    ? "editor"
    : window.atom?.packages
    ? "atom"
    : "idk";
  if (whereami === "editor") {
    return window.hydraSynth;
  }
  if (whereami === "atom") {
    return global.atom.packages.loadedPackages["atom-hydra"]
      .mainModule.main.hydra;
  }
  let _h = [
    window.hydraSynth,
    window._hydra,
    window.hydra,
    window.h,
    window.H,
    window.hy
  ].find(h => h?.regl);
  return _h;
};

const hydra = getHydra();

/**
 * Initialize vdo.ninja streaming for Hydra
 * Similar to pb.setGraphics pattern
 */
function initVdoNinja(options = {}) {

    hydraVdoNinja = new HydraVdoNinja(hydra, options);

    // Add global methods for Hydra-like API
    window.vdo = {
        start: (options = {}) => hydraVdoNinja.startVDOStream(options),
        startWhip: (whipUrl, whipToken = '') => hydraVdoNinja.startWhipStream(whipUrl, whipToken),
        startTwitch: (twitchToken) => hydraVdoNinja.startTwitchStream(twitchToken),
        stop: () => hydraVdoNinja.stopStreaming(),
        getViewLink: () => hydraVdoNinja.getViewLink(),
        copyViewLink: () => hydraVdoNinja.copyViewLink()
    };

    // Add source initialization method similar to s0.initStream
    if (window.s0) {
        window.s0.initVdoNinja = function(streamName, options = {}) {
            if (!hydraVdoNinja) {
                console.warn('vdo.ninja not initialized. Call initVdoNinja() first.');
                return;
            }

            // Start streaming and return the source
            const result = hydraVdoNinja.startVDOStream({
                pushId: streamName,
                ...options
            });

            console.log(`vdo.ninja stream started with ID: ${streamName}`);
            console.log(`View link: ${result.viewLink}`);

            return result;
        };
    }

    return hydraVdoNinja;
}

/**
 * Quick start function for common use cases
 */
function startVdoStream(streamName = null, options = {}) {
    if (!hydraVdoNinja) {
        initVdoNinja();
    }

    const result = hydraVdoNinja.startVDOStream({
        pushId: streamName || `hydra-${Date.now()}`,
        ...options
    });

    return result;
}

/**
 * Stop vdo.ninja streaming
 */
function stopVdoStream() {
    if (hydraVdoNinja) {
        hydraVdoNinja.stopStreaming();
    }
}

/**
 * Get current streaming status
 */
function getVdoStatus() {
    return hydraVdoNinja ? {
        isStreaming: hydraVdoNinja.isStreaming,
        viewLink: hydraVdoNinja.getViewLink(),
        iframe: hydraVdoNinja.iframe
    } : null;
}

// Auto-initialize if Hydra is available
if (typeof window !== 'undefined' && hydra) {
    initVdoNinja();
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initVdoNinja,
        startVdoStream,
        stopVdoStream,
        getVdoStatus,
        HydraVdoNinja
    };
} else if (typeof define === 'function' && define.amd) {
    define([], () => ({
        initVdoNinja,
        startVdoStream,
        stopVdoStream,
        getVdoStatus,
        HydraVdoNinja
    }));
} else {
    window.initVdoNinja = initVdoNinja;
    window.startVdoStream = startVdoStream;
    window.stopVdoStream = stopVdoStream;
    window.getVdoStatus = getVdoStatus;
}

