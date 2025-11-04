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

