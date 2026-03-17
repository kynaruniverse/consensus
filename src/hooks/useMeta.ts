const SITE_URL = 'https://spitfact.netlify.app';
const SITE_NAME = 'Spitfact';
const DEFAULT_DESC = 'Vote on anything. See live results from around the planet.';
const DEFAULT_IMG = SITE_URL + '/og-default.png';

export function useMeta() {
  const setPageMeta = ({
    title,
    description,
    url,
    image
  }: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
  } = {}) => {
    const t = title || SITE_NAME + ' — The World\'s Opinion, Live';
    const d = description || DEFAULT_DESC;
    const u = url || SITE_URL + '/';
    const img = image || DEFAULT_IMG;

    document.title = t;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', d);
    setMeta('meta[property="og:title"]', 'content', t);
    setMeta('meta[property="og:description"]', 'content', d);
    setMeta('meta[property="og:url"]', 'content', u);
    setMeta('meta[property="og:image"]', 'content', img);
    setMeta('meta[name="twitter:title"]', 'content', t);
    setMeta('meta[name="twitter:description"]', 'content', d);
    setMeta('meta[name="twitter:image"]', 'content', img);

    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.rel = 'canonical';
      document.head.appendChild(canon);
    }
    canon.setAttribute('href', u);
  };

  return { setPageMeta };
}
