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

  function initVdoStream(roomName, params) {
    const self = this;
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      // TODO: figure out how to host this with the right headers
      const roomLink = `https://local.emptyfla.sh/vdo.ninja/?room=${roomName}&cleanoutput&solo&&noaudio`
      iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;";
      iframe.src = roomLink;
      iframe.width = hydra.canvas.width
      iframe.height = hydra.canvas.height
      iframe.style.border = "none"
      iframe.style.position = "absolute"
      iframe.style.top = "0"
      iframe.style.left = "0"
      iframe.style.visibility = "hidden"
      document.body.appendChild(iframe)

      window.addEventListener("message", function (e) {
        if (e.source != iframe.contentWindow) return;
        if ("action" in e.data) {
          console.log(e.data.action, e.data)
          if (e.data.action === "video-element-created") {
            waitForEl(iframe.contentDocument, "video").then((video) => {
              video.addEventListener("playing", function() {
                self.src = video
                self.dynamic = true
                self.tex = self.regl.texture({ data: self.src, ...params})
                resolve();
              }, true);
            });
          }
        }
      });
    });
  }

  hydra.s.forEach((source) => source.initVdoStream = initVdoStream.bind(source));
})()
