# Quran Learn (Android app)

## Pehli app mein masla kya tha
Pehle wali app asal mein ek **website thi jo PWABuilder se APK mein lapeti gayi thi** (TWA). Aisi app Chrome ke zariye chalti hai, is liye install ke baad wo Chrome se connected nazar aati thi, aur Digital Asset Links ka masla bhi aata tha.

## Ab kya hai
Ye ek **asal standalone Android app** hai. Poora UI aur poora Quran data APK ke andar hai. Chrome nahi khulta, internet ki zaroorat nahi, aur app koi permission nahi maangti.

**Features**
- 114 surahs (Arabic naam, English matlab, ayat ki tadaad, Makki/Madani) aur 30 Juz ki list
- Surah reader: Arabic + Urdu / English / Sindhi tarjuma (jo chahein on/off), text size A- / A+, kisi bhi ayah par jump
- Last read position khud save hoti hai, Home par "Continue reading"
- Ayah par bookmark, copy, share
- Search: Arabic (harakat ke baghair bhi), Urdu, English, Sindhi, ya reference jaise 2:255
- Ayah of the day
- Learn: Arabic Grammar lessons, Quiz (score history ke saath), offline Learning Assistant
- Light / Sepia / Dark theme, Auto (phone ki setting)
- Android ka back button theek tarah kaam karta hai

## APK kaise banayen (software install kiye baghair)
Mere paas yahan Android ke build servers tak rasai nahi thi, is liye APK maine yahan nahi banaya. GitHub ka free build ye kaam kar dega:

1. github.com par account banayen, phir **New repository** (naam: `quranlearn`, Public ya Private).
2. Is zip ko extract karein. Repository ke page par **Add file > Upload files** dabayen, aur extract kiye hue folder ke **andar ki sab cheezein** (app, gradle, .github, build.gradle, settings.gradle, gradlew ...) drag karein. **Commit changes** dabayen.
   - Agar `.github` folder upload na ho: **Add file > Create new file**, naam mein likhen `.github/workflows/build-apk.yml` aur is project ki wahi file ka matn paste kar dein.
3. Repository mein **Actions** tab kholein. "Build Android APK" khud chalega (4 se 8 minute). Na chale to us par click karke **Run workflow** dabayen.
4. Hare tick ke baad us run ko kholein, neeche **Artifacts** mein `QuranLearn-APK` download karein, zip kholein, andar `app-debug.apk` hai.
5. APK phone mein bhejein (WhatsApp / USB / Drive), kholein, aur "Install unknown apps" ki ijazat dein.

**Doosra tareeqa:** Android Studio install karke is folder ko Open karein, phir **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Agar build fail ho to Actions ka error log mujhe bhej dein, main theek kar dunga.

## Aham baatein
- Ye `debug` APK hai: dost ya testing ke liye theek hai. **Google Play** ke liye signed release (AAB) chahiye hoga, wo agla qadam hai.
- Quran ka text Tanzil.net se hai (unchanged, CC BY 3.0). Tarjume Tanzil se **sirf ghair-tijarati** istemal ke liye hain. Play Store par daalne se pehle unki ijazat ya tijarati tarjume lein.
- Grammar ke lessons, quiz aur assistant ke jawabat kisi ustaad se zaroor check karwayein.
- Behtar Arabic font: build ke dauran Amiri Quran font khud download hota hai. Download na ho to phone ka apna Arabic font use hota hai, app phir bhi theek chalti hai.

## Folder ka naqsha
- `app/src/main/assets/www/` : app ka poora UI (index.html, css, js) aur Quran data
- `app/src/main/java/.../MainActivity.java` : Android ka native hissa (WebView, back button, share)
- `.github/workflows/build-apk.yml` : GitHub par APK banane ka kaam
