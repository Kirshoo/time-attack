function webgpu_fail() {
	console.error("[GOR] Need browser that supports WebGPU.");
}

function getQuad(checkpoint) {
	const half_left = checkpoint.right.neg().scale(checkpoint.width / 2);
	const full_up = checkpoint.up.scale(checkpoint.width);

	return [
		checkpoint.center.add(half_left), // bottom left
		checkpoint.center.sub(half_left), // bottom right
		checkpoint.center.sub(half_left).add(full_up), // top right
		checkpoint.center.add(half_left).add(full_up), // top left
	]
}

export class GateOverlayRender {
	constructor(overlay_canvas) {
		this.canvas = overlay_canvas;
	}

	static async create(overlay_canvas) {
		const renderer = new GateOverlayRender(overlay_canvas);
		await renderer.init();
		return renderer;
	}

	async init() {
		// Making sure that WebGPU is supported
		if (!navigator.gpu) {
			webgpu_fail();
			return;
		}

		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) {
			webgpu_fail();
			return;
		}
		this.adapter = adapter;

		this.device = await this.adapter.requestDevice();
		const prefered_format = navigator.gpu.getPreferredCanvasFormat();

		this.context = this.canvas.getContext("webgpu");
		this.context.configure({
			device: this.device,
			format: prefered_format,
			alphaMode: "premultiplied",
		});

		this.shader = this.create_shader(this.device);

		this.matrixBuffer = this.device.createBuffer({
			size: 128,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.vertexBuffer = this.device.createBuffer({
			size: 4 * 3 * 4, // 4 * float32x3
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});

		// Draw only one quad at the time
		const indexData = new Uint32Array([
			0, 1, 2,
			0, 2, 3,
		]);
		this.indexBuffer = this.device.createBuffer({
			size: indexData.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);

		this.layout = this.device.createBindGroupLayout({
			entries: [{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "uniform",
					minBindingSize: 128,
				},
			}],
		});

		this.bindGroup = this.device.createBindGroup({
			layout: this.layout,
			entries: [{
				binding: 0,
				resource: {
					buffer: this.matrixBuffer,
					offset: 0,
					size: 128,
				},
			}],
		});

		this.pipeline = this.create_pipeline(this.device, this.shader, prefered_format, this.layout);
	}

	render() {
		if (!this.canvas.isConnected) return;

		const commandEncoder = this.device.createCommandEncoder();
		const textureView = this.context.getCurrentTexture().createView();

		const renderPass = commandEncoder.beginRenderPass({
			colorAttachments: [{
				view: textureView,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 0,
				},
				loadOp: "clear",
				storeOp: "store",
			}],
		});

		if (this.drawGates) {
			renderPass.setPipeline(this.pipeline);
			renderPass.setBindGroup(0, this.bindGroup);

			renderPass.setVertexBuffer(0, this.vertexBuffer);
			renderPass.setIndexBuffer(this.indexBuffer, "uint32");

			renderPass.drawIndexed(6);
		}

		renderPass.end();

		this.device.queue.submit([commandEncoder.finish()]);
	}

	resize(reference_canvas) {
		this.canvas.width = reference_canvas.width;
		this.canvas.height = reference_canvas.height;
	}

	onCanvasRemoved(reference_id) {
		const reference_canvas = document.getElementById(reference_id);
		if (!reference_canvas) return;

		reference_canvas.parentElement.appendChild(this.canvas);
		console.info("Overlay reattached");
	}

	create_pipeline(device, shader, format, bindLayout) {
		return device.createRenderPipeline({
			label: "Time Attack checkpoint pipeline",
			layout: device.createPipelineLayout({
				bindGroupLayouts: [bindLayout],
			}),
			vertex: {
				module: shader,
				buffers: [{
					arrayStride: 3 * 4,
					attributes: [{
						shaderLocation: 0,
						offset: 0,
						format: "float32x3",
					}],
				}],
			},
			fragment: {
				module: shader,
				targets: [{ 
					format,
					blend: {
						color: {
							operation: "add",
							srcFactor: "src-alpha",
							dstFactor: "one-minus-src-alpha",
						},
						alpha: {
							operation: "add",
							srcFactor: "one",
							dstFactor: "one-minus-src-alpha",
						},
					},
				}],
			},
			primitive: {
				topology: "triangle-list",
				cullMode: "none",
			},
			depthStencil: undefined,
		});
	}

	create_shader(device) {
		return device.createShaderModule({
			label: "Time Attack checkpoint overlay shader",
			code: /* wgsl */ `
				struct GlobalUniformBinder {
					view : mat4x4<f32>,
					proj : mat4x4<f32>,
				}

				@group(0) @binding(0)
				var<uniform> gubo: GlobalUniformBinder;

				@vertex
				fn vs(
					@location(0) position: vec3<f32>
				) -> @builtin(position) vec4<f32> {
					return gubo.proj * gubo.view * vec4<f32>(position, 1.0);
				}

				@fragment
				fn fs() -> @location(0) vec4<f32> {
					return vec4<f32>(0.1, 0.8, 0.2, 0.5);
				}
			`,
		});
	}

	updateMatrices(view, projection) {
		const data = new Float32Array(32);

		data.set(view, 0);
		data.set(projection, 16);

		this.device.queue.writeBuffer(this.matrixBuffer, 0, data);
	}

	updateCheckpoint(checkpoint) {
		const vertices = getQuad(checkpoint);

		const data = new Float32Array(
			vertices.flatMap(v => [v[0], v[1], v[2]])
		);

		this.device.queue.writeBuffer(this.vertexBuffer, 0, data);
	}
}

// Takes in game's canvas as reference point
export async function createUiOverlay(canvas) {
	const overlay = document.createElement("canvas");

	// Place overlay ontop of the original canvas
	overlay.width = canvas.width;
	overlay.height = canvas.height;

	overlay.style.position = "absolute";
	overlay.style.top = "0";
	overlay.style.left = "0";
	overlay.style.width = "100%";
	overlay.style.height = "100%";
	overlay.style.pointerEvents = "none";

	canvas.parentElement.appendChild(overlay);

	return await GateOverlayRender.create(overlay);
}

