# ListOnTheGo 📝

**AI-Powered Productivity Desktop Application**

A modern desktop application that leverages local/remote LLM providers to extract actionable todos from text, create intelligent notes with summaries, and manage productivity workflows. Built with a sleek monochrome interface.

![ListOnTheGo](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tauri](https://img.shields.io/badge/Tauri-2.x-orange) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-cyan)

## ✨ Features

### 🤖 **AI-Powered Todo Extraction**
- Extract actionable todos from any text (meeting notes, transcripts, documents)
- Support for local and remote LLM providers (OpenAI-compatible APIs)
- Smart categorization and priority assignment

### 📝 **Intelligent Note Management**
- Create and manage notes with AI-generated summaries
- Extract action points automatically
- Convert action points to todos with one click
- Real-time search and organization

### 🎯 **Advanced Habit Tracking**
- GitHub-style streak visualization with contribution grid
- Daily, weekly, and monthly habit frequencies
- Categories (Health, Learning, Fitness, Mindfulness, Productivity)
- Goal setting and progress tracking

### 📊 **Customizable Dashboard**
- Bento Grid layout with draggable widgets
- Real-time productivity metrics
- Quick actions for todos, notes, and habits
- Personalized layout persistence

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri 2.x (Rust backend)
- **Mobile**: Android (via Tauri Mobile)
- **Styling**: TailwindCSS v4 + Inter font
- **Icons**: Lucide React
- **Storage**: IndexedDB + LocalStorage
- **AI**: OpenAI-compatible API integration

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aruntemme/listonthego.git
   cd listonthego
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## ⚙️ Configuration

### LLM Setup

1. Navigate to the **Settings** tab
2. Configure your LLM provider:
   - **Local**: Default `http://localhost:11434/v1` with `gemma3:4b`
   - **OpenAI**: Add your API key and select model
   - **Custom**: Configure any OpenAI-compatible endpoint

### Default Configuration
```javascript
{
  provider: "Local LLM",
  baseUrl: "http://localhost:11434/v1",
  model: "gemma3:4b",
  apiKey: "" // Optional for local providers
}
```

## 📱 Usage

### Todo Management
- Paste text into the extraction area and click "Extract Todos"
- Set priorities (High, Medium, Low) and due dates
- Organize with categories and tags
- Use bulk operations for efficiency

### Note Taking
- Create notes with AI-generated summaries
- Extract action points automatically
- Convert insights to actionable todos
- Search and organize your knowledge

### Habit Tracking
- Add daily, weekly, or monthly habits
- Track streaks with visual feedback
- Monitor progress with detailed statistics
- Set goals and celebrate milestones

### Dashboard
- Customize your workspace with draggable widgets
- Get real-time insights on productivity
- Quick access to recent todos and notes
- Monitor habit completion at a glance

## 📱 Android Development

ListOnTheGo supports Android mobile development through Tauri's mobile capabilities. Follow these steps to set up Android development and build your mobile app.

### 📋 Android Prerequisites

1. **Java Development Kit (JDK) 17+**
   ```bash
   # Install via Homebrew (macOS)
   brew install openjdk@17
   
   # Add to your shell profile (~/.zshrc or ~/.bashrc)
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
   export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
   ```

2. **Android Studio** or **Android Command Line Tools**
   ```bash
   # Install Android Studio (recommended)
   brew install android-studio
   
   # Or install command line tools only
   brew install android-commandlinetools
   ```

3. **Android SDK and NDK**
   - Android SDK will be installed automatically with Android Studio
   - Location: `~/Library/Android/sdk` (macOS)
   
4. **Environment Variables**
   Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   export ANDROID_HOME=~/Library/Android/sdk
   export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools
   ```

### 🔧 Android Setup

1. **Install Android NDK**
   ```bash
   # Using SDK Manager
   $ANDROID_HOME/tools/bin/sdkmanager "ndk;25.2.9519653"
   ```

2. **Install Tauri CLI with mobile support**
   ```bash
   cargo install tauri-cli --version "^2.0"
   ```

3. **Initialize Android project**
   ```bash
   cargo tauri android init
   ```

### 🏗️ Building Android App

#### Quick Build (Using the provided script)
```bash
# Make the script executable (first time only)
chmod +x build-android.sh

# Build the Android app
./build-android.sh
```

#### Manual Build
```bash
# Set environment variables
export ANDROID_HOME=~/Library/Android/sdk
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# Build the app
cargo tauri android build
```

### 📦 Build Outputs

After a successful build, you'll find:

- **APK** (for direct installation): 
  ```
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
  ```

- **AAB** (for Google Play Store):
  ```
  src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab
  ```

### 📱 Testing Your Android App

#### Option 1: Install on Device/Emulator
```bash
# Check connected devices
adb devices

# Install the APK
adb install src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

#### Option 2: Using Android Studio
1. Open Android Studio
2. Open the project at `src-tauri/gen/android/`
3. Connect your device or create an emulator
4. Click "Run" to install and launch


#### Build Script Features

The included `build-android.sh` script:
- ✅ Sets all required environment variables
- ✅ Builds the Android app
- ✅ Shows output file locations
- ✅ Provides installation commands
- ✅ Handles error reporting

### 🎨 Android-Specific Customization

The Android app includes:
- **Custom App Icon**: Uses the memo.png logo across all density folders
- **Splash Screen**: Configured in the Android manifest
- **App Name**: "ListOnTheGo - AI-Powered Productivity"
- **Package Name**: `com.listonthego.app`

To customize further, edit files in:
```
src-tauri/gen/android/app/src/main/res/
├── drawable/          # App icons and splash
├── mipmap-*/         # App launcher icons (different densities)
├── values/           # App configuration
└── xml/              # Android system settings
```

### 📖 Detailed Android Development Guide

For comprehensive Android development instructions, including advanced configuration, troubleshooting, and deployment strategies, see the complete guide:

**[📱 Android Development Guide](./docs/ANDROID_DEVELOPMENT.md)**

This detailed guide covers:
- Cross-platform setup (macOS, Linux, Windows)
- Advanced build configurations
- Performance optimization techniques
- Publishing to Google Play Store
- Comprehensive troubleshooting solutions

## 🚀 Upcoming Features

- [ ] **Rich text editor** with note templates and file attachments
- [ ] **Advanced AI features** including multiple LLM providers and custom prompts
- [ ] **Cloud sync** with data export/import and backup functionality
- [ ] **iOS app** and enhanced cross-platform synchronization
- [ ] **Smart notifications** for habits, overdue tasks, and reminders
- [ ] **Third-party integrations** including calendar, email, and web clipper
- [ ] **Dark mode** and custom themes for enhanced user experience

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) for cross-platform desktop development
- UI inspired by modern Mac application design
- Icons provided by [Lucide](https://lucide.dev/)
- Typography powered by [Inter](https://rsms.me/inter/)

---

**Made with ❤️ for productivity enthusiasts**
