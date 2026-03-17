export default async (request: Request) => {
  const country = request.headers.get('cf-ipcountry') || 'XX';
  
  return new Response(JSON.stringify({ 
    country,
    source: 'edge'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

export const config = {
  path: '/.netlify/edge-functions/geolocation'
};
