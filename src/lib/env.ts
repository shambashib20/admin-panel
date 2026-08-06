export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://192.168.0.200:8080/api/v1'

// ImageKit publicKey/urlEndpoint safe hain client-side expose karne ke liye
// (sirf privateKey secret hai, woh backend pe hi rehta hai — upload token
// backend se signed milta hai, see /admin/upload-token)
export const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY ?? ''
export const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? ''
