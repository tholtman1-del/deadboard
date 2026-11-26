// What a visitor can do when the bench can't start: the app draws with WebGPU, or WebGL2 when
// WebGPU is missing (src/render/renderer.ts), so this screen means WebGL2 failed too. Two causes:
//  - no WebGL at all: the browser isn't using the graphics card for web pages (hardware
//    acceleration off, or the GPU / driver is on the browser's blocklist);
//  - WebGL, but WebGL2 wouldn't start: an old browser or driver.
// Tuned to the browser from its user agent; pure, so test/touch.test.ts checks it on real reports.
import { t } from '../i18n';
import type { WebGlInfo } from '../render/gpuprobe';

export function gpuHelp(ua: string, gl: WebGlInfo | null, maxTouchPoints = 0): string {
  // desktop build: the browser is built in, so only the GPU driver can be the problem
  if (/Electron\//.test(ua)) {
    if (/Linux/.test(ua)) return t('The desktop app renders with WebGPU on Vulkan. Install or update the Vulkan driver for your graphics card (vulkaninfo should list it), then restart DEADBOARD.');
    return t('The desktop app renders with WebGPU, which needs a graphics card and driver that support DirectX 12 (Windows) or Metal (macOS). Update the graphics driver and restart DEADBOARD.');
  }
  if (gl) return t('Your browser has WebGL ({renderer}), but WebGL2, which DEADBOARD needs, would not start. Update the browser and the graphics driver, then reload.', { renderer: gl.renderer });
  const ff = /Firefox\//.test(ua);
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)) {
    return t('Safari could not start 3D graphics. Update iOS (Settings → General → Software Update), close some tabs and reload; if it still fails, restart the device.');
  }
  if (/Android/.test(ua)) {
    return ff
      ? t('Firefox could not start 3D graphics on this phone: open DEADBOARD in Chrome.')
      : t('Your browser could not start 3D graphics. Update Chrome and «Android System WebView» from the Play Store, restart the phone and try again.');
  }
  if (ff) return t('Firefox is not giving web pages any 3D graphics (neither WebGPU nor WebGL). WebGL may be switched off: open about:config and set webgl.disabled to false (LibreWolf: Settings → LibreWolf → «Enable WebGL»; privacy-hardened Firefox and Mullvad Browser turn it off too). Otherwise, in Settings → Performance, untick «Use recommended performance settings», tick «Use hardware acceleration when available», and restart Firefox. about:support → Graphics says why WebGL is blocked.');
  if (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return t('Safari could not start 3D graphics. Update macOS, or open DEADBOARD in Chrome or Firefox.');
  return t('Your browser is not giving web pages any 3D graphics (neither WebGPU nor WebGL). Turn on «Use graphics acceleration when available» (Chrome / Edge: Settings → System) and restart the browser. If it is on already, open chrome://gpu: if WebGL says «Disabled», your graphics card or driver is on the browser\'s blocklist. Update the driver, or as a last resort enable «Override software rendering list» in chrome://flags.');
}
