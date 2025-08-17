[EN]
“MaçBul” is a mobile and web‐based platform that brings together players in Turkey who want to organize indoor soccer matches.

* **Purpose**: To allow individuals or groups who cannot find enough players to view nearby open matches and register with a single click.

* **Key Features**:

  * User registration (email/phone + password), profile information, and referral code system
  * Paid match listings (field name, date‐time, fee), sorted listings, and field location on a map
  * Wallet system: balance top‐up, payment, refund, and transaction history tracking
  * Dynamic overall scoring: a score between 0–100 that is updated based on user performance
  * Automatic team matching: teams are arranged so that their average scores are balanced
  * Post‐match feedback: player rating, comments, and reporting capability
  * Real‐time participation notifications (via WebSocket/SSE)
  * Match videos and goal highlights (video metadata stored as a URL)
  * Complaint management and admin notification module

* **Technology Stack**:

  * **Database**: MariaDB (UUID and epoch‐millis based time fields)
  * **Backend**: Java Spring Boot (REST API, security, data access layer)
  * **Frontend**: React Native (iOS/Android applications) and an optional web interface

Thus, “MaçBul” offers rapid prototyping and a scalable infrastructure while making it easy for users to socially participate in indoor soccer matches.


<img src="images/screen1.png" alt="Açıklama" width="200" />


<img src="images/screen2.png" alt="Açıklama" width="200" />


<img src="images/screen3.png" alt="Açıklama" width="200" />



[TR]
“MaçBul”, Türkiye’de halı saha maçı organize etmek isteyen oyuncuları bir araya getiren mobil ve web tabanlı bir platformdur.

* **Amaç**: Yeterli oyuncu bulamayan bireylerin veya grupların, yakınlarındaki açık maçları görmesini ve tek tıkla kaydolmasını sağlamak.

* **Temel Özellikler**:

  * Kullanıcı kaydı (e-posta/telefon + şifre), profil bilgileri ve referans kodu sistemi
  * Ücretli maç ilanları (saha adı, tarih-saat, ücret), sıralı listeleme ve harita üzerinden saha konumu
  * Cüzdan sistemi: bakiye yükleme, ödeme, iade ve işlem geçmişi takibi
  * Dinamik overall puanlama: kullanıcı performansına göre 0–100 arası güncellenen skor
  * Otomatik takım eşleştirme: iki takımın ortalama puanları dengeli olacak şekilde dağıtım
  * Maç sonrası geri bildirim: oyuncu puanlama, yorum ve raporlama imkanı
  * Gerçek zamanlı katılım bildirimleri (WebSocket/SSE ile)
  * Maç videoları ve gol kesitleri (video meta verisi URL olarak saklanır)
  * Şikayet yönetimi ve admin bildirim modülü

* **Teknoloji Yığını**:

  * **Veritabanı**: MariaDB (UUID ve epoch-millis bazlı zaman alanları)
  * **Backend**: Java Spring Boot (REST API, güvenlik, veri erişim katmanı)
  * **Frontend**: React Native (iOS/Android uygulamaları) ve isteğe bağlı web arayüzü

Bu sayede “MaçBul”, hızlı prototipleme ve ölçeklenebilir bir altyapı sunarken, kullanıcıların sosyal olarak halı saha maçlarına katılmasını kolaylaştırır.


This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
