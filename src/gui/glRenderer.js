createNameSpace("realityEditor.gui.glRenderer");

(function(exports) {
    let workerIds = {};
    let nextWorkerId = 1;
    let toolIdToProxy = {};
    let proxies = [];

    const MAX_PROXIES = 10; // maximum number that can be safely rendered each frame

    /**
     * Mediator between the worker iframe and the gl implementation
     */
    class WorkerGLProxy {
        /**
         * @param {Element} worker - worker iframe
         * @param {WebGLContext} gl
         * @param {number|string} workerId - unique identifier of worker
         */
        constructor(worker, gl, workerId) {
            this.worker = worker;
            this.gl = gl;
            this.workerId = workerId;

            this.uncloneables = {};

            this.commandBuffer = [];
            this.buffering = false;

            this.onMessage = this.onMessage.bind(this);
            window.addEventListener('message', this.onMessage);

            this.frameEndListener = null;
        }

        onMessage(e) {
            const message = e.data;
            if (message.workerId !== this.workerId) {
                return;
            }

            if (this.frameEndListener && message.isFrameEnd) {
                this.frameEndListener();
                return;
            }

            if (this.buffering) {
                this.commandBuffer.push(message);
                return;
            }

            const res = this.executeCommand(message);

            this.worker.postMessage({
                id: message.id,
                result: res,
            }, '*');
        }

        executeCommand(message) {
            for (let i = 0; i < message.args.length; i++) {
                let arg = message.args[i];
                if (arg && arg.fakeClone) {
                    message.args[i] = this.uncloneables[arg.index];
                }
            }

            if (!this.gl[message.name]) {
                return;
            }

            const blacklist = {
                clear: true,
            };

            if (blacklist[message.name]) {
                return;
            }

            if (message.name === 'useProgram') {
                this.lastUseProgram = message;
            }

            let res = this.gl[message.name].apply(this.gl, message.args);
            if (typeof res === 'object') {
                this.uncloneables[message.id] = res;
                res = {fakeClone: true, index: message.id};
            }
            return res;
        }

        executeFrameCommands() {
            this.buffering = false;
            for (let message of this.commandBuffer) {
                this.executeCommand(message);
            }
            this.commandBuffer = [];
        }

        getFrameCommands() {
            this.buffering = true;
            if (this.lastUseProgram) {
                this.commandBuffer.push(this.lastUseProgram);
            }
            this.worker.postMessage({name: 'frame', time: Date.now()}, '*');
            return new Promise((res) => {
                this.frameEndListener = res;
            });
        }
    }
    
    let canvas;
    let gl;
    const functions = [];
    const constants = {};
    
    function initService() {
        // canvas = globalCanvas.canvas;
        canvas = document.querySelector('#glcanvas');
        gl = canvas.getContext('webgl');

        // const worker = document.getElementById('worker1').contentWindow;
        // const worker2 = document.getElementById('worker2').contentWindow;

        // If we don't have a GL context, give up now

        if (!gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        for (let key in gl) {
            switch (typeof gl[key]) {
                case 'function':
                    functions.push(key);
                    break;
                case 'number':
                    constants[key] = gl[key];
                    break;
            }
        }

        // let proxy = new WorkerGLProxy(worker, gl, 1);
        // let proxy2 = new WorkerGLProxy(worker2, gl, 2);

        // setTimeout(() => {
            // worker.postMessage({name: 'bootstrap', functions, constants}, '*');
            // worker2.postMessage({name: 'bootstrap', functions, constants}, '*');
            setTimeout(renderFrame, 500);
        // }, 200);

        realityEditor.device.registerCallback('vehicleDeleted', onVehicleDeleted);
    }

    /**
     * Returns n random elements from the array. Fast and non-destructive.
     * @author https://stackoverflow.com/a/19270021
     * @param {Array} arr
     * @param {number} n
     * @return {Array}
     */
    function getRandom(arr, n) {
        var result = new Array(n),
            len = arr.length,
            taken = new Array(len);
        if (n > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (n--) {
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    /**
     * If there are too many proxies, chooses a random subset of them
     * @return {Array}
     */
    function getSafeProxySubset() {
        if (proxies.length < MAX_PROXIES) {
            return proxies;
        } else {
            // choose 10 random elements from the proxies array
            return getRandom(proxies, MAX_PROXIES);
        }
    }

    async function renderFrame() {
        // let start = performance.now();
        let proxiesToBeRenderedThisFrame = getSafeProxySubset();

        // Get all the commands from the worker iframes
        // await Promise.all([
        //     proxy.getFrameCommands(),
        //     proxy2.getFrameCommands(),
        // ]);
        await Promise.all(proxiesToBeRenderedThisFrame.map(proxy => proxy.getFrameCommands()));

        gl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

        // Clear the canvas before we start drawing on it.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Execute all pending commands for this frame
        // proxies.forEach(proxy => proxy.executeFrameCommands());
        // proxy.executeFrameCommands();
        // proxy2.executeFrameCommands();

        proxiesToBeRenderedThisFrame.forEach(function(proxy) {
            proxy.executeFrameCommands();
        });

        // let end = performance.now();
        // console.log(end - start);
        
        // console.log('rendered ' + proxies.length + ' proxies');
        
        requestAnimationFrame(renderFrame);
    }
    
    function generateWorkerIdForTool(toolId) {
        // method 1 - generate randomly
        // workerIds[toolId] = realityEditor.utilities.randomIntInc(1, 65535);
        
        // method 2 - generate incrementally
        workerIds[toolId] = nextWorkerId;
        nextWorkerId += 1;
        return workerIds[toolId];
    }
    
    function addWebGlProxy(toolId) {
        const worker = globalDOMCache['iframe' + toolId].contentWindow;
        let proxy = new WorkerGLProxy(worker, gl, generateWorkerIdForTool(toolId));
        proxies.push(proxy);
        toolIdToProxy[toolId] = proxy;
        
        worker.postMessage(JSON.stringify({
            workerId: workerIds[toolId]
        }), '*');

        setTimeout(() => {
            worker.postMessage({name: 'bootstrap', functions, constants}, '*');
            // worker2.postMessage({name: 'bootstrap', functions, constants}, '*');
        }, 200);
    }

    function removeWebGlProxy(toolId) {
        let proxy = toolIdToProxy[toolId];
        let index = proxies.indexOf(proxy);
        if (index !== -1) {
            proxies.splice(index, 1);
        }
        delete workerIds[toolId];
        delete toolIdToProxy[toolId];
    }

    function onVehicleDeleted(params) {
        if (params.objectKey && params.frameKey && !params.nodeKey) { // only react to frames, not nodes
            if (typeof toolIdToProxy[params.frameKey] !== 'undefined') {
                removeWebGlProxy(params.frameKey);
            }
        }
    }

    exports.initService = initService;
    exports.addWebGlProxy = addWebGlProxy;
    exports.removeWebGlProxy = removeWebGlProxy;

})(realityEditor.gui.glRenderer);
