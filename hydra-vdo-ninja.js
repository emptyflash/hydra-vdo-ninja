(async () => {
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

  function hideElement(el) {
    el.style.border = "none"
    el.style.position = "absolute"
    el.style.top = "0"
    el.style.left = "0"
    el.style.visibility = "hidden"
  }

  function waitForEl(root, selector) {
    return new Promise(resolve => {
      if (root.querySelector(selector)) {
        return resolve(root.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (root.querySelector(selector)) {
          observer.disconnect();
          resolve(root.querySelector(selector));
        }
      });

      observer.observe(root.body, {
        childList: true,
        subtree: true
      });
    });
  }

  window.vdoOutputs = window.vdoOutputs || {}
  window.vdoSources = window.vdoSources || {}

  async function setVdoOutput(roomName) {
    let iframe
    if (window.vdoOutputs[roomName]) {
      iframe = window.vdoOutputs[roomName]
    } else {
      iframe = document.createElement("iframe");
      const roomLink = `https://local.emptyfla.sh/vdo.ninja/?room=${roomName}&framegrab`
      iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;";
      iframe.src = roomLink;
      iframe.width = 0
      iframe.height = 0
      window.vdoOutputs[roomName] = iframe
    }
    document.body.appendChild(iframe)

    const stream = hydra.canvas.captureStream(60);
    const tracks = stream.getVideoTracks();
    await Promise.all(tracks.map(async track => {
      const processor = new MediaStreamTrackProcessor(track);
      const reader = processor.readable.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (value) value.close();
          break;
        }

        try {
          window.vdoOutputs[roomName].contentWindow.postMessage({
            type: 'canvas-frame',
            frame: value
          }, '*');
        } finally {
          value.close();
        }
      }
    }));
  }

  function initVdoStream(roomName, params) {
    const self = this;
    return new Promise((resolve) => {
      let iframe
      if (window.vdoSources[roomName]) {
        iframe = window.vdoSources[roomName]
      } else {
        iframe = document.createElement("iframe");
        const roomLink = `https://local.emptyfla.sh/vdo.ninja/?room=${roomName}&cleanoutput&solo&&noaudio`
        iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;cross-origin-isolated;";
        iframe.src = roomLink;
        iframe.width = hydra.canvas.width
        iframe.height = hydra.canvas.height
        window.vdoSources[roomName] = iframe
      }
      document.body.appendChild(iframe)

      function initSource(src) {
        self.src = src
        self.dynamic = true
        self.tex = self.regl.texture({ data: self.src, ...params})
      }

      window.addEventListener("message", function (e) {
        if (e.source != iframe.contentWindow) return;
        if ("action" in e.data) {
          if (e.data.action === "video-element-created") {
            console.log(e.data)
            if (iframe.contentDocument) {
              waitForEl(iframe.contentDocument, "video").then((video) => {
                if (!video.paused) {
                  initSource(video)
                  hideElement(iframe)
                  resolve();
                }
                video.addEventListener("playing", function() {
                  initSource(video)
                  hideElement(iframe)
                  resolve();
                }, true);
              });
            }
          }
        }
      });
    });
  }

  hydra.s.forEach((source) => source.initVdoStream = initVdoStream.bind(source));

  window.setVdoOutput = setVdoOutput
})()
