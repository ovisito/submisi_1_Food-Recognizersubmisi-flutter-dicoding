import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Configure multer for image uploads (in-memory storage for easy processing)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- Lazy Initialized Gemini Client ---
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiInstance;
}

// Fallback Labels matching FoodClassifier.kt
const FALLBACK_LABELS = [
  "Nasi Lemak", "Nasi Goreng", "Sate Ayam", "Rendang", "Bakso", 
  "Soto Ayam", "Gado-Gado", "Martabak", "Nasi Uduk", "Mie Goreng",
  "Burger", "Pizza", "Salad", "Chocolate Cake", "Sushi", 
  "Ramen", "Spaghetti Carbonara", "Kebab", "Tacos", "Steak"
];

// Fallback Nutrition Generator matching GeminiManager.kt
function generateSimulationNutrition(foodName: string) {
  const nameLower = foodName.toLowerCase();
  if (nameLower.includes("burger") || nameLower.includes("pizza")) {
    return { calories: 550, carbs: 45, fat: 25, fiber: 3, protein: 20 };
  } else if (nameLower.includes("salad") || nameLower.includes("sayur") || nameLower.includes("gado")) {
    return { calories: 150, carbs: 10, fat: 8, fiber: 4, protein: 3 };
  } else if (nameLower.includes("nasi goreng") || nameLower.includes("rice") || nameLower.includes("lemak") || nameLower.includes("uduk")) {
    return { calories: 420, carbs: 55, fat: 15, fiber: 2, protein: 12 };
  } else if (nameLower.includes("ayam") || nameLower.includes("chicken") || nameLower.includes("sate")) {
    return { calories: 320, carbs: 0, fat: 18, fiber: 0, protein: 28 };
  } else if (nameLower.includes("steak") || nameLower.includes("daging") || nameLower.includes("rendang")) {
    return { calories: 450, carbs: 0, fat: 28, fiber: 0, protein: 32 };
  } else if (nameLower.includes("buah") || nameLower.includes("apel") || nameLower.includes("pisang")) {
    return { calories: 90, carbs: 22, fat: 0, fiber: 3, protein: 1 };
  } else if (nameLower.includes("bakso") || nameLower.includes("soto") || nameLower.includes("ramen")) {
    return { calories: 280, carbs: 25, fat: 12, fiber: 1, protein: 18 };
  } else if (nameLower.includes("cake") || nameLower.includes("martabak") || nameLower.includes("chocolate")) {
    return { calories: 380, carbs: 48, fat: 18, fiber: 2, protein: 6 };
  } else {
    return { calories: 250, carbs: 30, fat: 10, fiber: 2, protein: 8 };
  }
}

// Fallback Indonesian Recipe Generator
function generateSimulationRecipe(foodName: string) {
  const nameLower = foodName.toLowerCase();
  
  if (nameLower.includes("nasi lemak")) {
    return {
      recipeTitle: "Resep Nasi Lemak Gurih Khas Melayu",
      recipeIngredients: "2 gelas beras; 400 ml santan encer; 2 lembar daun pandan; 1 batang serai (memarkan); 1 sdt garam; Bahan sambal: 5 butir bawang merah, 2 siung bawang putih, 10 cabai merah kering, 1 sdm terasi goreng, garam dan gula secukupnya; Pelengkap: telur rebus, teri goreng, kacang tanah goreng, timun iris",
      recipeInstructions: "1. Cuci bersih beras. Masukkan beras, santan, daun pandan, serai, dan garam ke dalam rice cooker.\n2. Masak beras hingga matang, lalu aduk perlahan agar nasi pulen.\n3. Untuk sambal: haluskan bawang merah, bawang putih, cabai, dan terasi. Tumis hingga harum dan matang, bumbui dengan garam dan gula.\n4. Sajikan nasi lemak hangat bersama sambal, telur rebus, teri, kacang goreng, dan irisan timun."
    };
  } else if (nameLower.includes("nasi goreng")) {
    return {
      recipeTitle: "Resep Nasi Goreng Kampung Lezat",
      recipeIngredients: "2 piring nasi putih (dingin); 3 siung bawang merah; 2 siung bawang putih; 2 cabai merah keriting; 2 sdm kecap manis; 1 sdt garam; 1/2 sdt kaldu bubuk; 1 butir telur; minyak goreng secukupnya",
      recipeInstructions: "1. Haluskan bawang merah, bawang putih, dan cabai merah.\n2. Panaskan minyak di wajan. Tumis bumbu halus hingga wangi dan matang.\n3. Sisihkan bumbu ke pinggir wajan, masukkan telur dan buat orak-arik.\n4. Masukkan nasi putih dingin, aduk rata dengan bumbu dan telur.\n5. Tambahkan kecap manis, garam, dan kaldu bubuk. Aduk cepat dengan api besar hingga bumbu meresap.\n6. Angkat dan sajikan hangat."
    };
  } else if (nameLower.includes("sate")) {
    return {
      recipeTitle: "Resep Sate Ayam Bumbu Kacang Madura",
      recipeIngredients: "500 gram dada ayam (potong dadu); tusuk sate secukupnya; Bumbu marinasi: 2 siung bawang putih (haluskan), 1 sdm ketumbar bubuk, 3 sdm kecap manis, 1 sdm minyak; Bumbu kacang: 150 gram kacang tanah goreng (haluskan), 3 siung bawang merah, 2 siung bawang putih, 2 butir kemiri, gula merah dan garam secukupnya",
      recipeInstructions: "1. Campur potongan ayam dengan bumbu marinasi, diamkan selama 30 menit agar meresap.\n2. Tusuk daging ayam ke tusuk sate (3-4 potong per tusuk).\n3. Panggang sate di atas alat pemanggang sambil sesekali diolesi sisa bumbu marinasi hingga matang kecokelatan.\n4. Untuk bumbu kacang: tumis bawang merah, bawang putih, dan kemiri yang dihaluskan. Campurkan dengan kacang tanah halus dan air hangat, masak hingga mengental dan mengeluarkan minyak. Bumbui dengan garam dan gula merah.\n5. Sajikan sate ayam hangat bersama bumbu kacang dan kecap manis."
    };
  } else if (nameLower.includes("rendang")) {
    return {
      recipeTitle: "Resep Rendang Daging Sapi Minang Asli",
      recipeIngredients: "500 gram daging sapi (potong sesuai selera); 1 liter santan dari 1,5 butir kelapa; 2 batang serai (memarkan); 3 lembar daun jeruk; 1 lembar daun kunyit; Bumbu halus: 10 butir bawang merah, 5 siung bawang putih, 100 gram cabai merah keriting, 2 cm jahe, 2 cm lengkuas, 1 sdm ketumbar bubuk, 1/2 sdt pala bubuk, garam secukupnya",
      recipeInstructions: "1. Campurkan santan bersama bumbu halus, serai, daun jeruk, dan daun kunyit di dalam wajan besar. Masak sambil terus diaduk hingga mendidih dan mengeluarkan minyak.\n2. Masukkan potongan daging sapi, kecilkan api kompor.\n3. Masak rendang sambil sesekali diaduk agar bagian bawahnya tidak gosong.\n4. Teruskan memasak hingga kuah santan menyusut, mengering, dan berubah warna menjadi cokelat gelap kehitaman (proses memakan waktu sekitar 3-4 jam).\n5. Angkat rendang dan sajikan."
    };
  } else if (nameLower.includes("bakso")) {
    return {
      recipeTitle: "Resep Bakso Sapi Kuah Gurih Komplit",
      recipeIngredients: "500 gram bakso sapi siap pakai; Kuah bakso: 2 liter air, 200 gram tetelan sapi/tulang sapi; Bumbu halus kuah: 5 siung bawang putih, 3 siung bawang merah, 1 sdt merica butiran, 1 sdm garam, 1 sdt kaldu sapi bubuk; Pelengkap: mie kuning, bihun, daun seledri iris, bawang goreng, sambal cabai rawit",
      recipeInstructions: "1. Rebus air dan tetelan/tulang sapi dalam panci besar hingga mendidih dan kaldunya keluar.\n2. Tumis bumbu halus kuah hingga harum dan matang kekuningan, lalu masukkan ke dalam air kaldu rebusan.\n3. Masukkan bakso sapi kuah, masak dengan api kecil hingga bakso mengapung dan matang.\n4. Siapkan mangkuk saji, tata mie kuning, bihun, dan siram dengan bakso beserta kuah panas.\n5. Taburi irisan seledri, bawang goreng, dan sajikan bersama sambal."
    };
  } else if (nameLower.includes("soto")) {
    return {
      recipeTitle: "Resep Soto Ayam Lamongan Kuah Kuning",
      recipeIngredients: "1 ekor ayam (potong 4 bagian); 2 liter air; 2 batang serai (memarkan); 3 lembar daun jeruk; Bumbu halus soto: 8 butir bawang merah, 5 siung bawang putih, 3 cm kunyit (bakar), 2 cm jahe, 4 butir kemiri goreng, 1 sdt ketumbar bubuk, 1 sdt merica, garam secukupnya; Pelengkap: soun, tauge, telur rebus, irisan daun seledri, bawang goreng, koya gurih",
      recipeInstructions: "1. Rebus ayam dalam air mendidih hingga empuk. Angkat ayam, tiriskan, lalu suwir-suwir dagingnya.\n2. Tumis bumbu halus soto bersama serai dan daun jeruk hingga harum dan matang.\n3. Masukkan tumisan bumbu ke dalam air rebusan kaldu ayam. Didihkan kembali dengan api kecil.\n4. Siapkan mangkuk saji. Susun soun, tauge, suwiran ayam, dan telur rebus.\n5. Siram dengan kuah soto kuning panas.\n6. Sajikan hangat dengan taburan bawang goreng, seledri, koya, dan perasan jeruk nipis."
    };
  } else if (nameLower.includes("gado")) {
    return {
      recipeTitle: "Resep Gado-Gado Siram Sayuran Sehat",
      recipeIngredients: "Bahan sayur (rebus): 150 gram kangkung, 100 gram kubis iris, 100 gram tauge; Bahan pelengkap: 1 buah kentang rebus, 1 buah tahu goreng, 1 papan tempe goreng, 2 butir telur rebus; Saus kacang: 150 gram kacang tanah goreng (haluskan), 2 siung bawang putih, 3 cabai merah, 1 sdm air asam jawa, 1 keping gula merah, 1/2 sdt garam, air secukupnya",
      recipeInstructions: "1. Rebus semua sayuran secara terpisah hingga matang layu, lalu tiriskan.\n2. Potong-potong kentang rebus, tahu goreng, tempe goreng, dan telur rebus sesuai selera.\n3. Untuk saus kacang: haluskan bawang putih dan cabai merah. Tumis hingga harum, lalu masukkan kacang tanah halus, air, air asam jawa, gula merah, dan garam. Masak hingga mengental dan berminyak.\n4. Tata sayuran rebus dan bahan pelengkap di atas piring saji.\n5. Siram dengan saus kacang gurih di atasnya, sajikan bersama kerupuk."
    };
  } else if (nameLower.includes("martabak")) {
    return {
      recipeTitle: "Resep Martabak Manis Terang Bulan Teflon",
      recipeIngredients: "250 gram tepung terigu protein sedang; 300 ml air hangat; 2 sdm gula pasir; 1 butir telur; 1/2 sdt baking powder; 1/2 sdt soda kue; mentega secukupnya; Topping: susu kental manis, keju parut, meses cokelat, kacang tanah sangrai cincang",
      recipeInstructions: "1. Campur tepung terigu, gula pasir, baking powder, telur, dan air. Kocok menggunakan whisk hingga adonan lembut dan licin.\n2. Adonan didiamkan selama 1 jam dalam wadah tertutup.\n3. Panaskan wajan teflon anti lengket tanpa minyak dengan api kecil hingga benar-benar panas.\n4. Sesaat sebelum adonan dituang, masukkan soda kue yang dilarutkan sedikit air ke adonan, aduk rata.\n5. Tuang adonan ke teflon, ratakan ke pinggiran teflon untuk membuat kulit luar. Masak hingga muncul gelembung-gelembung di permukaan.\n6. Taburi sedikit gula pasir, tutup teflon hingga permukaan mengering dan matang.\n7. Angkat, olesi mentega selagi panas, beri topping meses, kacang, keju, dan susu kental manis. Lipat martabak, potong-potong, lalu sajikan."
    };
  } else if (nameLower.includes("burger")) {
    return {
      recipeTitle: "Resep Beef Burger Homemade Juicy",
      recipeIngredients: "2 buah roti burger (bun); 200 gram daging sapi cincang (beef patty); 1 siung bawang putih (cincang halus); 1/2 buah bawang bombay (iris cincang); 1/2 sdt garam; 1/2 sdt merica bubuk; margarin secukupnya; Pelengkap: keju lembaran, tomat iris, timun iris, selada, saus tomat, saus sambal, mayones",
      recipeInstructions: "1. Campur daging cincang dengan bawang putih, bawang bombay, garam, dan merica bubuk. Aduk rata lalu bentuk menjadi 2 lempengan bulat (patty).\n2. Diamkan patty di freezer selama 15 menit agar bentuknya kokoh.\n3. Panaskan sedikit margarin di wajan anti lengket. Panggang beef patty hingga matang kecokelatan di kedua sisinya.\n4. Belah dua roti burger bun, panggang sebentar bagian dalamnya dengan sedikit margarin hingga kecokelatan.\n5. Susun burger mulai dari bun bawah, saus, mayones, selada, beef patty panas, keju lembaran, tomat, timun, dan tutup dengan bun atas.\n6. Sajikan hangat."
    };
  } else if (nameLower.includes("pizza")) {
    return {
      recipeTitle: "Resep Pizza Mini Teflon Sederhana",
      recipeIngredients: "Bahan adonan: 200 gram tepung terigu, 1 sdt ragi instan, 1 sdm minyak zaitun/sayur, 120 ml air hangat, 1/2 sdt garam; Bahan saus: 4 sdm saus bolognese siap pakai; Bahan topping: 1 buah sosis iris bulat, 1/4 buah bawang bombay iris panjang, keju mozzarella parut secukupnya",
      recipeInstructions: "1. Campur terigu, ragi, minyak, air hangat, dan garam. Uleni hingga kalis dan adonan elastis.\n2. Bulatkan adonan, diamkan selama 30 menit hingga mengembang dua kali lipat.\n3. Kempeskan adonan, gilas bulat setebal 1 cm. Tusuk-tusuk permukaan adonan dengan garpu.\n4. Panaskan teflon dengan api sangat kecil, olesi tipis margarin. Letakkan adonan di teflon.\n5. Olesi permukaan adonan dengan saus bolognese, tata sosis, bawang bombay, dan taburi keju mozzarella.\n6. Tutup teflon rapat-rapat, panggang hingga kulit pizza kecokelatan dan keju mozzarella meleleh sempurna (sekitar 10-15 menit).\n7. Angkat dan sajikan selagi hangat."
    };
  } else if (nameLower.includes("salad")) {
    return {
      recipeTitle: "Resep Salad Sayur Saus Mayones Segar",
      recipeIngredients: "1 buah wortel (potong korek api halus); 5 lembar selada hijau (robek kasar); 1 buah timun (iris tipis); 1 buah tomat merah (potong dadu); 1/2 buah bawang bombay (iris tipis); Saus dressing: 4 sdm mayones, 1 sdm susu kental manis, 1 sdm air perasan jeruk nipis, 1/4 sdt garam dan lada hitam bubuk",
      recipeInstructions: "1. Cuci bersih semua sayuran segar dengan air matang dingin, lalu tiriskan.\n2. Untuk saus dressing: campur mayones, susu kental manis, jeruk nipis, garam, dan lada hitam di mangkuk kecil. Aduk hingga rata.\n3. Susun semua sayuran segar di mangkuk besar.\n4. Siram dengan saus dressing mayones sesaat sebelum disajikan agar sayuran tetap renyah.\n5. Aduk rata dan sajikan dingin."
    };
  } else {
    return {
      recipeTitle: `Resep ${foodName} Praktis Spesial`,
      recipeIngredients: "Bahan utama masakan secukupnya; 3 siung bawang merah; 2 siung bawang putih; garam dan gula secukupnya; penyedap rasa secukupnya; air dan minyak goreng secukupnya",
      recipeInstructions: "1. Bersihkan semua bahan-bahan utama masakan terlebih dahulu.\n2. Iris tipis bawang merah dan bawang putih, lalu tumis hingga harum.\n3. Masukkan bahan utama masakan ke wajan tumisan, tambahkan air secukupnya.\n4. Masukkan bumbu garam, gula, dan penyedap rasa. Aduk rata.\n5. Masak hingga matang merata dan kuah menyusut.\n6. Angkat lalu sajikan selagi hangat bersama keluarga."
    };
  }
}

// Helper to extract a food category based on image filename keywords
function getFallbackLabelFromFilename(filename: string): string {
  const fileLower = filename.toLowerCase();
  if (fileLower.includes("nasilemak") || fileLower.includes("lemak")) return "Nasi Lemak";
  if (fileLower.includes("nasigoreng") || fileLower.includes("goreng")) return "Nasi Goreng";
  if (fileLower.includes("burger")) return "Burger";
  if (fileLower.includes("pizza")) return "Pizza";
  if (fileLower.includes("salad")) return "Salad";
  if (fileLower.includes("sate") || fileLower.includes("satay")) return "Sate Ayam";
  if (fileLower.includes("rendang")) return "Rendang";
  if (fileLower.includes("soto")) return "Soto Ayam";
  if (fileLower.includes("bakso") || fileLower.includes("meatball")) return "Bakso";
  if (fileLower.includes("martabak")) return "Martabak";
  if (fileLower.includes("sushi")) return "Sushi";
  if (fileLower.includes("cake") || fileLower.includes("cokelat")) return "Chocolate Cake";
  
  // Seeded selection based on filename length so it remains consistent for the same file
  const index = filename.length % FALLBACK_LABELS.length;
  return FALLBACK_LABELS[index];
}

// --- API Endpoint: Scan / Recognize Food ---
app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    let imageBase64 = "";
    let mimeType = "image/jpeg";
    let originalName = "unknown.jpg";

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body.image) {
      // Handle base64 from webcam capture directly
      const base64Data = req.body.image; // expected format: "data:image/jpeg;base64,..."
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      } else {
        imageBase64 = base64Data;
      }
      originalName = "camera_capture.jpg";
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "No image file or base64 data provided" });
    }

    let foodName = "";
    let confidence = 0.85;
    let nutrition = { calories: 0, carbs: 0, fat: 0, fiber: 0, protein: 0 };
    let usedGemini = false;
    let hasRecipe = false;
    let recipeTitle = "";
    let recipeThumb = "";
    let recipeIngredients = "";
    let recipeInstructions = "";
    let parsed: any = null;

    // 1. Attempt to recognize via Gemini AI
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "GEMINI_API_KEY") {
      try {
        const client = getGeminiClient();
        const systemInstruction = `
          Anda adalah ahli gizi profesional dan koki terampil yang bertugas memberikan informasi nutrisi makanan secara akurat serta resep hidangan tersebut dalam Bahasa Indonesia.
          
          Untuk makanan yang teridentifikasi dalam gambar, berikan informasi gizi dan resep berikut:
          1. name: Nama hidangan dalam Bahasa Indonesia yang umum dan ringkas (misal: 'Nasi Goreng', 'Sate Ayam', 'Burger', dll.).
          2. englishName: Nama hidangan dalam Bahasa Inggris yang paling cocok untuk dicari di database resep global (misal: 'Fried Rice' untuk 'Nasi Goreng', 'Chicken Satay' untuk 'Sate Ayam', 'Meatballs' untuk 'Bakso', 'Beef Rendang' untuk 'Rendang', 'Chicken Soto' untuk 'Soto Ayam', dll.).
          3. confidence: Akurasi kecocokan klasifikasi (angka desimal antara 0.80 hingga 0.99).
          4. calories: Kalori makanan (dalam kkal, berupa angka bulat saja).
          5. carbs: Karbohidrat makanan (dalam gram, berupa angka bulat saja).
          6. fat: Lemak makanan (dalam gram, berupa angka bulat saja).
          7. fiber: Serat makanan (dalam gram, berupa angka bulat saja).
          8. protein: Protein makanan (dalam gram, berupa angka bulat saja).
          9. recipeTitle: Judul resep masakan yang elegan dalam Bahasa Indonesia (misal: 'Resep Nasi Goreng Spesial Pedas').
          10. recipeIngredients: Daftar bahan-bahan masakan dipisahkan oleh titik koma dan spasi '; ' dalam Bahasa Indonesia yang baik dan benar (misal: '2 piring nasi putih; 2 siung bawang putih; 3 siung bawang merah; 2 sdm kecap manis; 1 butir telur; garam secukupnya').
          11. recipeInstructions: Langkah-langkah memasak lengkap dan berurutan dalam Bahasa Indonesia, dipisahkan oleh karakter baris baru '\\n' (misal: '1. Panaskan minyak di wajan.\\n2. Tumis bawang hingga harum.\\n3. Masukkan telur lalu orak-arik.\\n4. Masukkan nasi dan kecap manis, aduk rata.\\n5. Sajikan selagi hangat.').

          Format output harus berupa JSON valid dengan struktur persis berikut:
          {
            "name": "Nama Makanan",
            "englishName": "English Name",
            "confidence": 0.95,
            "calories": 350,
            "carbs": 45,
            "fat": 15,
            "fiber": 3,
            "protein": 12,
            "recipeTitle": "Resep Nama Makanan Spesial",
            "recipeIngredients": "bahan 1; bahan 2; bahan 3; bahan 4",
            "recipeInstructions": "1. Langkah pertama.\\n2. Langkah kedua.\\n3. Langkah ketiga."
          }
        `;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            },
            "Identifikasi makanan yang ada dalam gambar ini. Berikan hasil sesuai dengan instruksi gizi dan kembalikan JSON saja."
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });

        const textResponse = response.text?.trim() || "";
        
        // Robust JSON extraction
        const firstBrace = textResponse.indexOf("{");
        const lastBrace = textResponse.lastIndexOf("}");
        let cleanJson = textResponse;
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = textResponse.substring(firstBrace, lastBrace + 1);
        }
        
        parsed = JSON.parse(cleanJson);

        foodName = parsed.name || getFallbackLabelFromFilename(originalName);
        confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.88;
        nutrition = {
          calories: parsed.calories || 0,
          carbs: parsed.carbs || 0,
          fat: parsed.fat || 0,
          fiber: parsed.fiber || 0,
          protein: parsed.protein || 0
        };

        if (parsed.recipeTitle && parsed.recipeIngredients && parsed.recipeInstructions) {
          hasRecipe = true;
          recipeTitle = parsed.recipeTitle;
          recipeIngredients = parsed.recipeIngredients;
          recipeInstructions = parsed.recipeInstructions;
        }
        usedGemini = true;
      } catch (geminiError) {
        console.error("Gemini Scan Error:", geminiError);
        // Fall back to simulation if Gemini fails
      }
    }

    // 2. Local Fallback Simulator (Matches Kotlin logic)
    if (!usedGemini) {
      foodName = getFallbackLabelFromFilename(originalName);
      confidence = 0.82 + (originalName.length % 16) / 100;
      if (confidence > 1.0) confidence = 0.98;
      
      const simNutr = generateSimulationNutrition(foodName);
      nutrition = simNutr;

      const simRecipe = generateSimulationRecipe(foodName);
      hasRecipe = true;
      recipeTitle = simRecipe.recipeTitle;
      recipeIngredients = simRecipe.recipeIngredients;
      recipeInstructions = simRecipe.recipeInstructions;
    }

    // 3. Fetch Recipe Thumbnail from MealDB (or full recipe as backup)
    try {
      const searchName = usedGemini && parsed?.englishName ? parsed.englishName : foodName;
      const queryName = encodeURIComponent(searchName);
      const mealDbResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${queryName}`);
      const mealDbData = await mealDbResponse.json();
      
      const meal = mealDbData.meals?.[0];
      if (meal) {
        if (!hasRecipe) {
          hasRecipe = true;
          recipeTitle = meal.strMeal || "";
          recipeInstructions = meal.strInstructions || "";

          const ingredientsList = [];
          for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`]?.trim();
            const meas = meal[`strMeasure${i}`]?.trim() || "";
            if (ing) {
              ingredientsList.push(`${ing} (${meas})`);
            }
          }
          recipeIngredients = ingredientsList.join("; ");
        }
        
        // Always try to fetch cover art from MealDB
        if (meal.strMealThumb) {
          recipeThumb = meal.strMealThumb;
        }
      }
    } catch (mealDbError) {
      console.error("MealDB API Error:", mealDbError);
    }

    // Return the formatted ScannedFood response
    res.json({
      id: Date.now(),
      name: foodName,
      confidence,
      imagePath: "", 
      timestamp: Date.now(),
      calories: nutrition.calories,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      protein: nutrition.protein,
      hasRecipe,
      recipeTitle,
      recipeThumb,
      recipeIngredients,
      recipeInstructions
    });

  } catch (err: any) {
    console.error("Express /api/scan Error:", err);
    res.status(500).json({ error: err.message || "Gagal mengidentifikasi makanan" });
  }
});

// --- Start Full-Stack Server ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
