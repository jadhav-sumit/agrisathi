import { FormEvent, useState, ChangeEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  Mic2,
  Phone,
  ShieldCheck,
  Sprout,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Calendar,
  X,
  Image as ImageIcon,
  Trees,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  apiLogin,
  apiRegister,
  demoCredentials,
  adminCredentials,
  type FarmerProfile,
} from "@/lib/auth";

type LoginProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onLogin: (profile?: FarmerProfile) => void;
};

type AuthTab = "signin" | "register" | "forgot";

const i18nTexts = {
  en: {
    brandTagline: "A trusted digital companion for every farmer & acre",
    welcome: "Welcome to AgriSathi",
    welcomeSub: "Empowering farmers with precision crop advisories, live weather, soil diagnosis, and mandi market prices.",
    tabSignIn: "Log In",
    tabRegister: "Farmer Registration",
    tabForgot: "Forgot Password",
    phoneOrEmail: "Username, Email, or Mobile Number",
    phone: "Phone / Mobile Number",
    email: "Email Address (Optional)",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    username: "Username",
    village: "Village",
    district: "District",
    state: "State",
    landSize: "Land Size",
    landUnit: "Unit",
    acres: "Acres",
    hectares: "Hectares",
    bigha: "Bigha",
    guntha: "Guntha",
    villageAndDistrict: "Village & District",
    cropName: "Main Crop Name",
    cropType: "Crop Season / Type",
    sowingDate: "Sowing / Planting Date",
    tenure: "Cultivator Status",
    tenureOptions: {
      owner: "Owner Cultivator",
      tenant: "Tenant / Leased Cultivator",
      sharecropper: "Sharecropper",
    },
    cropSeasons: {
      rabi: "Rabi (Winter season)",
      kharif: "Kharif (Monsoon season)",
      zaid: "Zaid (Summer season)",
      cash: "Cash Crop (Commercial)",
      horticulture: "Horticulture (Vegetables/Fruits)",
      pulses: "Pulses & Legumes",
    },
    cropPhotoLabel: "Upload Crop Photo",
    cropPhotoHint: "Leaf, shoot, or sample photo",
    landPhotoLabel: "Upload Land / Field Photo",
    landPhotoHint: "Soil, plot, or field photo",
    removePhoto: "Remove",
    agreeTerms: "I agree to the Agricultural Terms of Service & Privacy Policy",
    rememberMe: "Remember me on this device",
    signInBtn: "Log In to Farm Portal",
    createAccountBtn: "Register Farmer Account",
    demoQuickLogin: "Quick Demo Logins (One-Click)",
    demoFarmer: "Farmer Demo (Om Atole)",
    demoAdmin: "Administrator Demo",
    forgotInstructions: "Enter your registered mobile or email to reset your password.",
    sendResetBtn: "Generate Reset Token",
    resetTokenLabel: "Reset Token",
    newPasswordLabel: "New Password",
    confirmResetBtn: "Update Password",
    backToSignIn: "Back to Sign In",
    passwordMismatch: "Passwords do not match.",
    requiredFields: "Please fill in all required fields marked with *.",
    successReset: "Password reset successful! You can now sign in.",
    privacyNote: "Your agricultural and land data is encrypted and securely stored.",
    alreadyHaveAccount: "Already registered?",
    newToAgriSathi: "New to AgriSathi?",
  },
  hi: {
    brandTagline: "हर किसान और हर एकड़ के लिए भरोसेमंद डिजिटल साथी",
    welcome: "एग्रीसाथी (किसान साथी) में आपका स्वागत है",
    welcomeSub: "सटीक फसल सलाह, मौसम चेतावनी, मिट्टी की जांच और मंडी भाव से किसानों को सशक्त बनाना।",
    tabSignIn: "लॉग इन करें",
    tabRegister: "किसान पंजीकरण",
    tabForgot: "पासवर्ड भूल गए?",
    phoneOrEmail: "यूजरनेम, ईमेल या मोबाइल नंबर",
    phone: "मोबाइल नंबर",
    email: "ईमेल (वैकल्पिक)",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    fullName: "पूरा नाम",
    username: "यूजरनेम (सदस्य नाम)",
    village: "गाँव",
    district: "जिला",
    state: "राज्य",
    landSize: "जमीन / खेत का आकार",
    landUnit: "इकाई",
    acres: "एकड़",
    hectares: "हेक्टेयर",
    bigha: "बीघा",
    guntha: "गुंठा",
    villageAndDistrict: "गाँव और जिला",
    cropName: "मुख्य फसल का नाम",
    cropType: "फसल का प्रकार / मौसम",
    sowingDate: "बुवाई / रोपाई की तारीख",
    tenure: "किसान की स्थिति",
    tenureOptions: {
      owner: "स्वयं का खेत (भूमि स्वामी)",
      tenant: "किरायेदार / पट्टेदार किसान",
      sharecropper: "बटाईदार किसान",
    },
    cropSeasons: {
      rabi: "रबी (सर्दियों का मौसम)",
      kharif: "खरीफ (मानसून का मौसम)",
      zaid: "जायद (गर्मी का मौसम)",
      cash: "नकदी फसल (व्यापारिक)",
      horticulture: "बागवानी (सब्जियां/फल)",
      pulses: "दलहन और दालें",
    },
    cropPhotoLabel: "फसल की फोटो अपलोड करें",
    cropPhotoHint: "पत्ती, तना या फसल का नमूना",
    landPhotoLabel: "खेत / जमीन की फोटो अपलोड करें",
    landPhotoHint: "मिट्टी, खेत या क्यारी की तस्वीर",
    removePhoto: "हटाएं",
    agreeTerms: "मैं कृषि सेवा की शर्तों और गोपनीयता नीति से सहमत हूँ",
    rememberMe: "इस डिवाइस पर मुझे याद रखें",
    signInBtn: "कृषि पोर्टल में प्रवेश करें",
    createAccountBtn: "किसान खाता पंजीकृत करें",
    demoQuickLogin: "त्वरित डेमो लॉगिन (एक क्लिक)",
    demoFarmer: "किसान डेमो (ओम अतोले)",
    demoAdmin: "प्रशासक डेमो (Admin)",
    forgotInstructions: "पासवर्ड रीसेट करने के लिए पंजीकृत मोबाइल या ईमेल दर्ज करें।",
    sendResetBtn: "रीसेट टोकन प्राप्त करें",
    resetTokenLabel: "रीसेट टोकन",
    newPasswordLabel: "नया पासवर्ड",
    confirmResetBtn: "पासवर्ड अपडेट करें",
    backToSignIn: "लॉगिन पर वापस जाएं",
    passwordMismatch: "दोनों पासवर्ड मेल नहीं खाते।",
    requiredFields: "कृपया सभी आवश्यक जानकारी भरें (*)।",
    successReset: "पासवर्ड सफलतापूर्वक बदल दिया गया! अब लॉगिन करें।",
    privacyNote: "आपकी कृषि व भूमि की जानकारी पूरी तरह सुरक्षित है।",
    alreadyHaveAccount: "क्या पहले से पंजीकृत हैं?",
    newToAgriSathi: "एग्रीसाथी पर नए हैं?",
  },
  mr: {
    brandTagline: "प्रत्येक शेतकरी आणि प्रत्येक एकरासाठी विश्वासू डिजिटल साथी",
    welcome: "अॅग्रीसाथी (किसान साथी) मध्ये आपले स्वागत आहे",
    welcomeSub: "अचूक पीक सल्ला, थेट हवामान, माती परीक्षण आणि बाजारभाव याद्वारे शेतकऱ्यांना सक्षम करणे.",
    tabSignIn: "साइन इन करा",
    tabRegister: "शेतकरी नोंदणी",
    tabForgot: "पासवर्ड विसरलात?",
    phoneOrEmail: "वापरकर्ता नाव, ईमेल किंवा मोबाइल",
    phone: "मोबाइल नंबर",
    email: "ईमेल पत्ता (पर्यायी)",
    password: "पासवर्ड",
    confirmPassword: "पासवर्डची पुष्टी करा",
    fullName: "पूर्ण नाव",
    username: "वापरकर्ता नाव (Username)",
    village: "गाव",
    district: "जिल्हा",
    state: "राज्य",
    landSize: "जमिनीचा / शेताचा आकार",
    landUnit: "एकक",
    acres: "एकर",
    hectares: "हेक्टर",
    bigha: "बिघा",
    guntha: "गुंठा",
    villageAndDistrict: "गाव आणि जिल्हा",
    cropName: "मुख्य पिकाचे नाव",
    cropType: "हंगाम / पिकाचा प्रकार",
    sowingDate: "पेरणीची तारीख",
    tenure: "शेतकरी स्थिती",
    tenureOptions: {
      owner: "स्वतःची जमीन (मालक)",
      tenant: "भाडेकरू शेतकरी",
      sharecropper: "बटाईदार शेतकरी",
    },
    cropSeasons: {
      rabi: "रब्बी (हिवाळी हंगाम)",
      kharif: "खरीप (पावसाळी हंगाम)",
      zaid: "उन्हाळी हंगाम",
      cash: "नगदी पीक (व्यापारी)",
      horticulture: "फलोत्पादन (फळे/भाज्या)",
      pulses: "कडधान्ये व डाळी",
    },
    cropPhotoLabel: "पिकाचा फोटो अपलोड करा",
    cropPhotoHint: "पान, खोड किंवा पीक नमुना",
    landPhotoLabel: "शेताचा / जमिनीचा फोटो अपलोड करा",
    landPhotoHint: "माती किंवा शेत जमिनीची छायाचित्र",
    removePhoto: "काढून टाका",
    agreeTerms: "मी कृषी सेवेच्या अटी व गोपनीयता धोरणाशी सहमत आहे",
    rememberMe: "या डिव्हाइसवर मला आठवणीत ठेवा",
    signInBtn: "शेतकरी पोर्टलवर लॉगिन करा",
    createAccountBtn: "शेतकरी खाते तयार करा",
    demoQuickLogin: "डेमो लॉगिन पर्याय (एका क्लिकवर)",
    demoFarmer: "शेतकरी डेमो (ओम अतोले)",
    demoAdmin: "प्रशासक डेमो (Admin)",
    forgotInstructions: "पासवर्ड रीसेट करण्यासाठी नोंदणीकृत मोबाइल किंवा ईमेल टाका.",
    sendResetBtn: "रीसेट टोकन पाठवा",
    resetTokenLabel: "रीसेट टोकन",
    newPasswordLabel: "नवीन पासवर्ड",
    confirmResetBtn: "पासवर्ड बदला",
    backToSignIn: "साइन इनवर परत जा",
    passwordMismatch: "दोन्ही पासवर्ड जुळत नाहीत.",
    requiredFields: "कृपया सर्व आवश्यक माहिती भरा (*).",
    successReset: "पासवर्ड यशस्वीरीत्या बदलला! आता साइन इन करा.",
    privacyNote: "आपली शेतीविषयक माहिती पूर्णपणे सुरक्षित आहे.",
    alreadyHaveAccount: "आधीच नोंदणी केली आहे?",
    newToAgriSathi: "अॅग्रीसाथीवर नवीन आहात?",
  },
};

export default function Login({ locale, setLocale, onLogin }: LoginProps) {
  const t = i18nTexts[locale];
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  // Sign In State
  const [identifier, setIdentifier] = useState(demoCredentials.phone);
  const [password, setPassword] = useState(demoCredentials.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);

  // Land State
  const [regLandSize, setRegLandSize] = useState("2.5");
  const [regLandUnit, setRegLandUnit] = useState("acres");
  const [regVillage, setRegVillage] = useState("Niphad");
  const [regDistrict, setRegDistrict] = useState("Nashik");
  const [regState, setRegState] = useState("Maharashtra");
  const [regTenure, setRegTenure] = useState("Owner Cultivator");

  // Crop State
  const [regCrop, setRegCrop] = useState("Onion");
  const [regCropType, setRegCropType] = useState("Rabi");
  const [regSowingDate, setRegSowingDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  // Photo Upload State (Base64 data URLs)
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [landImage, setLandImage] = useState<string | null>(null);
  const [cropImageName, setCropImageName] = useState("");
  const [landImageName, setLandImageName] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password State
  const [forgotId, setForgotId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle Image Upload using FileReader
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>, type: "crop" | "land") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large. Please upload an image under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "crop") {
        setCropImage(dataUrl);
        setCropImageName(file.name);
      } else {
        setLandImage(dataUrl);
        setLandImageName(file.name);
      }
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (type: "crop" | "land") => {
    if (type === "crop") {
      setCropImage(null);
      setCropImageName("");
    } else {
      setLandImage(null);
      setLandImageName("");
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!identifier.trim() || !password) {
      setError(t.requiredFields);
      return;
    }

    setLoading(true);
    try {
      const profile = await apiLogin(identifier.trim(), password);
      onLogin(profile);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regName.trim() || !regPhone.trim() || !regPassword) {
      setError(t.requiredFields);
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!agreeTerms) {
      setError("Please accept the Agricultural Terms of Service to continue.");
      return;
    }

    setLoading(true);
    try {
      const profile = await apiRegister({
        name: regName.trim(),
        username: regUsername.trim() || undefined,
        phone: cleanPhone,
        email: regEmail.trim() || undefined,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        village: regVillage.trim(),
        district: regDistrict.trim(),
        state: regState.trim(),
        crop: regCrop.trim(),
        cropType: regCropType,
        sowingDate: regSowingDate,
        landSize: regLandSize,
        landUnit: regLandUnit,
        farmSize: `${regLandSize} ${regLandUnit}`,
        tenure: regTenure.trim(),
        cropImage: cropImage || undefined,
        landImage: landImage || undefined,
        agreeTerms,
      });
      onLogin(profile);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!forgotId.trim()) {
      setError("Please enter your registered mobile number or email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setForgotStep("reset");
        setSuccessMsg("Reset token generated! Enter your new password below.");
      } else {
        setSuccessMsg(data.message || "Instructions sent.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!resetToken.trim() || !newPassword || newPassword.length < 6) {
      setError("Please enter a valid token and password (min 6 characters).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(t.successReset);
      setTimeout(() => {
        setActiveTab("signin");
        setForgotStep("request");
        setIdentifier(forgotId);
        setPassword(newPassword);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (type: "farmer" | "admin") => {
    setError("");
    setSuccessMsg("");
    if (type === "farmer") {
      setIdentifier(demoCredentials.phone);
      setPassword(demoCredentials.password);
    } else {
      setIdentifier(adminCredentials.phone);
      setPassword(adminCredentials.password);
    }
    setActiveTab("signin");
  };

  return (
    <div className="login-shell min-h-screen">
      {/* Left Branding Panel (Rich Agricultural Hero) */}
      <section className="login-story">
        <div className="story-mark">
          <Sprout size={26} strokeWidth={2.4} />
        </div>
        <div className="story-brand">
          AgriSathi <span>किसान साथी · अॅग्रीसाथी</span>
        </div>
        <div className="story-content">
          <div className="eyebrow light">{t.brandTagline}</div>
          <h1>{t.welcome}</h1>
          <p>{t.welcomeSub}</p>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-emerald-100/90">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-amber-300 font-bold grid place-items-center text-xs">
                ✓
              </span>
              <span>Plot & Land Size Tracking (Acres, Hectares, Bigha, Guntha)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-100/90">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-amber-300 font-bold grid place-items-center text-xs">
                ✓
              </span>
              <span>Crop Lifecycle, Sowing Calendar & Variety Advisory</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-100/90">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-amber-300 font-bold grid place-items-center text-xs">
                ✓
              </span>
              <span>Visual Crop & Field Photo Diagnosis with AI/ICAR</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-100/90">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-amber-300 font-bold grid place-items-center text-xs">
                ✓
              </span>
              <span>Multilingual Kisan AI Advisory (English, हिंदी, मराठी)</span>
            </div>
          </div>

          <div className="story-profile mt-8">
            <div className="story-avatar">🌾</div>
            <div>
              <strong>Krishi Vigyan Advisory Network</strong>
              <span>
                <MapPin size={13} />
                Maharashtra APMC & ICAR Live Feeds
              </span>
            </div>
            <ShieldCheck size={20} className="text-emerald-300" />
          </div>
        </div>

        <div className="story-footnote">
          <span>01</span>
          <span>Verified Agricultural Network</span>
          <span>·</span>
          <span>OpenWeather · NASA POWER · Geoapify</span>
        </div>
      </section>

      {/* Right Interactive Form Panel */}
      <section className="login-panel">
        <div className="login-top">
          <div className="language-switcher" aria-label="Language">
            {(["en", "hi", "mr"] as Locale[]).map((id) => (
              <button
                key={id}
                className={locale === id ? "language-option is-active" : "language-option"}
                onClick={() => setLocale(id)}
              >
                {id === "en" ? "EN" : id === "hi" ? "हि" : "म"}
              </button>
            ))}
          </div>
          <div className="login-help">
            <Mic2 size={15} />
            <span>Voice Guide Ready</span>
          </div>
        </div>

        <div
          className={`login-form-wrap transition-all duration-300 ${
            activeTab === "register" ? "max-w-[580px] w-full" : "max-w-[420px] w-full"
          }`}
        >
          {/* Navigation Tab Header */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "signin"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => {
                setActiveTab("signin");
                setError("");
                setSuccessMsg("");
              }}
            >
              <LockKeyhole size={15} />
              <span>{t.tabSignIn}</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => {
                setActiveTab("register");
                setError("");
                setSuccessMsg("");
              }}
            >
              <Sprout size={15} />
              <span>{t.tabRegister}</span>
            </button>
            <button
              type="button"
              className={`py-2 px-2.5 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                activeTab === "forgot"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => {
                setActiveTab("forgot");
                setError("");
                setSuccessMsg("");
              }}
            >
              <KeyRound size={15} />
              <span>{t.tabForgot}</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================= */}
          {/* 1. SIGN IN (LOG IN) TAB                                      */}
          {/* ============================================================= */}
          {activeTab === "signin" && (
            <div>
              <div className="eyebrow">{t.tabSignIn}</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                {t.tabSignIn}
              </h2>
              <p className="login-subtitle mb-5">{t.welcomeSub}</p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700 mb-1 block">
                    {t.phoneOrEmail} *
                  </span>
                  <div className="input-wrap flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                    <User size={17} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      className="bg-transparent w-full text-sm outline-none"
                      placeholder="e.g. 9876543210 or ramesh_nashik"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700">{t.password} *</span>
                    <button
                      type="button"
                      className="text-xs text-emerald-700 hover:underline"
                      onClick={() => setActiveTab("forgot")}
                    >
                      {t.tabForgot}
                    </button>
                  </div>
                  <div className="input-wrap flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                    <LockKeyhole size={17} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="bg-transparent w-full text-sm outline-none"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 ml-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-700 accent-emerald-700"
                    />
                    <span>{t.rememberMe}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-md hover:shadow-lg mt-2"
                >
                  <span>{loading ? "Signing in..." : t.signInBtn}</span>
                  <ArrowRight size={17} />
                </button>
              </form>

              {/* Switch link */}
              <div className="text-center text-xs text-slate-500 mt-5">
                {t.newToAgriSathi}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setError("");
                  }}
                  className="text-emerald-700 font-bold hover:underline ml-1"
                >
                  {t.createAccountBtn}
                </button>
              </div>

              {/* Quick Demo Logins Box */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {t.demoQuickLogin}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition"
                    onClick={() => fillQuickDemo("farmer")}
                  >
                    <div className="text-xs font-bold text-emerald-900">{t.demoFarmer}</div>
                    <div className="text-[11px] text-emerald-700">9876543210 · kisan123</div>
                  </button>
                  <button
                    type="button"
                    className="p-2.5 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition"
                    onClick={() => fillQuickDemo("admin")}
                  >
                    <div className="text-xs font-bold text-amber-900">{t.demoAdmin}</div>
                    <div className="text-[11px] text-amber-700">9999999999 · Admin@agrisathi2026</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 2. FARMER REGISTRATION (SIGN UP) TAB                         */}
          {/* ============================================================= */}
          {activeTab === "register" && (
            <div>
              <div className="eyebrow">{t.tabRegister}</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                {t.createAccountBtn}
              </h2>
              <p className="login-subtitle mb-4">
                Register your farm and crop details once to receive personalized precision farming recommendations.
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* --------------------------------------------------------- */}
                {/* Section 1: Farmer Personal Details                        */}
                {/* --------------------------------------------------------- */}
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <User size={14} className="text-emerald-700" />
                    <span>1. Farmer Personal Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.fullName} *
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <User size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          required
                          type="text"
                          placeholder="e.g. Ramesh Pawar"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.username} *
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <span className="text-slate-400 mr-2 text-xs font-bold shrink-0">@</span>
                        <input
                          required
                          type="text"
                          placeholder="e.g. ramesh_nashik"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.phone} *
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <Phone size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          required
                          type="tel"
                          placeholder="10-digit mobile"
                          pattern="[0-9]{10}"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.email}
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <Mail size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          type="email"
                          placeholder="farmer@example.com"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.password} *
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <LockKeyhole size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          required
                          type={regShowPassword ? "text" : "password"}
                          placeholder="Min 6 characters"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 ml-1"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                        >
                          {regShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.confirmPassword} *
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <LockKeyhole size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          required
                          type={regShowConfirm ? "text" : "password"}
                          placeholder="Re-enter password"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 ml-1"
                          onClick={() => setRegShowConfirm(!regShowConfirm)}
                        >
                          {regShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>

                {/* --------------------------------------------------------- */}
                {/* Section 2: Land & Location Details                        */}
                {/* --------------------------------------------------------- */}
                <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <MapPin size={14} className="text-amber-700" />
                    <span>2. Land & Location Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.landSize} & {t.landUnit} *
                      </span>
                      <div className="grid grid-cols-[1fr_110px] gap-2">
                        <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                          <span className="text-slate-400 mr-1 text-xs shrink-0">📐</span>
                          <input
                            required
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="e.g. 2.5"
                            className="bg-transparent w-full text-sm outline-none"
                            value={regLandSize}
                            onChange={(e) => setRegLandSize(e.target.value)}
                          />
                        </div>
                        <select
                          className="bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                          value={regLandUnit}
                          onChange={(e) => setRegLandUnit(e.target.value)}
                        >
                          <option value="acres">{t.acres}</option>
                          <option value="hectares">{t.hectares}</option>
                          <option value="bigha">{t.bigha}</option>
                          <option value="guntha">{t.guntha}</option>
                        </select>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.tenure} *
                      </span>
                      <select
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 outline-none w-full h-[47px]"
                        value={regTenure}
                        onChange={(e) => setRegTenure(e.target.value)}
                      >
                        <option value="Owner Cultivator">{t.tenureOptions.owner}</option>
                        <option value="Tenant cultivator">{t.tenureOptions.tenant}</option>
                        <option value="Sharecropper">{t.tenureOptions.sharecropper}</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        {t.village} *
                      </span>
                      <input
                        required
                        placeholder={t.village}
                        value={regVillage}
                        onChange={(e) => setRegVillage(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        {t.district} *
                      </span>
                      <input
                        required
                        placeholder={t.district}
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        {t.state} *
                      </span>
                      <input
                        required
                        placeholder={t.state}
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none w-full"
                      />
                    </label>
                  </div>
                </div>

                {/* --------------------------------------------------------- */}
                {/* Section 3: Crop Information                               */}
                {/* --------------------------------------------------------- */}
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <Sprout size={14} className="text-emerald-700" />
                    <span>3. Crop Lifecycle & Season</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.cropName} *
                      </span>
                      <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                        <span className="text-slate-400 mr-2 text-sm shrink-0">🧅</span>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Onion, Wheat, Tomato"
                          className="bg-transparent w-full text-sm outline-none"
                          value={regCrop}
                          onChange={(e) => setRegCrop(e.target.value)}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">
                        {t.cropType} *
                      </span>
                      <select
                        required
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 outline-none w-full h-[47px]"
                        value={regCropType}
                        onChange={(e) => setRegCropType(e.target.value)}
                      >
                        <option value="Rabi">{t.cropSeasons.rabi}</option>
                        <option value="Kharif">{t.cropSeasons.kharif}</option>
                        <option value="Zaid">{t.cropSeasons.zaid}</option>
                        <option value="Cash Crop">{t.cropSeasons.cash}</option>
                        <option value="Horticulture">{t.cropSeasons.horticulture}</option>
                        <option value="Pulses">{t.cropSeasons.pulses}</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 mb-1 block">
                      {t.sowingDate} *
                    </span>
                    <div className="input-wrap flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                      <Calendar size={16} className="text-slate-400 mr-2 shrink-0" />
                      <input
                        required
                        type="date"
                        className="bg-transparent w-full text-sm outline-none"
                        value={regSowingDate}
                        onChange={(e) => setRegSowingDate(e.target.value)}
                      />
                    </div>
                  </label>
                </div>

                {/* --------------------------------------------------------- */}
                {/* Section 4: Crop & Land Photographs (Uploads)              */}
                {/* --------------------------------------------------------- */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <ImageIcon size={14} className="text-emerald-700" />
                    <span>4. Crop & Field Photographs (Optional Upload)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Crop Image Upload Box */}
                    <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-3 bg-white text-center transition relative flex flex-col items-center justify-center min-h-[130px]">
                      {cropImage ? (
                        <div className="w-full flex flex-col items-center">
                          <img
                            src={cropImage}
                            alt="Crop preview"
                            className="h-20 w-full object-cover rounded-lg border border-emerald-200 shadow-sm"
                          />
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-full mt-1.5">
                            {cropImageName || "crop_photo.jpg"}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto("crop")}
                            className="mt-1 text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                          >
                            <X size={12} />
                            <span>{t.removePhoto}</span>
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, "crop")}
                          />
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center mb-1.5">
                            <UploadCloud size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {t.cropPhotoLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {t.cropPhotoHint}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Land Image Upload Box */}
                    <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-3 bg-white text-center transition relative flex flex-col items-center justify-center min-h-[130px]">
                      {landImage ? (
                        <div className="w-full flex flex-col items-center">
                          <img
                            src={landImage}
                            alt="Land preview"
                            className="h-20 w-full object-cover rounded-lg border border-amber-200 shadow-sm"
                          />
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-full mt-1.5">
                            {landImageName || "land_photo.jpg"}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto("land")}
                            className="mt-1 text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                          >
                            <X size={12} />
                            <span>{t.removePhoto}</span>
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, "land")}
                          />
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 grid place-items-center mb-1.5">
                            <Trees size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {t.landPhotoLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {t.landPhotoHint}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 accent-emerald-700"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer">
                    {t.agreeTerms}
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-md hover:shadow-lg mt-3"
                >
                  <span>{loading ? "Registering Farmer Account..." : t.createAccountBtn}</span>
                  <ArrowRight size={17} />
                </button>
              </form>

              {/* Back to Sign In Link */}
              <div className="text-center text-xs text-slate-500 mt-5">
                {t.alreadyHaveAccount}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signin");
                    setError("");
                  }}
                  className="text-emerald-700 font-bold hover:underline ml-1"
                >
                  {t.tabSignIn}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 3. FORGOT PASSWORD TAB                                        */}
          {/* ============================================================= */}
          {activeTab === "forgot" && (
            <div>
              <div className="eyebrow">{t.tabForgot}</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                {t.tabForgot}
              </h2>
              <p className="login-subtitle mb-5">{t.forgotInstructions}</p>

              {forgotStep === "request" ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 mb-1 block">
                      {t.phoneOrEmail} *
                    </span>
                    <div className="input-wrap flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                      <Phone size={17} className="text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="e.g. 9876543210 or farmer@agrisathi.in"
                        className="bg-transparent w-full text-sm outline-none"
                        value={forgotId}
                        onChange={(e) => setForgotId(e.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-sm"
                  >
                    <span>{loading ? "Generating..." : t.sendResetBtn}</span>
                    <KeyRound size={17} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetConfirm} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 mb-1 block">
                      {t.resetTokenLabel} *
                    </span>
                    <div className="input-wrap flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                      <KeyRound size={17} className="text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Enter token"
                        className="bg-transparent w-full text-sm outline-none"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700 mb-1 block">
                      {t.newPasswordLabel} *
                    </span>
                    <div className="input-wrap flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                      <LockKeyhole size={17} className="text-slate-400 mr-2 shrink-0" />
                      <input
                        type="password"
                        placeholder="Enter at least 6 characters"
                        className="bg-transparent w-full text-sm outline-none"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-sm"
                  >
                    <span>{loading ? "Updating..." : t.confirmResetBtn}</span>
                    <ArrowRight size={17} />
                  </button>
                </form>
              )}

              <div className="mt-5 text-center">
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-emerald-700 font-semibold"
                  onClick={() => {
                    setActiveTab("signin");
                    setError("");
                  }}
                >
                  ← {t.backToSignIn}
                </button>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-8 pt-4 border-t border-slate-200/60 text-center text-[11px] text-slate-400">
            {t.privacyNote}
          </div>
        </div>
      </section>
    </div>
  );
}
