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

  async function setVdoOutput(roomName) {
    const iframe = document.createElement("iframe");
    const roomLink = `https://local.emptyfla.sh/vdo.ninja/?room=${roomName}&framegrab`
    iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;";
    iframe.src = roomLink;
    iframe.width = 0
    iframe.height = 0
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
          iframe.contentWindow.postMessage({
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
      const iframe = document.createElement("iframe");
      const roomLink = `https://local.emptyfla.sh/vdo.ninja/?room=${roomName}&cleanoutput&solo&&noaudio`
      iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;cross-origin-isolated;";
      iframe.src = roomLink;
      iframe.width = hydra.canvas.width
      iframe.height = hydra.canvas.height
      document.body.appendChild(iframe)

      const streams = [];

      function requestVideoFrame() {
        streams.forEach((streamID) => {
          iframe.contentWindow.postMessage({ 
              streamID,
              getVideoFrame: true,
              cib: "video-frame"
          }, "*");
        });
      }

      let canvas
      let ctx

      function initSource(src) {
        self.src = src
        self.dynamic = true
        self.tex = self.regl.texture({ data: self.src, ...params})
      }

      window.addEventListener("message", function (e) {
        if (e.source != iframe.contentWindow) return;
        if ("action" in e.data) {
          if (e.data.action === "video-element-created") {
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
            } else {
              // We are cross origin so fallback to requesting frames
              iframe.allow = iframe.allow + 'sendframes=*';
              canvas = document.createElement("canvas");
              ctx = canvas.getContext("2d");
              canvas.width = hydra.canvas.width;
              canvas.height = hydra.canvas.height;
              document.body.appendChild(canvas)
              initSource(canvas);
              streams.push(e.data.streamID);
              //requestVideoFrame()
            }
          }
        }
        if (e.data.type === "frame") {
          console.log(e.data)
            const frame = e.data.frame
            if (frame && ctx) {
              hideElement(iframe)
              hideElement(canvas)
              ctx.drawImage(frame, 0, 0)
              frame.close()
              /* TODO: handle image stream fallback (maybe not worth it)
               * TODO: also make a minimal reproduction of chrome bug and file
              const img = new Image();
              img.src = imageData;
              img.onload = () => {
                ctx.drawImage(img, 0, 0)
                URL.revokeObjectURL(img.src);
              };
              */
            }
            //requestAnimationFrame(requestVideoFrame)
          }
        });
    });
  }

  hydra.s.forEach((source) => source.initVdoStream = initVdoStream.bind(source));

  window.setVdoOutput = setVdoOutput
})()
