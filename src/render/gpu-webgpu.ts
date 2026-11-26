// WebGPU backend: MSAA ×4 render pass with four pipelines (see backend.ts).
import { tk } from '../i18n';
import { CLEAR_RGB, GLOW_FLOATS, INSTANCE_FLOATS, ZONE_FLOATS, type Frame, type GpuBackend } from './backend';
import { GPU_REQUEST_TIMEOUT_MS, NoAdapterError, requestAnyAdapter, withTimeout } from './gpuprobe';
import type { PackedMeshes } from './meshes';
import { GLOW_WGSL, SOLID_WGSL, ZONE_WGSL } from './shaders';

// A function, not a constant: GPUBufferUsage only exists where WebGPU does, and this module is
// imported everywhere (renderer.ts picks the backend at run time, falling back to WebGL2).
const vertexUsage = (): number => GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

export class WebGPUBackend implements GpuBackend {
  description = 'WebGPU';
  private format!: GPUTextureFormat;
  private vbo!: GPUBuffer;
  private ibo!: GPUBuffer;
  private uniformBuf!: GPUBuffer;
  private bindGroup!: GPUBindGroup;
  private instanceBuf!: GPUBuffer;
  private instanceCap = 1024;
  private zoneBuf!: GPUBuffer;
  private zoneCap = 1024;
  private glowBuf!: GPUBuffer;
  private glowCap = 128;
  private solidOpaque!: GPURenderPipeline;
  private solidAlpha!: GPURenderPipeline;
  private zonePipe!: GPURenderPipeline;
  private glowPipe!: GPURenderPipeline;
  private msaaTex: GPUTexture | null = null;
  private depthTex: GPUTexture | null = null;
  private texW = 0;
  private texH = 0;

  private ctx!: GPUCanvasContext;

  private constructor(private device: GPUDevice) {}

  /**
   * `allowFallback`: also accept the browser's software adapter. The caller says no while a
   * hardware WebGL2 is still available, which draws faster than WebGPU in software.
   */
  static async create(canvas: HTMLCanvasElement, meshes: PackedMeshes, allowFallback = true): Promise<WebGPUBackend> {
    if (!navigator.gpu) throw new Error(tk('WebGPU is not supported in this browser.'));
    const { adapter, via, tried } = await requestAnyAdapter(allowFallback);
    if (!adapter) throw new NoAdapterError(tk('Could not acquire a WebGPU adapter.'), tried);
    const device = await withTimeout(adapter.requestDevice(), GPU_REQUEST_TIMEOUT_MS, 'requestDevice');
    const b = new WebGPUBackend(device);
    const info = adapter.info;
    const gpu = info ? [info.vendor, info.architecture, info.device, info.description].filter(Boolean).join(' / ') || 'unknown' : 'unknown';
    b.description = `${gpu}${via !== 'high-performance' ? ` (${via} adapter; ${tried.join(', ')})` : ''}`;
    b.format = navigator.gpu.getPreferredCanvasFormat();
    // Buffers and pipelines first, checked, and only then the canvas: once a canvas has a 'webgpu'
    // context it can never give a WebGL2 one, so a GPU that can't build the pipelines (a weak
    // integrated card, an old driver) must fail here, while the WebGL2 fallback can still start.
    device.pushErrorScope('out-of-memory');
    device.pushErrorScope('validation');
    try {
      b.init(meshes);
    } finally {
      const [validation, oom] = await Promise.all([device.popErrorScope(), device.popErrorScope()]);
      const err = validation ?? oom;
      if (err) { device.destroy(); throw new Error(`WebGPU setup failed: ${err.message}`); }
    }
    const ctx = canvas.getContext('webgpu');
    if (!ctx) { device.destroy(); throw new Error(tk('Could not create a WebGPU canvas context.')); }
    ctx.configure({ device, format: b.format, alphaMode: 'premultiplied' });
    b.ctx = ctx;
    return b;
  }

  private init(meshes: PackedMeshes) {
    const d = this.device;
    this.vbo = d.createBuffer({ size: meshes.vertices.byteLength, usage: vertexUsage() });
    d.queue.writeBuffer(this.vbo, 0, meshes.vertices.buffer);
    this.ibo = d.createBuffer({ size: meshes.indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
    d.queue.writeBuffer(this.ibo, 0, meshes.indices.buffer);

    this.uniformBuf = d.createBuffer({ size: 24 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.instanceBuf = d.createBuffer({ size: this.instanceCap * INSTANCE_FLOATS * 4, usage: vertexUsage() });
    this.zoneBuf = d.createBuffer({ size: this.zoneCap * ZONE_FLOATS * 4, usage: vertexUsage() });
    this.glowBuf = d.createBuffer({ size: this.glowCap * GLOW_FLOATS * 4, usage: vertexUsage() });

    const bgl = d.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }],
    });
    this.bindGroup = d.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: this.uniformBuf } }] });
    const layout = d.createPipelineLayout({ bindGroupLayouts: [bgl] });
    const over: GPUBlendState = {
      color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    };

    const solidMod = d.createShaderModule({ code: SOLID_WGSL });
    const solidVertexBuffers: GPUVertexBufferLayout[] = [
      {
        arrayStride: 6 * 4,
        stepMode: 'vertex',
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' },
          { shaderLocation: 1, offset: 12, format: 'float32x3' },
        ],
      },
      {
        arrayStride: INSTANCE_FLOATS * 4,
        stepMode: 'instance',
        attributes: [0, 1, 2, 3, 4, 5].map((i) => ({ shaderLocation: 2 + i, offset: 16 * i, format: 'float32x4' as GPUVertexFormat })),
      },
    ];

    this.solidOpaque = d.createRenderPipeline({
      layout,
      vertex: { module: solidMod, entryPoint: 'vs_main', buffers: solidVertexBuffers },
      fragment: { module: solidMod, entryPoint: 'fs_main', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list', cullMode: 'back' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
      multisample: { count: 4 },
    });

    this.solidAlpha = d.createRenderPipeline({
      layout,
      vertex: { module: solidMod, entryPoint: 'vs_main', buffers: solidVertexBuffers },
      fragment: { module: solidMod, entryPoint: 'fs_main', targets: [{ format: this.format, blend: over }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less' },
      multisample: { count: 4 },
    });

    const zoneMod = d.createShaderModule({ code: ZONE_WGSL });
    this.zonePipe = d.createRenderPipeline({
      layout,
      vertex: {
        module: zoneMod,
        entryPoint: 'vs_zone',
        buffers: [{
          arrayStride: ZONE_FLOATS * 4,
          stepMode: 'vertex',
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x4' },
          ],
        }],
      },
      fragment: { module: zoneMod, entryPoint: 'fs_zone', targets: [{ format: this.format, blend: over }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
      multisample: { count: 4 },
    });

    const glowMod = d.createShaderModule({ code: GLOW_WGSL });
    this.glowPipe = d.createRenderPipeline({
      layout,
      vertex: {
        module: glowMod,
        entryPoint: 'vs_glow',
        buffers: [{
          arrayStride: GLOW_FLOATS * 4,
          stepMode: 'instance',
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x4' },
            { shaderLocation: 1, offset: 16, format: 'float32x4' },
          ],
        }],
      },
      fragment: {
        module: glowMod,
        entryPoint: 'fs_glow',
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less-equal' },
      multisample: { count: 4 },
    });
  }

  private ensureAttachments(w: number, h: number) {
    if (this.texW === w && this.texH === h && this.msaaTex && this.depthTex) return;
    this.msaaTex?.destroy();
    this.depthTex?.destroy();
    this.texW = w;
    this.texH = h;
    this.msaaTex = this.device.createTexture({ size: [w, h], sampleCount: 4, format: this.format, usage: GPUTextureUsage.RENDER_ATTACHMENT });
    this.depthTex = this.device.createTexture({ size: [w, h], sampleCount: 4, format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT });
  }

  draw(f: Frame) {
    const d = this.device;
    this.ensureAttachments(f.width, f.height);
    d.queue.writeBuffer(this.uniformBuf, 0, f.uniforms.buffer, f.uniforms.byteOffset, f.uniforms.byteLength);

    let total = 0;
    for (const dr of f.draws) total += dr.count;
    if (total > this.instanceCap) {
      this.instanceCap = Math.max(this.instanceCap * 2, total);
      this.instanceBuf.destroy();
      this.instanceBuf = d.createBuffer({ size: this.instanceCap * INSTANCE_FLOATS * 4, usage: vertexUsage() });
    }
    const first: number[] = [];
    let at = 0;
    for (const dr of f.draws) {
      d.queue.writeBuffer(this.instanceBuf, at * INSTANCE_FLOATS * 4, dr.data.buffer, 0, dr.count * INSTANCE_FLOATS * 4);
      first.push(at);
      at += dr.count;
    }

    if (f.zoneVerts > this.zoneCap) {
      this.zoneCap = Math.max(this.zoneCap * 2, f.zoneVerts);
      this.zoneBuf.destroy();
      this.zoneBuf = d.createBuffer({ size: this.zoneCap * ZONE_FLOATS * 4, usage: vertexUsage() });
    }
    if (f.zoneVerts > 0) d.queue.writeBuffer(this.zoneBuf, 0, f.zones.buffer, 0, f.zoneVerts * ZONE_FLOATS * 4);

    if (f.glowCount > this.glowCap) {
      this.glowCap = Math.max(this.glowCap * 2, f.glowCount);
      this.glowBuf.destroy();
      this.glowBuf = d.createBuffer({ size: this.glowCap * GLOW_FLOATS * 4, usage: vertexUsage() });
    }
    if (f.glowCount > 0) d.queue.writeBuffer(this.glowBuf, 0, f.glow.buffer, 0, f.glowCount * GLOW_FLOATS * 4);

    const enc = d.createCommandEncoder();
    const pass = enc.beginRenderPass({
      colorAttachments: [{
        view: this.msaaTex!.createView(),
        resolveTarget: this.ctx.getCurrentTexture().createView(),
        clearValue: { r: CLEAR_RGB[0], g: CLEAR_RGB[1], b: CLEAR_RGB[2], a: 1.0 },
        loadOp: 'clear',
        storeOp: 'discard',
      }],
      depthStencilAttachment: { view: this.depthTex!.createView(), depthClearValue: 1.0, depthLoadOp: 'clear', depthStoreOp: 'store' },
    });
    pass.setBindGroup(0, this.bindGroup);

    const meshes = (which: 'opaque' | 'alpha', pipe: GPURenderPipeline) => {
      pass.setPipeline(pipe);
      pass.setVertexBuffer(0, this.vbo);
      pass.setVertexBuffer(1, this.instanceBuf);
      pass.setIndexBuffer(this.ibo, 'uint32');
      f.draws.forEach((dr, i) => {
        if (dr.pass === which) pass.drawIndexed(dr.slice.indexCount, dr.count, dr.slice.indexOffset, 0, first[i]);
      });
    };
    // 1. opaque meshes, 2. copper zones, 3. translucent meshes (LED epoxy, fuse glass, ghosts,
    // x-ray substrate), 4. additive glow (lit LEDs, probes, overloads, smoke)
    meshes('opaque', this.solidOpaque);
    if (f.zoneVerts > 0) {
      pass.setPipeline(this.zonePipe);
      pass.setVertexBuffer(0, this.zoneBuf);
      pass.draw(f.zoneVerts);
    }
    meshes('alpha', this.solidAlpha);
    if (f.glowCount > 0) {
      pass.setPipeline(this.glowPipe);
      pass.setVertexBuffer(0, this.glowBuf);
      pass.draw(6, f.glowCount, 0, 0);
    }
    pass.end();
    d.queue.submit([enc.finish()]);
  }

  destroy() {
    for (const x of [this.msaaTex, this.depthTex, this.vbo, this.ibo, this.uniformBuf, this.instanceBuf, this.zoneBuf, this.glowBuf]) x?.destroy();
  }
}
