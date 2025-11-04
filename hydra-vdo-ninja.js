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

  function initVdoStream(roomName, params) {
    const self = this;
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      const roomLink = `https://vdo.ninja/?room=${roomName}&cleanoutput&solo&sendframes`
      iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;";
      iframe.src = roomLink;
      console.log(roomLink);
      iframe.width = hydra.canvas.width
      iframe.height = hydra.canvas.height
      /*
      iframe.style.border = "none"
      iframe.style.position = "absolute"
      iframe.style.left = "-9999px"
      */
      document.body.appendChild(iframe)

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = hydra.canvas.width;
      canvas.height = hydra.canvas.height;
      console.log(hydra)
      document.body.appendChild(canvas)

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

      window.addEventListener("message", function (e) {
        if (e.source != iframe.contentWindow) return;
        if ("action" in e.data) {
          //console.log(e.data.action, e.data)
          if (e.data.action === "video-element-created") {
            self.src = canvas;
            self.dynamic = true
            self.tex = self.regl.texture({ data: self.src, ...params})
            streams.push(e.data.streamID);
            requestVideoFrame()
            resolve();
          } else if (e.data.action === "image-frame-capture") {
            const imageData = e.data.value.imageData
            if (imageData) {
              const img = new Image();
              img.src = URL.createObjectURL(imageData);
              img.onload = () => {
                ctx.drawImage(img, 0, 0)
                URL.revokeObjectURL(img.src);
              };
            }
            requestAnimationFrame(requestVideoFrame)
          }
        }
      });
    });
  }

  hydra.s.forEach((source) => source.initVdoStream = initVdoStream.bind(source));

  await hydra.s[0].initVdoStream("emptyflash_test");

  hydra.synth.src(s0).diff(osc()).out()
})()
