export const buildMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Clean path to remove leading slashes if concatenated incorrectly
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Use /api as base since we updated axios proxy/base
    // BUT: /media/ is usually served by Django directly, often not under /api prefix depending on urls.py
    // If Django serves media at /media/, and frontend is proxied:
    // We need to know if we should prepend /api or just use relative root.
    // Standard Django setup: /media/ is root level.
    // Let's assume relative to root '/' works if proxy handles it or if it's mixed content.
    // If Vite proxy only handles /api, then we might need full URL or weird proxy rule.
    // Safest: Use direct /media path if in dev environment with proxy?
    // Actually, standard practice: return `/media/${cleanPath}` if it matches Django MEDIA_URL.
    // The input 'path' from serialiser usually is 'gallery/filename.jpg'.

    // Check if path already includes /media/
    if (path.includes('/media/')) return path;

    // Fallback: 
    return `/media${cleanPath}`;
};
