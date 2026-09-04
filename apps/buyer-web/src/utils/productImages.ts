export function getProductImage(productName: string, query = '', customImage?: string): string {
  if (customImage && customImage.startsWith('http') && !customImage.includes('photo-1524805444758-089113d48a6d')) {
    return customImage;
  }

  const text = (productName + ' ' + query).toLowerCase();

  if (/milk|dairy|amul|akshayakalpa|curd|paneer|butter|cheese/.test(text)) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80';
  }

  if (/headphone|earphone|airpod|earbud|audio|speaker|headset|soundbar/.test(text)) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80';
  }

  if (/shoe|shoes|sneaker|sneakers|running|footwear|adidas|nike|puma|asics/.test(text)) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
  }

  if (/watch|watches|smartwatch|chronograph|titan|fossil|rolex|casio/.test(text)) {
    return 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80';
  }

  if (/phone|mobile|smartphone|iphone|galaxy|pixel|oneplus/.test(text)) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80';
  }

  if (/laptop|macbook|computer|notebook/.test(text)) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80';
  }

  if (/rose|flower|flowers|bouquet|plant|plants/.test(text)) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80';
  }

  if (/mug|cup|coffee|tea|bottle/.test(text)) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80';
}
