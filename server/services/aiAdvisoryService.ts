export type AdvisoryCategory =
  | "soil"
  | "weather"
  | "pest"
  | "seed"
  | "fertilizer"
  | "resources"
  | "practice"
  | "irrigation"
  | "general";

export interface AdvisoryRequest {
  category?: AdvisoryCategory;
  message: string;
  language?: "en" | "hi" | "mr";
  image?: string;
  farmerContext?: {
    name?: string;
    crop?: string;
    farmSize?: string;
    village?: string;
    district?: string;
    state?: string;
  };
}

export function detectAdvisoryCategory(message: string): AdvisoryCategory {
  const text = message.toLowerCase();

  if (
    /(pest|disease|insect|thrips|caterpillar|blight|fungus|curl|yellow|spot|spray|rot|damage|larva|worm|infest|aphid|mite|borer|कीट|कीड़ा|रोग|थ्रिप्स|फफूंद|सड़न|अळी|कीड|रोगराई|मावा|तुडतुडे)/i.test(
      text
    )
  ) {
    return "pest";
  }

  if (
    /(seed|germination|variety|viability|sowing|seedling|sprout|hybrid|certified seed|treatment|बीज|अंकुरण|किस्म|बीजोपचार|बियाणे|उगवण|वाण|बीजप्रक्रिया)/i.test(
      text
    )
  ) {
    return "seed";
  }

  if (
    /(fertilizer|urea|dap|mop|npk|potash|nitrogen|phosphorus|compost|fym|manure|dosage|nutrient|खाद|उर्वरक|यूरिया|डीएपी|पोटाश|खत|शेणखत|पोषक|खते)/i.test(
      text
    )
  ) {
    return "fertilizer";
  }

  if (
    /(water|irrigation|drip|sprinkler|moisture|watering|pump|flood|drainage|सिंचाई|पानी|ड्रिप|टपक|सिंचन|पाणी|ठिबक|मोटार)/i.test(
      text
    )
  ) {
    return "irrigation";
  }

  if (
    /(weather|rain|temperature|forecast|monsoon|humidity|wind|frost|heat|storm|cloud|sunny|मौसम|बारिश|वर्षा|तापमान|हवामान|पाऊस|थंडी|ऊन|वादळ)/i.test(
      text
    )
  ) {
    return "weather";
  }

  if (
    /(soil|ph|saline|alkaline|black soil|red soil|sandy|clay|organic carbon|fertility|मिट्टी|भू|जमीन|माती|सामू|गाळ|सुपीकता)/i.test(
      text
    )
  ) {
    return "soil";
  }

  if (
    /(cost|budget|price|mandi|market|expense|labor|labour|profit|worker|tractor|equipment|finance|खर्च|बजट|मंडी|भाव|बाजारभाव|मजूर|हिशोब)/i.test(
      text
    )
  ) {
    return "resources";
  }

  if (
    /(practice|rotation|plough|plow|tillage|harvest|transplant|weeding|guide|step|crop guide|पद्धति|जुताई|रोपाई|कटाई|तण|मशागत|लागवड|काढणी)/i.test(
      text
    )
  ) {
    return "practice";
  }

  return "general";
}

export interface AdvisoryResponse {
  configured: boolean;
  provider: string;
  category: AdvisoryCategory;
  reply: string;
  disclaimer: string;
}

export const SYSTEM_PROMPTS: Record<AdvisoryCategory, string> = {
  soil: `Act as a soil health assistant. Provide information about soil health, including soil pH, moisture levels, nutrient content (nitrogen, phosphorus, and potassium), organic matter, and soil fertility. Identify potential soil deficiencies and explain how they may affect plant growth. Suggest suitable methods to improve soil quality, maintain soil fertility, and support healthy crop growth. Recommend appropriate fertilizers and soil management practices based on the available data. Use reliable sources, provide scientifically accurate information, and clearly distinguish actual soil test results from estimates. Ask me for my location, soil type, or soil test report when additional information is needed for accurate recommendations.`,

  weather: `Act as a weather alert and advisory assistant. Provide information about soil health, weather forecasts, rainfall patterns, moisture levels, and temperature extremes. Explain whether the weather and soil conditions are suitable for spraying, sowing, irrigation, or harvesting, identify possible weather hazards, and suggest ways to mitigate risks. Recommend suitable crop protections and fertilizers based on the available weather and soil data. Use reliable and up-to-date sources, clearly distinguish actual forecasts from general estimates.`,

  pest: `Act as a pest detection assistant for agriculture. Help identify common crop pests based on their symptoms, physical characteristics, and damage patterns. Explain how different pests affect crop growth, identify possible signs of pest infestation, and suggest suitable prevention and management methods. Recommend appropriate pest control measures, including biological, cultural, and chemical methods when necessary. Provide guidance on detecting pests early, protecting crops, and reducing crop losses. Use reliable and scientifically accurate sources, clearly distinguish confirmed pest identification from possible causes, and avoid making unsupported claims. Ask me to provide the crop name, location, symptoms, or a clear image of the affected plant if additional information is needed for accurate pest identification.`,

  seed: `Act as a seed quality analysis assistant for agriculture. Provide information about seed quality, including germination rate, seed purity, moisture content, seed viability, physical appearance, and seed health. Explain how seed quality affects crop growth, productivity, and overall yield. Help identify possible signs of poor-quality seeds, seed damage, contamination, and seed-borne diseases. Suggest suitable methods for seed selection, testing, storage, and treatment to improve germination and ensure healthy crop growth. Recommend appropriate seeds based on crop type, soil conditions, climate, and growing season. Use reliable and scientifically accurate sources, clearly distinguish laboratory-tested results from estimates, and avoid making unsupported claims about seed quality. Ask me for the crop name, seed variety, location, or seed test report if additional information is needed to provide accurate recommendations.`,

  fertilizer: `Act as an agricultural fertilizer advice assistant. Provide recommendations for selecting and applying fertilizers based on crop type, soil health, nutrient requirements, and growth stage. Explain the importance of essential nutrients, including nitrogen (N), phosphorus (P), and potassium (K), and how nutrient deficiencies affect plant growth and crop yield. Suggest suitable organic and chemical fertilizers according to the available soil test results and crop requirements. Explain the appropriate fertilizer application methods, timing, and precautions to prevent over-fertilization, soil degradation, and water pollution. Recommend sustainable nutrient management practices to improve soil fertility and crop productivity. Use reliable and scientifically accurate sources, clearly distinguish data-based recommendations from general estimates, and avoid suggesting fertilizer quantities without sufficient information. Ask me for the crop name, soil type, location, growth stage, or soil test report when additional information is needed to provide accurate fertilizer recommendations.`,

  resources: `Act as an agricultural resource planning assistant. Help farmers plan and manage essential farming resources, including water, seeds, fertilizers, pesticides, labor, equipment, and budget. Provide recommendations for allocating resources efficiently based on crop type, farm size, soil conditions, weather forecasts, and crop growth stages. Suggest suitable schedules for irrigation, fertilizer application, pest management, and other farming activities. Help estimate resource requirements, identify potential shortages, reduce unnecessary expenses, and minimize resource wastage. Recommend sustainable farming practices to improve productivity, reduce costs, and protect the environment. Use reliable and scientifically accurate information, clearly distinguish actual data from estimates, and avoid making unsupported claims. Ask me for the crop name, farm size, location, available resources, budget, and farming season when additional information is needed to provide accurate resource planning recommendations.`,

  practice: `Act as an agricultural practice guide assistant. Provide step-by-step guidance to farmers on effective farming practices, including land preparation, seed selection, sowing, irrigation, fertilizer application, weed control, pest management, and harvesting. Recommend suitable agricultural practices based on crop type, soil conditions, climate, weather forecasts, and growing season. Explain modern farming techniques, sustainable agriculture methods, and ways to improve crop productivity while reducing costs and resource wastage. Provide practical advice on crop rotation, soil conservation, water management, and integrated pest management. Use reliable and scientifically accurate sources, clearly distinguish general recommendations from location-specific advice, and avoid making unsupported claims. Ask me for the crop name, location, soil type, farm size, and current growth stage when additional information is needed to provide accurate farming guidance.`,

  irrigation: `Act as an irrigation management assistant for agriculture. Provide recommendations for efficient water management based on crop type, soil moisture, soil type, weather conditions, rainfall forecasts, and crop growth stages. Explain different irrigation methods, including drip irrigation, sprinkler irrigation, and surface irrigation, and recommend the most suitable method for the given farming conditions. Help determine when and how much to irrigate crops based on their water requirements and available soil moisture data. Identify potential problems such as over-irrigation, underwatering, waterlogging, and water wastage. Suggest suitable irrigation schedules and techniques to conserve water, maintain soil health, and improve crop productivity. Use reliable and scientifically accurate sources, clearly distinguish actual sensor measurements from estimates, and avoid providing misleading irrigation recommendations. Ask me for the crop name, farm location, soil type, farm size, current weather conditions, and available soil moisture readings when additional information is needed to provide accurate irrigation management advice.`,

  general: `Act as AgriSathi, an empathetic agricultural consultant for Indian farmers. Answer queries clearly, practically, and sustainably. Provide clear steps and organic alternatives where available.`,
};

export async function generateAdvisory(req: AdvisoryRequest): Promise<AdvisoryResponse> {
  const language = req.language || "en";
  let category: AdvisoryCategory = req.category || "general";

  // Auto-route query to its required domain if category was general or omitted
  if (!req.category || req.category === "general") {
    if (req.image) {
      category = /(seed|grain|kernel|बीज|बियाणे)/i.test(req.message) ? "seed" : "pest";
    } else {
      const autoDetected = detectAdvisoryCategory(req.message);
      if (autoDetected !== "general") {
        category = autoDetected;
      }
    }
  }

  const baseSystemPrompt = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.general;

  const farmerContext = req.farmerContext
    ? `\nFarmer Profile Context: Name: ${req.farmerContext.name || "Farmer"}, Main Crop: ${
        req.farmerContext.crop || "General"
      }, Farm Size: ${req.farmerContext.farmSize || "2 acres"}, Location: ${
        req.farmerContext.village || "Niphad"
      }, ${req.farmerContext.district || "Nashik"}, ${req.farmerContext.state || "Maharashtra"}.`
    : "";

  const langInstruction =
    language === "hi"
      ? "\nLanguage: Respond in clear, respectful Hindi (Devanagari script) with simple agricultural terminology."
      : language === "mr"
      ? "\nLanguage: Respond in clear, respectful Marathi (Devanagari script) tailored for Maharashtra farmers."
      : "\nLanguage: Respond in clear, practical English formatted in concise bullet points.";

  const fullSystemPrompt = `${baseSystemPrompt}${farmerContext}${langInstruction}\nAlways keep advice structured with actionable steps. Always adhere to scientific ICAR guidelines.`;

  // 1. Try Groq API
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: req.message },
          ],
          temperature: 0.3,
          max_tokens: 750,
        }),
      });

      if (resp.ok) {
        const json = (await resp.json()) as any;
        const text = json.choices?.[0]?.message?.content;
        if (text) {
          return {
            configured: true,
            provider: "Groq (Llama 3.3 70B)",
            category,
            reply: text,
            disclaimer: getDisclaimer(language),
          };
        }
      }
    } catch (err: any) {
      console.warn("[AI Advisory] Groq request failed:", err.message);
    }
  }

  // 2. Try Mistral API
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (mistralKey) {
    try {
      const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mistralKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: req.message },
          ],
          temperature: 0.3,
          max_tokens: 750,
        }),
      });

      if (resp.ok) {
        const json = (await resp.json()) as any;
        const text = json.choices?.[0]?.message?.content;
        if (text) {
          return {
            configured: true,
            provider: "Mistral AI",
            category,
            reply: text,
            disclaimer: getDisclaimer(language),
          };
        }
      }
    } catch (err: any) {
      console.warn("[AI Advisory] Mistral request failed:", err.message);
    }
  }

  // 3. Try Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${fullSystemPrompt}\n\nFarmer Query: ${req.message}` }],
              },
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 750 },
          }),
        }
      );

      if (resp.ok) {
        const json = (await resp.json()) as any;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            configured: true,
            provider: "Google Gemini 2.5 Flash",
            category,
            reply: text,
            disclaimer: getDisclaimer(language),
          };
        }
      }
    } catch (err: any) {
      console.warn("[AI Advisory] Gemini request failed:", err.message);
    }
  }

  // 4. Fallback to Verified ICAR Agricultural Knowledge Engine
  return {
    configured: false,
    provider: "AgriSathi Verified Agro-Knowledge Engine",
    category,
    reply: getExpertGuidance(category, req.message, language, req.farmerContext),
    disclaimer: getDisclaimer(language),
  };
}

function getDisclaimer(language: string): string {
  if (language === "hi") {
    return "टीप / Note: यह AI कृषि सलाह केवल संदर्भ और प्राथमिक मार्गदर्शन के लिए है। रासायनिक कीटनाशक या खाद के किसी भी उपयोग से पहले स्थानीय कृषि विज्ञान केंद्र (KVK) विशेषज्ञ से पुष्टि करें।";
  }
  if (language === "mr") {
    return "टीप / Note: हा AI सल्ला केवळ मार्गदर्शनासाठी आहे. रासायनिक औषधे किंवा खते वापरण्यापूर्वी स्थानिक कृषी अधिकारी किंवा KVK तज्ज्ञांशी संपर्क साधा.";
  }
  return "Notice: AI agricultural advice is for advisory reference. Always confirm dosage and chemical inputs with certified Krishi Vigyan Kendra (KVK) agronomists.";
}

function getExpertGuidance(
  category: AdvisoryCategory,
  query: string,
  language: string,
  context?: AdvisoryRequest["farmerContext"]
): string {
  const crop = context?.crop || "Onion";
  const farmSize = context?.farmSize || "2 acres";

  if (language === "hi") {
    switch (category) {
      case "soil":
        return `### 🌾 मिट्टी स्वास्थ्य विश्लेषण एवं अनुशंसा (${crop} फसल)
1. **आवश्यक पोषक तत्व**: ${crop} के लिए N:P:K का आदर्श अनुपात संतुलित होना चाहिए। बेसल डोज में फॉस्फोरस और पोटाश डालें।
2. **मिट्टी का पीएच (pH)**: 6.5 से 7.5 के बीच का पीएच पोषक तत्वों के अवशोषण के लिए सर्वोत्तम है। यदि मिट्टी क्षारीय है तो जिप्सम का उपयोग करें।
3. **जैविक पदार्थ में सुधार**: प्रति एकड़ 3-4 ट्रॉली अच्छी सड़ी हुई गोबर की खाद (FYM) या कम्पोस्ट मिलाएं।
4. **सिफारिश**: रासायनिक खाद देने से पहले नजदीकी मिट्टी परीक्षण प्रयोगशाला से सॉइल हेल्थ कार्ड की रिपोर्ट अवश्य लें।`;

      case "weather":
        return `### 🌦️ मौसम चेतावनी एवं कृषि सलाह
1. **छिड़काव संबंधी नियम**: यदि आगामी 6-12 घंटों में वर्षा की संभावना हो अथवा हवा की गति 15 किमी/घंटा से अधिक हो, तो किसी भी प्रकार का कीटनाशक छिड़काव रोक दें।
2. **जल निकासी**: खेत में क्यारियों के बीच जल निकासी नाली साफ रखें ताकि जड़ों में पानी न भरे।
3. **तापमान प्रबंधन**: अत्यधिक धूप या शीत लहर के दौरान मिट्टी में नमी बनाए रखने हेतु सुबह के समय हल्की ड्रिप सिंचाई करें।`;

      case "pest":
        return `### 🐛 कीट पहचान एवं नियंत्रण उपाय
1. **शुरुआती लक्षण**: पत्तियों पर चांदी जैसी धारियां या पीले धब्बे थ्रिप्स (Thrips) अथवा रस चूसक कीटों के प्राथमिक संकेत हैं।
2. **जैविक रोकथाम**: प्रति एकड़ 15-20 नीले व पीले चिपचिपे ट्रैप लगाएं। 5% नीम तेल (Neem Oil 10,000 ppm @ 2-3 मिली/लीटर पानी) का छिड़काव करें।
3. **रासायनिक विकल्प**: यदि संक्रमण आर्थिक क्षति स्तर (ETL) से अधिक है, तो KVK की सलाह पर स्वीकृत कीटनाशक का सही मात्रा में उपयोग करें।`;

      case "seed":
        return `### 🌱 बीज गुणवत्ता एवं अंकुरण परीक्षण
1. **अंकुरण परीक्षण**: 100 बीज लेकर गीले सूती कपड़े में 6-7 दिन रखें। यदि 80 से अधिक बीज अंकुरित होते हैं तो बीज बोने योग्य है।
2. **बीजोपचार (Seed Treatment)**: बुवाई से पहले ट्राइकोडर्मा विरिडी (Trichoderma viride @ 5 ग्राम/किलो) या कार्बोक्ज़िन से बीजोपचार करें।
3. **भंडारण**: बीजों को सूखे, हवादार और नमी-मुक्त स्थान पर रखें।`;

      case "fertilizer":
        return `### 🧪 उर्वरक प्रबंधन सलाह (${farmSize})
1. **बेसल डोज (बुवाई के समय)**: 50 किग्रा डीएपी (DAP) + 30 किग्रा एमओपी (MOP) + 10 किग्रा जिंक सल्फेट प्रति एकड़।
2. **यूरिया का विभाजन**: यूरिया को एक बार में न डालें। इसे 25-30 दिन और 45-50 दिन के अंतराल पर 2-3 खुराकों में विभाजित करें।
3. **सावधानी**: भारी बारिश या गीली जमीन में खाद देने से पोषक तत्व बह जाते हैं, इसलिए मौसम देखकर ही डालें।`;

      case "resources":
        return `### 📋 कृषि संसाधन एवं बजट योजना
1. **संसाधन आवंटन**: बीज, खाद, श्रम और डीजल खर्च का अग्रिम बजट तैयार रखें।
2. **श्रम व मशीनरी**: कटाई व निराई के लिए मजदूरों और थ्रेशर/ट्रैक्टर की बुकिंग 3-4 दिन पहले सुनिश्चित करें।
3. **लागत में बचत**: संतुलित उर्वरक और ड्रिप सिंचाई अपनाने से लागत में 25-30% की कमी और पानी की बचत होती है।`;

      case "practice":
        return `### 📖 उत्तम कृषि पद्धतियां (GAP)
1. **खेत की तैयारी**: गहरी जुताई के बाद पाटा लगाकर मिट्टी को भुरभुरा बनाएं।
2. **फसल चक्र**: लगातार एक ही फसल न लगाएं; दलहनी फसलों (मूंग, उड़द) के साथ फसल चक्र अपनाएं।
3. **खरपतवार नियंत्रण**: बुवाई के 20-25 दिन बाद पहली निराई-गुड़ाई अवश्य करें।`;

      case "irrigation":
        return `### 💧 सिंचाई प्रबंधन
1. **सिंचाई की विधि**: टपक सिंचाई (Drip Irrigation) सबसे प्रभावी है, जो 40-50% पानी बचाती है।
2. **सिंचाई का समय**: सुबह या देर शाम सिंचाई करें ताकि वाष्पीकरण से पानी का नुकसान कम हो।
3. **मिट्टी की नमी**: उंगली को 2 इंच मिट्टी में दबाकर देखें; यदि मिट्टी भुरभुरी और सूखी लगे तभी सिंचाई प्रारंभ करें।`;

      default:
        return `### 🌾 कृषि सलाह
आपकी फसल के संबंध में सामान्य कृषि मार्गदर्शन उपलब्ध है। विस्तृत सिफारिश हेतु अपनी फसल, मिट्टी का प्रकार और क्षेत्र का विवरण साझा करें।`;
    }
  }

  if (language === "mr") {
    switch (category) {
      case "soil":
        return `### 🌾 माती आरोग्य विश्लेषण आणि सल्ला (${crop} पीक)
1. **पोषक घटक**: ${crop} पिकासाठी नत्र, स्फुरद आणि पालाश (N:P:K) योग्य प्रमाणात द्या. जमिनीचा पोत सुधारण्यासाठी सेंद्रिय खतांचा वापर करा.
2. **सामू (pH)**: 6.5 ते 7.5 सामू पिकांच्या वाढीसाठी उत्तम मानला जातो.
3. **सेंद्रिय कर्ब**: प्रति एकर 3 ते 4 ट्रॉली चांगले कुजलेले शेणखत किंवा गांडूळ खत मिसळा.
4. **तज्ज्ञ सल्ला**: अचूक खतांच्या नियोजनासाठी नजीकच्या कृषी विज्ञान केंद्राकडून (KVK) माती परीक्षण करून घ्या.`;

      case "irrigation":
        return `### 💧 पाणी व्यवस्थापन सल्ला
1. **ठिबक सिंचन**: पाण्याचा कार्यक्षम वापर करण्यासाठी ठिबक पद्धत वापरावी, ज्यामुळे पाण्याची बचत होते.
2. **वेळ**: सिंचन नेहमी सकाळी किंवा संध्याकाळी करावे, दुपारच्या वेळी सिंचन टाळावे.
3. **पाऊस अंदाज**: पाऊस पडण्याची शक्यता असल्यास पाणी देणे थांबवा, जेणेकरून मुळे कुजणार नाहीत.`;

      default:
        return `### 🌾 शेतीविषयक सल्ला
${crop} पिकासाठी शिफारसीत कृषी पद्धतींचा अवलंब करा. अधिक माहितीसाठी स्थानिक कृषी सहाय्यक किंवा KVK शास्त्रज्ञांशी संपर्क साधा.`;
    }
  }

  // English fallback
  switch (category) {
    case "soil":
      return `### 🌾 Soil Health & Fertility Advisory (${crop})
1. **Nutrient Balance**: Maintain balanced N:P:K ratio. Apply full phosphorus and potassium as basal dose, splitting nitrogen into 2-3 top dressings.
2. **Soil pH & Structure**: Optimal pH range for ${crop} is 6.5 - 7.5. Apply agricultural gypsum if dealing with sodic or alkaline soils.
3. **Organic Carbon**: Incorporate 4-5 tonnes of well-decomposed Farm Yard Manure (FYM) or vermicompost per acre before planting.
4. **Soil Testing**: Always compare visual symptoms against certified Soil Health Card (SHC) laboratory measurements.`;

    case "weather":
      return `### 🌦️ Agro-Weather Advisory & Risk Alert
1. **Spraying Window**: Suspend chemical sprays if rainfall probability exceeds 40% or if surface winds exceed 15 km/h.
2. **Field Drainage**: Ensure drainage channels between furrows are cleared to prevent water stagnation around the root zone.
3. **Thermal Management**: Apply light irrigation during heat spikes to maintain microclimate humidity.`;

    case "pest":
      return `### 🐛 Pest Identification & Integrated Pest Management (IPM)
1. **Detection**: Silvery streaks and curling leaves indicate thrips or sucking pests.
2. **Biological & Cultural Controls**:
   - Install 15-20 blue and yellow sticky traps per acre.
   - Spray 5% Neem Seed Kernel Extract (NSKE) or Neem Oil (10,000 ppm @ 2-3 ml/L).
3. **Chemical Threshold**: If infestation crosses the Economic Threshold Level (ETL), apply recommended insecticides strictly according to KVK guidance.`;

    case "seed":
      return `### 🌱 Seed Quality & Germination Testing
1. **Home Germination Test**: Place 100 sample seeds on a moist cotton cloth for 5-7 days. Viable batches show >80% germination.
2. **Seed Treatment**: Treat seeds with Trichoderma viride (5g/kg) or certified fungicides to prevent damping-off and seed-borne pathogens.
3. **Storage Guidelines**: Store certified seed stock in cool, dry, rodent-proof bins with moisture below 8%.`;

    case "fertilizer":
      return `### 🧪 Balanced Fertilizer Recommendations (${farmSize})
1. **Basal Dose**: 50 kg DAP + 30 kg MOP + 10 kg Zinc Sulphate per acre during field preparation.
2. **Top Dressing**: Apply urea in split doses at 30 and 45 days after planting, preferably through fertigation or right before light irrigation.
3. **Safety**: Never apply chemical fertilizer on completely dry soil or immediately before torrential rain.`;

    case "resources":
      return `### 📋 Agricultural Resource & Budget Planner
1. **Input Planning**: Procure certified seeds and bio-fertilizers 2 weeks prior to planting season.
2. **Labor & Machinery**: Pre-book weeding and harvesting labor 3-4 days ahead to avoid peak-season wage surges.
3. **Efficiency**: Adopting drip irrigation and fertigation cuts fertilizer losses by up to 30% and electricity runtime by 40%.`;

    case "practice":
      return `### 📖 Good Agricultural Practices (GAP)
1. **Land Preparation**: Perform 2 deep summer ploughings followed by rotavator tilling to destroy overwintering pupae and weeds.
2. **Crop Rotation**: Alternate heavy feeders like onion or wheat with leguminous green manure crops (dhaincha, sunnhemp).
3. **Intercultural Operations**: Complete first weeding within 20-25 days; earth-up bulbs to encourage vigorous development.`;

    case "irrigation":
      return `### 💧 Irrigation Scheduling & Water Management
1. **Application Method**: Drip irrigation provides 90%+ water-use efficiency compared to conventional flood furrows.
2. **Scheduling**: Irrigate during early morning hours to minimize evaporative losses. Maintain 50-60% available soil moisture.
3. **Waterlogging Warning**: Onion roots are shallow and sensitive to standing water; avoid irrigating if rain is imminent.`;

    default:
      return `### 🌾 AgriSathi Comprehensive Farming Advisory
Please provide details regarding your specific crop, soil type, and location for customized agricultural guidance.`;
  }
}
