/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module 'bootstrap-icons/icons/*' {
  const src: string;
  export default src;
}
