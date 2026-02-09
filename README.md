# Infinite Draft Ops

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss&logoColor=white)
![Powered by Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?logo=google&logoColor=white)

**Infinite Draft Ops** is a competitive creature-battling simulator where every choice has a consequence. Built with React and TypeScript, it features a high-stakes "Draft & Discard" phase where you build a team of 3, knowing that every Pokémon you reject joins the enemy team. The opponent is powered by Google Gemini, which generates real-time tactical decision logs to explain its combat strategy.

## 🚀 Key Features

* **⚖️ Draft & Discard System**: You don't just pick your team; you pick your poison. You draft **3 Pokémon**, and the enemy team is automatically populated with the creatures you discarded.
* **🧠 AI Strategic Decisions**: The AI opponent doesn't just blindly attack. It uses Google Gemini to generate **Battle Decisions**, providing a tactical log of *why* it chose a specific move against you (e.g., "Predicting switch," "Targeting weakness").
* **⚔️ Complete Battle Engine**: Features a custom-built battle system including:
    * Physical/Special damage split
    * Type effectiveness charts
    * Status effects (Burn, Sleep, Paralysis, etc.)
    * Critical hits and STAB (Same Type Attack Bonus)
* **⚡ Fast & Modern UI**: Built with Vite and Tailwind CSS for a responsive, lag-free experience.

## 🛠️ Tech Stack

* **Frontend Framework**: React 19
* **Build Tool**: Vite
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **State Management**: Zustand
* **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)
* **Icons**: Lucide React

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or yarn
* A Google Gemini API Key (Get one [here](https://aistudio.google.com/app/apikey))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/toad-of-code/infinite-draft-ops.git
    cd infinite-draft-ops
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory by copying the example:
    ```bash
    cp .env.example .env
    ```

    Open `.env` and paste your Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## 🎮 How to Play

1.  **Home Phase**: Start a new game and select your difficulty.
2.  **Draft Phase**:
    * Review the available pool of creatures.
    * Select **3** for your team.
    * *Watch out:* The remaining Pokémon will immediately form the Enemy Team.
3.  **Battle Phase**:
    * Select moves to attack the opponent.
    * Manage your HP and PP.
    * Read the **AI Decision Log** to see the strategic reasoning behind the bot's attacks.
4.  **Result Phase**: View the outcome and restart the simulation.

## 🧠 AI Integration Details

This project uses `gemini-3-flash-preview` for high-speed inference. The AI is responsible for:

* **`generateBattleDecision`**: Instead of generic flavor text, the AI analyzes the board state (HP, Types, Moveset) to output a calculated decision. It roleplays as a tactical battle computer, explaining the logic behind its move selection.
* **`generateFakemonName`**: Creates creative, competitive-style nicknames for creatures based on their type and original species.

## 📂 Project Structure

```text
src/
├── api/             # Gemini AI integration (Decisions & Naming)
├── assets/          # Static images and icons
├── components/      # React components (BattleArena, DraftScreen, etc.)
├── store/           # Zustand state management (useGameStore)
├── utils/           # Core game logic (damage calc, type charts)
├── App.tsx          # Main application entry
└── main.tsx         # React DOM rendering

```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source. [Add License Link Here]

---

*Note: This project is a fan-made simulation and is not affiliated with Nintendo, Game Freak, or The Pokémon Company.*
