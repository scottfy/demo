/**
 * AI Cover Image Service for News Articles
 */

const PRESET_NEWS_IMAGES = [
  {
    category: '科技快訊',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    title: 'AI Quantum Tech & Digital Cyber'
  },
  {
    category: '財經趨勢',
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    title: 'Global Financial Markets & Economy'
  },
  {
    category: '國際焦點',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    title: 'Global Connectivity & Earth Science'
  },
  {
    category: '深度報導',
    url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    title: 'Press & Investigative Newsroom'
  },
  {
    category: '社會觀察',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    title: 'Metropolis Architecture & Society'
  }
];

/**
 * Generate matching news cover image URL based on article title/category
 */
export async function generateNewsCoverImage(topicKeyword = '', category = '科技快訊') {
  // Check category match
  const matched = PRESET_NEWS_IMAGES.find(img => img.category === category);
  let baseUrl = matched ? matched.url : PRESET_NEWS_IMAGES[0].url;

  // Append dynamic seed parameter for image variation
  const randomSeed = Math.floor(Math.random() * 1000);
  return `${baseUrl}&sig=${randomSeed}`;
}

/**
 * Generate a dynamic Canvas AI Poster Image Data URL
 */
export function generateCanvasCoverPoster(title = '新聞報導', category = '特快焦點') {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 1200, 630);
  grad.addColorStop(0, '#0a0f1d');
  grad.addColorStop(0.5, '#151d32');
  grad.addColorStop(1, '#08203e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // Glowing accents
  const glow = ctx.createRadialGradient(200, 150, 20, 200, 150, 400);
  glow.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 630);

  // Decorative cyber grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 630);
    ctx.stroke();
  }

  // Category Tag Box
  ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2;
  ctx.roundRect(80, 80, 160, 48, 8);
  ctx.fill();
  ctx.stroke();

  // Category Text
  ctx.fillStyle = '#00f2fe';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(category, 105, 112);

  // Main Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Noto Serif TC", Georgia, serif';

  // Wrap title text
  const words = title.split('');
  let line = '';
  let y = 220;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 1000 && n > 0) {
      ctx.fillText(line, 80, y);
      line = words[n];
      y += 60;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 80, y);

  // Footer Branding
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('⚡ AI NEWSROOM CO-PILOT COVER GENERATOR', 80, 560);

  return canvas.toDataURL('image/jpeg', 0.9);
}
