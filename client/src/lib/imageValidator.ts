/**
 * AgriSathi Image Validation & Botanical Pre-Analysis Engine
 * 
 * Specifically differentiates plant leaves vs. crop seeds vs. non-agricultural photos
 * on the client-side canvas before or during server dispatch.
 */

export interface ImageAnalysisMetrics {
  isLeafCandidate: boolean;
  isSeedCandidate: boolean;
  leafScore: number;
  seedScore: number;
  skinScore: number;
  detectedType: "leaf" | "seed" | "person" | "non_agri" | "unknown";
  rejectionReason?: {
    en: string;
    hi: string;
    mr: string;
  };
}

/**
 * Analyzes an HTMLImageElement or Canvas to detect whether the image
 * is a plant leaf, crop seeds, or an invalid non-agricultural photo.
 */
export function analyzeImagePixels(
  canvas: HTMLCanvasElement,
  forTarget: "leaf" | "seed"
): ImageAnalysisMetrics {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      isLeafCandidate: true,
      isSeedCandidate: true,
      leafScore: 0.5,
      seedScore: 0.5,
      skinScore: 0,
      detectedType: "unknown",
    };
  }

  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let leafPixels = 0;
  let seedPixels = 0;
  let skinPixels = 0;
  let neutralPixels = 0;
  let totalSamples = 0;

  // Sample every 4th pixel for high speed and accuracy
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalSamples++;

    // 1. Plant Leaf / Foliage Detection
    // Chlorophyll green: G > R and G > B with significant saturation
    const isGreenLeaf = g > r && g > b && g > 45 && (g - Math.max(r, b) > 10);
    // Chlorotic yellow / leaf blight: R & G balanced, B low
    const isYellowLeaf = r > 75 && g > 75 && b < 65 && Math.abs(r - g) < 35 && (g - b > 15);
    // Necrotic leaf lesions / dry brown leaf:
    const isNecroticLeaf = r > 60 && g > 45 && b < 45 && r > g && (r - b) > 25 && (g - b) > 10;

    if (isGreenLeaf || isYellowLeaf || isNecroticLeaf) {
      leafPixels++;
    }

    // 2. Crop Seeds / Grain Detection
    // Golden-amber seeds (wheat, mustard, maize):
    const isGoldSeed = r > 110 && g > 75 && b < 65 && r > g && (r - b > 45);
    // Tan / beige / legume seeds (soybean, gram, chickpea):
    const isTanSeed = r > 90 && r < 190 && g > 65 && g < 150 && b < 100 && r > g && g > b && (r - b > 30);
    // Dark brown / black seeds (onion seeds, mustard, nigella):
    const isDarkSeed = r < 55 && g < 55 && b < 55 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;

    if (isGoldSeed || isTanSeed || isDarkSeed) {
      seedPixels++;
    }

    // 3. Human Skin Detection (Face / hands / selfies)
    const isSkin =
      r > 95 &&
      g > 40 &&
      b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 &&
      r > g &&
      g > b &&
      r - g < 85;

    if (isSkin) {
      skinPixels++;
    }

    // 4. Monochrome / Neutral (Screens, walls, metals, cars)
    if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10) {
      neutralPixels++;
    }
  }

  const leafScore = leafPixels / totalSamples;
  const seedScore = seedPixels / totalSamples;
  const skinScore = skinPixels / totalSamples;
  const neutralScore = neutralPixels / totalSamples;

  let detectedType: "leaf" | "seed" | "person" | "non_agri" | "unknown" = "unknown";

  if (skinScore > 0.28) {
    detectedType = "person";
  } else if (leafScore > 0.20 && leafScore > seedScore * 1.3) {
    detectedType = "leaf";
  } else if (seedScore > 0.18 && seedScore > leafScore * 1.2) {
    detectedType = "seed";
  } else if (neutralScore > 0.65) {
    detectedType = "non_agri";
  } else {
    // If scores are moderate, lean based on dominant
    detectedType = leafScore >= seedScore ? "leaf" : "seed";
  }

  const isLeafCandidate = (leafScore >= 0.12 || detectedType === "leaf") && skinScore < 0.25;
  const isSeedCandidate = (seedScore >= 0.12 || detectedType === "seed") && skinScore < 0.25;

  let rejectionReason: { en: string; hi: string; mr: string } | undefined;

  if (forTarget === "leaf") {
    if (detectedType === "seed") {
      rejectionReason = {
        en: "❌ Seed photo detected! This tool is strictly for Plant Leaf Pest & Disease Detection. Please upload a clear photo of a crop leaf, or switch to the 'Seed Quality' section to analyze seeds.",
        hi: "❌ बीजों की फोटो पहचानी गई! यह टूल केवल 'पौधों की पत्ती' में कीट व रोग पहचान के लिए है। कृपया पत्ती की फोटो अपलोड करें अथवा 'बीज गुणवत्ता (Seed Quality)' टूल का उपयोग करें।",
        mr: "❌ बियाण्यांचा फोटो आढळला! हे साधन केवळ 'पिकाच्या पानांवरील' कीड व रोग तपासणीसाठी आहे. कृपया झाडाच्या पानाचा फोटो अपलोड करा किंवा बियाण्यांसाठी 'बियाणे प्रत' साधन वापरा.",
      };
    } else if (detectedType === "person") {
      rejectionReason = {
        en: "❌ Person/Portrait photo detected. Please upload a clear close-up photo of a crop leaf to detect pests or diseases.",
        hi: "❌ व्यक्ति/चेहरे की फोटो पहचानी गई। कीट व रोग जांच के लिए कृपया फसल की पत्ती की स्पष्ट फोटो अपलोड करें।",
        mr: "❌ व्यक्ती किंवा चेहऱ्याचा फोटो आढळला. कीड व रोगाच्या अचूक निदानासाठी कृपया पिकाच्या बाधित पानाचा स्पष्ट फोटो अपलोड करा.",
      };
    } else if (!isLeafCandidate) {
      rejectionReason = {
        en: "❌ Invalid Photo: No plant leaf detected. Pest detection accepts ONLY clear photos of plant leaves. Please retake photo focused on the crop leaf.",
        hi: "❌ अमान्य फोटो: पौधों की पत्ती नहीं मिली। कीट पहचान में केवल पत्तियों की फोटो स्वीकार की जाती है। कृपया पत्ती का स्पष्ट फोटो लें।",
        mr: "❌ अमान्य फोटो: वनस्पतीचे पान आढळले नाही. कीड तपासणीसाठी केवळ पानांचाच फोटो चालतो. कृपया पानाचा स्पष्ट फोटो अपलोड करा.",
      };
    }
  } else if (forTarget === "seed") {
    if (detectedType === "leaf") {
      rejectionReason = {
        en: "❌ Plant leaf photo detected! This tool is strictly for Agricultural Seed Quality Analysis. Please upload a photo of seeds, or switch to 'Pest Detection' to analyze plant leaves.",
        hi: "❌ पत्ती की फोटो पहचानी गई! यह टूल केवल 'बीज गुणवत्ता विश्लेषण' के लिए है। कृपया बीजों की फोटो अपलोड करें अथवा पत्ती की जांच के लिए 'कीट पहचान (Pest Detection)' पर जाएं।",
        mr: "❌ पानाचा फोटो आढळला! हे साधन केवळ 'बियाणे प्रत व उगवण तपासणी'साठी आहे. कृपया बियाण्यांचा फोटो अपलोड करा, किंवा पानासाठी 'रोग निदान' साधन वापरा.",
      };
    } else if (detectedType === "person") {
      rejectionReason = {
        en: "❌ Person/Portrait photo detected. Please upload a clear photo of crop seeds on a flat surface to analyze quality.",
        hi: "❌ चेहरे/व्यक्ति की फोटो पहचानी गई। बीज गुणवत्ता जांच के लिए कृपया साफ सतह पर रखे बीजों की फोटो अपलोड करें।",
        mr: "❌ व्यक्तीचा फोटो आढळला. बियाणे प्रत तपासणीसाठी कृपया बियाण्यांचा स्पष्ट फोटो अपलोड करा.",
      };
    } else if (!isSeedCandidate) {
      rejectionReason = {
        en: "❌ Invalid Photo: No crop seeds detected. Seed quality analysis accepts ONLY clear photos of agricultural seeds or grains.",
        hi: "❌ अमान्य फोटो: फसल के बीज नहीं मिले। बीज गुणवत्ता जांच में केवल बीजों की फोटो स्वीकार की जाती है।",
        mr: "❌ अमान्य फोटो: बियाणे आढळले नाही. बियाणे प्रत विश्लेषणासाठी केवळ शेती बियाण्यांचाच फोटो अपलोड करा.",
      };
    }
  }

  return {
    isLeafCandidate,
    isSeedCandidate,
    leafScore,
    seedScore,
    skinScore,
    detectedType,
    rejectionReason,
  };
}
