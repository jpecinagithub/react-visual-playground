declare module 'lz-string' {
  export function compressToEncodedURIComponent(input: string): string;
  export function decompressFromEncodedURIComponent(input: string): string | null;
  export function compressToBase64(input: string): string;
  export function decompressFromBase64(input: string): string | null;
  const _default: {
    compressToEncodedURIComponent: typeof compressToEncodedURIComponent;
    decompressFromEncodedURIComponent: typeof decompressFromEncodedURIComponent;
  };
  export default _default;
}
