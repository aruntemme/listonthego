# 🎉 ListOnTheGo v0.1.0 Beta Release

**AI-Powered Productivity Desktop Application**

We're excited to announce the first beta release of ListOnTheGo! This powerful desktop application leverages AI to transform your productivity workflow with intelligent todo extraction, smart note management, and comprehensive habit tracking.

## ✨ What's New in v0.1.0 Beta

### 🤖 **AI-Powered Todo Extraction**
- Extract actionable todos from any text (meeting notes, transcripts, documents)
- Support for local and remote LLM providers (OpenAI-compatible APIs)
- Smart categorization and priority assignment
- Bulk operations for efficient task management

### 📝 **Intelligent Note Management**
- Create and manage notes with AI-generated summaries
- Automatic action point extraction from notes
- One-click conversion from action points to todos
- Real-time search and organization capabilities

### 🎯 **Advanced Habit Tracking**
- GitHub-style streak visualization with contribution grid
- Daily, weekly, and monthly habit frequencies
- Pre-defined categories: Health, Learning, Fitness, Mindfulness, Productivity
- Goal setting and progress tracking with detailed statistics

### 📊 **Customizable Dashboard**
- Bento Grid layout with draggable widgets
- Real-time productivity metrics and insights
- Quick actions for todos, notes, and habits
- Personalized layout persistence across sessions

### 📱 **Cross-Platform Support**
- **Desktop**: Native Windows, macOS, and Linux support via Tauri
- **Mobile**: Android app support (APK/AAB builds available)
- **Storage**: Local-first with IndexedDB for data persistence

## 🛠️ Technical Specifications

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop Framework**: Tauri 2.x (Rust backend)
- **Mobile**: Android via Tauri Mobile
- **Styling**: TailwindCSS v4 with Inter font
- **Icons**: Lucide React icon library
- **Storage**: IndexedDB + LocalStorage (local-first approach)
- **AI Integration**: OpenAI-compatible API support

## ⚠️ Security Notice - Unsigned Binaries

**Important**: These builds are **not code-signed** (we're an open-source project without budget for certificates). Your operating system will show security warnings when running the app.

### macOS Users
macOS will block the app with "App is damaged and can't be opened." Here's how to bypass:

**Option 1: Remove Quarantine (Recommended)**
```bash
# Navigate to your Downloads folder and run:
sudo xattr -rd com.apple.quarantine listonthego_0.1.0_aarch64.dmg
# Then mount the DMG and drag to Applications
```

**Option 2: System Preferences**
1. Try to open the app (it will fail)
2. Go to **System Preferences** → **Security & Privacy** → **General**
3. Click **"Open Anyway"** next to the ListOnTheGo warning

### Windows Users
Windows Defender SmartScreen will show "Windows protected your PC":

1. Click **"More info"** 
2. Click **"Run anyway"** button
3. The app will install normally

### Linux Users
Most Linux distributions won't block the AppImage or DEB package, but you may need to:
```bash
# Make AppImage executable
chmod +x ListOnTheGo_0.1.0_amd64.AppImage
```

### Alternative: Build It Yourself
If you're uncomfortable with unsigned binaries, you can build from source:
```bash
git clone https://github.com/aruntemme/listonthego.git
cd listonthego
npm install
npm run tauri build
```

## ⚙️ Quick Setup

### LLM Configuration
1. Open ListOnTheGo and navigate to **Settings**
2. Configure your preferred LLM provider:
   - **Local**: Default `http://localhost:11434/v1` with `gemma3:4b`
   - **OpenAI**: Add your API key and select model
   - **Custom**: Configure any OpenAI-compatible endpoint

### First Steps
1. **Dashboard**: Customize your workspace with draggable widgets
2. **Todos**: Paste text and click "Extract Todos" to see AI magic
3. **Notes**: Create your first note and watch automatic summarization
4. **Habits**: Add a habit and start building streaks

## 🚧 Beta Limitations & Known Issues

This is a **beta release** - expect some rough edges:

- **Performance**: Large datasets may cause occasional slowdowns
- **AI Responses**: Quality depends on your LLM provider configuration
- **Mobile**: Android app is functional but may have UI scaling issues
- **Sync**: No cloud synchronization yet (local storage only)
- **Themes**: Only light mode available (dark mode coming soon or maybe never)

## 🐛 Reporting Issues

Found a bug or have feedback? We'd love to hear from you!

- **GitHub Issues**: [Create an issue](https://github.com/aruntemme/listonthego/issues)
- **Feature Requests**: Use the "enhancement" label
- **Bug Reports**: Include your OS, app version, and steps to reproduce

## 🛣️ What's Next?

### v0.2.0 Roadmap
- [ ] Rich text editor with templates
- [ ] Advanced AI features with multiple providers
- [ ] Smart notifications system

### v0.3.0 Goals
- [ ] Third-party integrations (calendar, email)
- [ ] Advanced analytics and insights
- [ ] Team collaboration features
- [ ] Dark mode and custom themes
- [ ] iOS app development
- [ ] Cloud sync and data backup
- [ ] Plugin system for extensibility


## 📄 License

ListOnTheGo is released under the MIT License. See [LICENSE](LICENSE) for details.

---

**Ready to supercharge your productivity?** Download v0.1.0 beta and let AI transform how you manage todos, notes, and habits!