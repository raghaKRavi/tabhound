import type { BackgroundResponse, ErrorResponse, PopupToBackground } from '@/lib/messaging';

/** Sends a request to the background and resolves with its response; rejects on errors. */
export function send<T extends BackgroundResponse>(msg: PopupToBackground): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else if ((res as BackgroundResponse | undefined)?.type === 'error') {
        reject(new Error((res as ErrorResponse).message));
      } else resolve(res as T);
    });
  });
}
