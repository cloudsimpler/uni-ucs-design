const httpUrl = value => /^https?:\/\/[^\s<>]+$/i.test(value || '');
export const isCloudFile = value => /^cloud:\/\/[^\s<>]+$/i.test(value || '');
export const isStorageFile = value => httpUrl(value) || isCloudFile(value);

// Persist file IDs, never temporary URLs. Limit each request for Tencent/Alipay storage.
export async function resolveFileUrls(files, storage) {
  const ids = [...new Set(files.filter(isCloudFile))];
  const urls = new Map(files.filter(httpUrl).map(url => [url, url]));
  for (let offset = 0; offset < ids.length; offset += 50) {
    const batch = ids.slice(offset, offset + 50);
    try {
      const result = await storage.getTempFileURL({ fileList: batch });
      for (const item of result.fileList || []) {
        if (batch.includes(item.fileID) && httpUrl(item.tempFileURL)) urls.set(item.fileID, item.tempFileURL);
      }
    } catch { /* A failed image batch must not prevent other records from rendering. */ }
  }
  return urls;
}

export async function resolveFileUrl(file, storage) {
  const url = (await resolveFileUrls([file], storage)).get(file);
  if (!url) throw new Error('文件访问地址获取失败，请重试');
  return url;
}
