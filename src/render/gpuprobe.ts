// Getting a WebGPU adapter on as many machines as possible, and saying why when there is none.
//
// Chrome returns no adapter for a given powerPreference when that GPU is blocklisted or its driver
// is too old, while another request (default, low-power, or the software fallback adapter) can
// still succeed. When every request fails, the WebGL renderer string tells the bug report which
// GPU and driver the browser sees, and whether it is drawing in software at all (hardware
// acceleration switched off, or no working driver).

type Attempt = { label: string; opts?: GPURequestAdapterOptions };
const ATTEMPTS: Attempt[] = [
  { label: 'high-performance', opts: { powerPreference: 'high-performance' } },
  { label: 'default' },
  { label: 'low-power', opts: { powerPreference: 'low-power' } },
  { label: 'fallback', opts: { forceFallbackAdapter: true } },
];

export interface AdapterResult { adapter: GPUAdapter | null; via?: string; tried: string[] }

/**
 * How long one WebGPU request may take. Some GPU setups never answer requestAdapter() /
 * requestDevice() (Chrome on some Android and Linux drivers); without a limit the bench would wait
 * forever on an empty screen instead of starting on WebGL2.
 */
export const GPU_REQUEST_TIMEOUT_MS = 5000;

export class GpuTimeoutError extends Error {}

/** `p`, or a GpuTimeoutError after `ms`. */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new GpuTimeoutError(`${what} timed out after ${ms / 1000} s`)), ms);
    p.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

/**
 * First adapter any request gives; `tried` records each failed attempt for the bug report.
 * Without `allowFallback` the software adapter is not asked for.
 */
export async function requestAnyAdapter(allowFallback = true): Promise<AdapterResult> {
  const tried: string[] = [];
  if (!navigator.gpu) return { adapter: null, tried };
  for (const a of ATTEMPTS) {
    if (a.label === 'fallback' && !allowFallback) continue;
    try {
      const adapter = await withTimeout(navigator.gpu.requestAdapter(a.opts), GPU_REQUEST_TIMEOUT_MS, 'requestAdapter');
      if (adapter) return { adapter, via: a.label, tried };
      tried.push(`${a.label}: null`);
    } catch (e) {
      tried.push(`${a.label}: ${e instanceof Error ? e.message : String(e)}`);
      if (e instanceof GpuTimeoutError) break; // a GPU that does not answer won't answer the next request either
    }
  }
  return { adapter: null, tried };
}

/** Renderer names that mean the browser draws without the graphics card. */
const SOFTWARE = /SwiftShader|Basic Render Driver|llvmpipe|softpipe|Software/i;

export interface WebGlInfo { renderer: string; software: boolean }

/** What WebGL reports for the GPU (unmasked where the browser allows it); null without WebGL. */
export function webGlInfo(): WebGlInfo | null {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? 'unknown');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { renderer, software: SOFTWARE.test(renderer) };
  } catch {
    return null;
  }
}

/** One line for the bug report from the WebGPU error screen. `webgl2`: why the fallback failed. */
export function gpuDiagnosis(tried: string[], gl: WebGlInfo | null, webgl2: string | null = null): string {
  return [
    `navigator.gpu: ${'gpu' in navigator ? 'yes' : 'no'}`,
    tried.length ? `adapter tries: ${tried.join(', ')}` : '',
    gl ? `WebGL: ${gl.renderer}${gl.software ? ' (software)' : ''}` : 'WebGL: none',
    webgl2 ? `WebGL2 fallback: ${webgl2}` : '',
    isSecureContext ? '' : 'insecure context',
  ].filter(Boolean).join('; ');
}

/**
 * Thrown when neither WebGPU nor the WebGL2 fallback started: the WebGPU error is the message (the
 * error screen explains that one), the fallback's own error goes into the bug report.
 */
export class NoRendererError extends Error {
  constructor(readonly gpu: unknown, readonly webgl2: string | null) {
    super(gpu instanceof Error ? gpu.message : gpu ? String(gpu) : webgl2 ?? 'no renderer');
  }
  /** Adapter requests that came back empty (none when WebGPU failed later or was skipped). */
  get tried(): string[] { return this.gpu instanceof NoAdapterError ? this.gpu.tried : []; }
  get noAdapter(): boolean { return this.gpu instanceof NoAdapterError; }
}

/** Thrown when no request gave an adapter; carries the attempts for the report. */
export class NoAdapterError extends Error {
  constructor(message: string, readonly tried: string[]) { super(message); }
}
