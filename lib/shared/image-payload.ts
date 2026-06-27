export async function fileToBase64Payload(
  file: File
): Promise<{ image: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return {
    image: btoa(binary),
    mimeType: file.type,
  };
}
